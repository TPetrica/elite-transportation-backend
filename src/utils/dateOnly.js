const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getDateParts = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const formatDateOnly = (value) => {
  const parts = getDateParts(value);
  if (!parts) {
    return '';
  }

  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

const toUtcDateOnly = (value) => {
  const parts = getDateParts(value);
  if (!parts) {
    return null;
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

const getUtcDayRange = (value) => {
  const start = toUtcDateOnly(value);
  if (!start) {
    return null;
  }

  return {
    start,
    end: new Date(start.getTime() + (24 * 60 * 60 * 1000) - 1),
  };
};

const formatLongDateWithOrdinal = (value) => {
  const parts = getDateParts(value);
  if (!parts) {
    return '';
  }

  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = parts.day % 100;
  const ordinal = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];

  return `${MONTH_NAMES[parts.month - 1]} ${parts.day}${ordinal} ${parts.year}`;
};

module.exports = {
  formatDateOnly,
  formatLongDateWithOrdinal,
  getUtcDayRange,
  toUtcDateOnly,
};
