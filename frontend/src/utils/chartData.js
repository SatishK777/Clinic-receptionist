export const normalizeTrendDays = (trends = []) => {
  return trends.map((trend) => ({
    date: trend.date,
    calls: Number(trend.calls) || 0,
    booked: Number(trend.booked) || 0,
  }));
};
