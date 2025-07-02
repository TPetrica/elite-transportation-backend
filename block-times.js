const mongoose = require('mongoose');
const config = require('./src/config/config');
const TimeSlot = require('./src/models/timeSlot.model');

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  console.log('Connected to MongoDB');
  blockSpecificTimes();
});

async function blockSpecificTimes() {
  try {
    // Block times for June 25, 2025
    const june25 = new Date('2025-06-25');
    
    // Times to block on June 25
    const june25TimesToBlock = [
      '15:30', // 3:30 PM
      '16:00', // 4:00 PM
      '16:30', // 4:30 PM (to cover the 3:30-4:30 PM range)
      '20:00', // 8:00 PM
      '20:30', // 8:30 PM
      '21:00', // 9:00 PM
      '21:30', // 9:30 PM (to cover the 8:00-9:30 PM range)
    ];

    // Block times for June 26, 2025
    const june26 = new Date('2025-06-26');
    
    // Times to block on June 26 (pickup at 6:15-6:30 PM)
    const june26TimesToBlock = [
      '18:00', // 6:00 PM
      '18:30', // 6:30 PM (to cover the 6:15-6:30 PM pickup time)
    ];

    // Block times for June 25
    console.log('\nBlocking times for June 25, 2025:');
    for (const time of june25TimesToBlock) {
      await blockTimeSlot(june25, time);
    }

    // Block times for June 26
    console.log('\nBlocking times for June 26, 2025:');
    for (const time of june26TimesToBlock) {
      await blockTimeSlot(june26, time);
    }

    console.log('\nAll specified times have been blocked successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error blocking times:', error);
    process.exit(1);
  }
}

async function blockTimeSlot(date, time) {
  try {
    // First check if the time slot exists
    let timeSlot = await TimeSlot.findOne({ date, time });
    
    if (timeSlot) {
      // Update existing time slot
      timeSlot.isBooked = true;
      await timeSlot.save();
      console.log(`✓ Blocked existing time slot: ${date.toDateString()} at ${time}`);
    } else {
      // Create new time slot as blocked
      const dayOfWeek = date.getDay();
      timeSlot = await TimeSlot.create({
        date,
        time,
        isBooked: true,
        dayOfWeek,
      });
      console.log(`✓ Created and blocked new time slot: ${date.toDateString()} at ${time}`);
    }
  } catch (error) {
    console.error(`✗ Failed to block ${date.toDateString()} at ${time}:`, error.message);
  }
}