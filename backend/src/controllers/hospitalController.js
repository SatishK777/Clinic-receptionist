import Hospital from '../models/Hospital.js';

// @desc    List hospitals for platform administration
// @route   GET /api/v1/hospitals
// @access  Private (Super Admin)
export const getHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({})
      .select('name subdomain status subscription createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    next(error);
  }
};

