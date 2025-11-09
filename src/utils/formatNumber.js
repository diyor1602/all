const formatNumber = (number, max = 2) => {
  if (!number) return 0;
  return parseFloat(number).toLocaleString("ru-RU", {
    maximumFractionDigits: max,
  });
};

export default formatNumber;
