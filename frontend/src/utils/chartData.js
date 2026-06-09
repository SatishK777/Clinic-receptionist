const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fillLastSevenTrendDays = (trends = []) => {
  const trendMap = new Map(
    trends.map((trend) => [
      trend.date,
      {
        calls: Number(trend.calls) || 0,
        booked: Number(trend.booked) || 0,
      },
    ])
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const dateKey = formatDateKey(date);
    const trend = trendMap.get(dateKey);

    return {
      date: dateKey,
      calls: trend?.calls || 0,
      booked: trend?.booked || 0,
    };
  });
};

