const safeMin = (arr = []) => {
  if (!Array.isArray(arr)) return 0;

  const valid = arr.filter(
    n => typeof n === "number" && !isNaN(n)
  );

  if (!valid.length) return 0;

  return Math.min(...valid);
};

const safeMax = (arr = []) => {
  if (!Array.isArray(arr)) return 0;

  const valid = arr.filter(
    n => typeof n === "number" && !isNaN(n)
  );

  if (!valid.length) return 0;

  return Math.max(...valid);
};

const safeNumber = (
  value,
  fallback = 0
) => {
  return typeof value === "number" &&
    !isNaN(value)
    ? value
    : fallback;
};

module.exports = {
  safeMin,
  safeMax,
  safeNumber,
};