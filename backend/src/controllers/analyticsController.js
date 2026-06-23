import Call from '../models/Call.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

const formatDateKey = (date, timeZone) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

// @desc    Get dashboard metrics and graphs
// @route   GET /api/v1/analytics/dashboard
// @access  Private
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const hospitalId = req.hospitalId;

    if (!hospitalId) {
      return res.status(200).json({ success: true, message: 'Super admin dashboard details' });
    }

    // 1. Gather baseline document counts in parallel
    const [
      totalCalls,
      completedCalls,
      missedCalls,
      appointmentsBooked,
      bookedCalls,
      escalatedCalls,
      durationStats,
    ] = await Promise.all([
      Call.countDocuments({ hospitalId }),
      Call.countDocuments({ hospitalId, status: 'completed' }),
      Call.countDocuments({ hospitalId, status: { $in: ['failed', 'ringing'] } }),
      Appointment.countDocuments({ hospitalId }),
      Call.countDocuments({ hospitalId, appointmentBooked: true }),
      Call.countDocuments({ hospitalId, escalated: true }),
      Call.aggregate([
        { $match: { hospitalId, status: 'completed' } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
      ]),
    ]);

    const bookingConversionRate = totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0;
    const aiSuccessRate = totalCalls > 0 ? Math.round(((totalCalls - escalatedCalls) / totalCalls) * 100) : 0;
    const averageCallDuration = durationStats.length > 0 ? Math.round(durationStats[0].avgDuration) : 0;

    // 2. Fetch today's appointments for dashboard table
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayAppointmentsPromise = Appointment.find({
      hospitalId,
      appointmentTime: { $gte: startOfToday, $lte: endOfToday },
    })
      .populate('doctorId', 'name specialization')
      .sort({ appointmentTime: 1 })
      .limit(5);

    // 3. Aggregate Call Volume Trends.
    // If there is no current-week activity, anchor to the latest call or
    // appointment so sparse demo/client data still produces a useful chart.
    const clinicTimeZone = process.env.CLINIC_TIMEZONE || 'Asia/Kolkata';
    const currentWindowStart = new Date();
    currentWindowStart.setDate(currentWindowStart.getDate() - 6);
    currentWindowStart.setHours(0, 0, 0, 0);
    const [todayAppointments, latestCall, latestAppointment] = await Promise.all([
      todayAppointmentsPromise,
      Call.findOne({ hospitalId }).sort({ createdAt: -1 }).select('createdAt').lean(),
      Appointment.findOne({ hospitalId, status: { $in: ['scheduled', 'pending', 'completed'] } })
        .sort({ appointmentTime: -1 })
        .select('appointmentTime')
        .lean(),
    ]);
    const latestActivityDate = [latestCall?.createdAt, latestAppointment?.appointmentTime]
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    const trendEndDate = latestActivityDate && latestActivityDate < currentWindowStart
      ? new Date(latestActivityDate)
      : new Date();
    trendEndDate.setHours(23, 59, 59, 999);
    const trendStartDate = new Date(trendEndDate);
    trendStartDate.setDate(trendStartDate.getDate() - 6);
    trendStartDate.setHours(0, 0, 0, 0);

    const [callTrendsAgg, appointmentTrendsAgg, sentimentAgg, hourlyDistributionAgg] = await Promise.all([
      Call.aggregate([
        { $match: { hospitalId, createdAt: { $gte: trendStartDate, $lte: trendEndDate } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: clinicTimeZone,
              },
            },
            calls: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Appointment.aggregate([
        {
          $match: {
            hospitalId,
            appointmentTime: { $gte: trendStartDate, $lte: trendEndDate },
            status: { $in: ['scheduled', 'pending', 'completed'] },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$appointmentTime',
                timezone: clinicTimeZone,
              },
            },
            booked: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Call.aggregate([
        { $match: { hospitalId } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } },
      ]),
      Call.aggregate([
        { $match: { hospitalId } },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const trendMap = new Map(callTrendsAgg.map((item) => [item._id, item]));
    const appointmentTrendMap = new Map(appointmentTrendsAgg.map((item) => [item._id, item]));
    const callTrends = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(trendStartDate);
      date.setDate(trendStartDate.getDate() + index);
      const dateKey = formatDateKey(date, clinicTimeZone);
      const trend = trendMap.get(dateKey);
      const appointmentTrend = appointmentTrendMap.get(dateKey);

      return {
        date: dateKey,
        calls: trend?.calls || 0,
        booked: appointmentTrend?.booked || 0,
      };
    });

    const sentiment = { positive: 0, neutral: 0, negative: 0 };
    sentimentAgg.forEach((item) => {
      if (item._id in sentiment) {
        sentiment[item._id] = item.count;
      }
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      calls: 0,
    }));

    hourlyDistributionAgg.forEach((item) => {
      if (item._id >= 0 && item._id < 24) {
        hourlyDistribution[item._id].calls = item.count;
      }
    });

    // SEEDING FALLBACK: If database is brand new (0 calls), load premium dummy data for preview
    if (totalCalls === 0) {
      const mockToday = new Date().toISOString().split('T')[0];
      const mockYesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const mock2DaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
      const mock3DaysAgo = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];
      const mock4DaysAgo = new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0];

      return res.status(200).json({
        success: true,
        isMock: true,
        data: {
          summary: {
            totalCalls: 124,
            completedCalls: 110,
            missedCalls: 14,
            appointmentsBooked: 45,
            bookingConversionRate: 36,
            aiSuccessRate: 88,
            averageCallDuration: 74, // in seconds
          },
          todayAppointments: [
            {
              _id: 'mock_apt_1',
              patientName: 'John Doe',
              patientPhone: '+1 (555) 123-4567',
              appointmentTime: new Date(Date.now() + 3600000).toISOString(),
              status: 'scheduled',
              source: 'ai-call',
              doctorId: { name: 'Dr. Sarah Jenkins', specialization: 'Pediatrics' },
            },
            {
              _id: 'mock_apt_2',
              patientName: 'Jane Smith',
              patientPhone: '+1 (555) 987-6543',
              appointmentTime: new Date(Date.now() + 7200000).toISOString(),
              status: 'scheduled',
              source: 'ai-call',
              doctorId: { name: 'Dr. Michael Chen', specialization: 'Cardiology' },
            },
            {
              _id: 'mock_apt_3',
              patientName: 'David Lee',
              patientPhone: '+1 (555) 345-6789',
              appointmentTime: new Date(Date.now() + 14400000).toISOString(),
              status: 'pending',
              source: 'receptionist',
              doctorId: { name: 'Dr. Sarah Jenkins', specialization: 'Pediatrics' },
            },
          ],
          callTrends: [
            { date: mock4DaysAgo, calls: 18, booked: 6 },
            { date: mock3DaysAgo, calls: 24, booked: 8 },
            { date: mock2DaysAgo, calls: 28, booked: 11 },
            { date: mockYesterday, calls: 32, booked: 12 },
            { date: mockToday, calls: 22, booked: 8 },
          ],
          sentiment: {
            positive: 75,
            neutral: 42,
            negative: 7,
          },
          hourlyDistribution: [
            { hour: '08:00', calls: 5 },
            { hour: '09:00', calls: 18 },
            { hour: '10:00', calls: 24 },
            { hour: '11:00', calls: 20 },
            { hour: '12:00', calls: 10 },
            { hour: '13:00', calls: 12 },
            { hour: '14:00', calls: 15 },
            { hour: '15:00', calls: 14 },
            { hour: '16:00', calls: 8 },
            { hour: '17:00', calls: 2 },
          ],
        },
      });
    }

    res.status(200).json({
      success: true,
      isMock: false,
      data: {
        summary: {
          totalCalls,
          completedCalls,
          missedCalls,
          appointmentsBooked,
          bookingConversionRate,
          aiSuccessRate,
          averageCallDuration,
        },
        todayAppointments,
        callTrends,
        sentiment,
        hourlyDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};
