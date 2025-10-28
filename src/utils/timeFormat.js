const moment = require('moment');

const TWENTY_FOUR_HOUR_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const AM_PM_PATTERN = /(AM|PM)$/i;

/**
 * Convert 12-hour time format (with AM/PM) to 24-hour format.
 * Also accepts already-normalized HH:mm strings.
 * @param {string} timeInput
 * @returns {string}
 */
function convertTo24Hour(timeInput) {
  if (!timeInput) {
    return timeInput;
  }

  const trimmed = String(timeInput).trim();

  if (TWENTY_FOUR_HOUR_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const formats = ['h:mm A', 'hh:mm A', 'h:mm a', 'hh:mm a'];
  const parsedTime = formats
    .map((format) => moment(trimmed, format, true))
    .find((candidate) => candidate.isValid());

  if (!parsedTime || !parsedTime.isValid()) {
    console.error(`Failed to parse time: ${timeInput}`);
    return trimmed;
  }

  return parsedTime.format('HH:mm');
}

/**
 * Convert 24-hour time format to 12-hour format with AM/PM.
 * @param {string} time24h
 * @returns {string}
 */
function convertTo12Hour(time24h) {
  if (!time24h) {
    return time24h;
  }

  const trimmed = String(time24h).trim();

  if (AM_PM_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const parsedTime = moment(trimmed, 'HH:mm', true);
  if (!parsedTime.isValid()) {
    return trimmed;
  }

  return parsedTime.format('h:mm A');
}

/**
 * Normalize input into HH:mm (or null if invalid).
 * @param {string} timeString
 * @returns {string|null}
 */
function normalizeTimeString(timeString) {
  if (!timeString) {
    return null;
  }

  const trimmed = String(timeString).trim();

  if (TWENTY_FOUR_HOUR_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const converted = convertTo24Hour(trimmed);
  if (converted && TWENTY_FOUR_HOUR_PATTERN.test(converted)) {
    return converted;
  }

  return null;
}

/**
 * Convert a time string to minutes since start of day.
 * @param {string} timeString
 * @returns {number|null}
 */
function timeStringToMinutes(timeString) {
  const normalized = normalizeTimeString(timeString);
  if (!normalized) {
    return null;
  }

  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since start of day to HH:mm.
 * @param {number} minutes
 * @returns {string|null}
 */
function minutesToTimeString(minutes) {
  if (typeof minutes !== 'number' || Number.isNaN(minutes)) {
    return null;
  }

  const boundedMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const hrs = Math.floor(boundedMinutes / 60);
  const mins = boundedMinutes % 60;

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

module.exports = {
  convertTo24Hour,
  convertTo12Hour,
  normalizeTimeString,
  timeStringToMinutes,
  minutesToTimeString,
  TWENTY_FOUR_HOUR_PATTERN,
};
