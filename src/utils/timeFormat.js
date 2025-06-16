const moment = require('moment');

/**
 * Convert 12-hour time format (with AM/PM) to 24-hour format
 * @param {string} time12h - Time in 12-hour format (e.g., "1:30 AM", "2:45 PM", "5:30 AM")
 * @returns {string} Time in 24-hour format (e.g., "01:30", "14:45", "05:30")
 */
function convertTo24Hour(time12h) {
  // If already in 24-hour format, return as is
  if (!time12h.includes('AM') && !time12h.includes('PM')) {
    return time12h;
  }

  // Handle various time formats with moment
  const formats = ['h:mm A', 'hh:mm A', 'h:mm a', 'hh:mm a'];
  let parsedTime = null;
  
  for (const format of formats) {
    const attempt = moment(time12h, format, true);
    if (attempt.isValid()) {
      parsedTime = attempt;
      break;
    }
  }
  
  if (!parsedTime || !parsedTime.isValid()) {
    console.error(`Failed to parse time: ${time12h}`);
    // If parsing fails, return original (will be handled by validation)
    return time12h;
  }
  
  const result = parsedTime.format('HH:mm');
  return result;
}

/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param {string} time24h - Time in 24-hour format (e.g., "01:30", "14:45")
 * @returns {string} Time in 12-hour format (e.g., "1:30 AM", "2:45 PM")
 */
function convertTo12Hour(time24h) {
  // If already in 12-hour format, return as is
  if (time24h.includes('AM') || time24h.includes('PM')) {
    return time24h;
  }

  const parsedTime = moment(time24h, 'HH:mm');
  
  if (!parsedTime.isValid()) {
    return time24h;
  }
  
  return parsedTime.format('h:mm A');
}

module.exports = {
  convertTo24Hour,
  convertTo12Hour
};