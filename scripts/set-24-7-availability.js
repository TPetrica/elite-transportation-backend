// Quick script to set 24/7 availability for all days
// Run this in MongoDB shell or through a script runner

// Set all days to 24/7 availability
const days = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday

days.forEach(dayOfWeek => {
  db.schedules.updateOne(
    { dayOfWeek: dayOfWeek },
    {
      $set: {
        isEnabled: true,
        timeRanges: [{
          start: "00:00",
          end: "23:59"
        }]
      }
    },
    { upsert: true }
  );
});

print("All days set to 24/7 availability");

// To verify:
db.schedules.find().forEach(schedule => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  print(`${dayNames[schedule.dayOfWeek]}: ${schedule.isEnabled ? 'Enabled' : 'Disabled'}`);
  schedule.timeRanges.forEach(range => {
    print(`  ${range.start} - ${range.end}`);
  });
});