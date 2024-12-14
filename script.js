const { google } = require('googleapis');
const moment = require('moment');

// Your credentials
const credentials = {
  clientEmail: 'booking-calendar@luxury-transportation-444520.iam.gserviceaccount.com',
  privateKey:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCUY/ubxinlIr5z\nP3QaA67zxcXoER6f9Kfco6ECgkx8TX4uGiWw7QWNMabZ8mht6mIxqSVKjR4w29zT\nF+spOvKxuLHaLkxFGLiDb5BEYlz1gbn2EsVwcpGiNwn1txl4NYhROSn2nvFMCY23\nEJ/Dx59K/d8V6HaSkPGOZmpDp5PYmHDYh1akGi6ZxOBDICQpEOZjgQm36FlwV0PL\nIlEkjWX3Ce90VzXPzdIRvb8i6+/BA4ttOUT01FtjDh7sJuxazgS4764EYzF+s+HP\ndQEGoYY9a+EfvlYOXu0fsg9FpiHhWJKWnVA92FmXvZ/YsoyFoSUeGa6q4//PkYl1\nYEOwSu+9AgMBAAECggEABIcO4YdeC8NXApiiF/Th0H/0d/HP/6zbRTK/yw/cJMod\nnfl8X0CJc/4h5E6ZMTVbKxRluZsX4shOHZtl1PDUAEvYLyJM1OMaQwRhdYrpNttS\ntikyIKpA5Z8bEGmaDUj0aW2TzOt+sEWD6CQQw9qiOYt6cKZn1m3EDlvW02lKJQh3\nHkEfb7IjA0U++PcImqGZ+QtxEVu/1Rh5nqETTB4x0/FRIxye5G6JX3ZnlzRreMrM\ntuX7hxbxab6EO+cDdQkfvjGz1ZnWGnnpwLTpE9d6hwukT9G9PfEHvMLgLgtug52s\npWzp4H/XP5yeSiMq9rRqilFLKl39uP9FFSm8ix307wKBgQDEx9A8hG07Q9TStIoZ\nQfQRuhqPs9flWg2u3yPNo5ugUTVmZPR7grE95MIdNf0qkmRg93aYtb/cLMO/oAzJ\ntkLmxBLGcU0pew96h/X+aks4IAlMXysNG0Jk3jbvqEKlCOybx8D6doK079scqXGJ\nlwCzpzI+9nkZTHPZXHTYvtNLJwKBgQDBDCda/6j2UEAJk07aFwgZQ6yTwp/RIZet\nhIoR+k5R1OkdqAW3lasNh3mou34OqaBCpUSdBDTjClglE+G3NZekWys86gHgdQqs\nUbP4EO6izNfFQ7HajglZKYacUGrKsyRxXzrDtqC7zlECs0DI/u/UeAq+tDg/e96K\nQNRh5MAMewKBgQCv/yJArhRgGDflyDFni7R2kmOlOS2UZOmuCMcl6fmL9nXzQcHk\nIazSdaIjrCDlDY+Xply9EnkpvCPLZKNrWYcWjDFaqQVhXz4l0ipyxLDH3udSFiAU\nFdhZDOJHkM8iegvc/Fid6pbWq1vmk6oHbDXleFmZNKp0tQs8UdPz8yBZqwKBgCBB\n7qWXCN23xSuUcN2icZj/JOw/3kKs0VKOTh/46nNkF1v8QpBNsxp8o8idI9BBaeUZ\nBqESHeA+T0JK0zGxA9jT3yK7m3qtNA5dTKxL8ARGJFvzFtoFV+yNMtAV4/JhAtrq\n5b/kWXFoZUMFPvMXHm4rbOg25xs8kJAbiyGcfrbXAoGAapkwG7V+9cUE+PalX1Pq\nKG5Xz6K/fBSYu4R8C93xrVpTAoTFz2qBvBQnjy0TWcyPOaQoF3sAMa5os/5M/dMz\nfkpbCHLJdVZmE2HXq9r8ZiBbRsMVtFva/ec9oZoounhTevn3ZDwka2g1WwBSDpt/\nhqR+wZBbZafQn7WDrNyhWfM=\n-----END PRIVATE KEY-----\n',
  calendarId: 'da4bb71699496f6041aaa66db7ed471747bb3f398766133eb1c2033f2f225ba2@group.calendar.google.com',
};

async function testCalendarSetup() {
  try {
    console.log('Starting calendar test...');

    // Create auth client
    console.log('Creating auth client...');
    const auth = new google.auth.JWT(credentials.clientEmail, null, credentials.privateKey, [
      'https://www.googleapis.com/auth/calendar',
    ]);

    // Test authentication
    console.log('Testing authentication...');
    await auth.authorize();
    console.log('✓ Authentication successful');

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth });

    // Test 1: List events
    console.log('\nTest 1: Listing events...');
    const events = await calendar.events.list({
      calendarId: credentials.calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    console.log('✓ Successfully retrieved events:', events.data.items.length, 'events found');

    // Test 2: Create a test event
    console.log('\nTest 2: Creating test event...');
    const testEvent = {
      summary: 'Test Event',
      description: 'This is a test event',
      start: {
        dateTime: moment().add(1, 'days').format(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: moment().add(1, 'days').add(1, 'hour').format(),
        timeZone: 'UTC',
      },
    };

    const createdEvent = await calendar.events.insert({
      calendarId: credentials.calendarId,
      resource: testEvent,
    });
    console.log('✓ Successfully created test event with ID:', createdEvent.data.id);

    // Test 3: Delete the test event
    console.log('\nTest 3: Deleting test event...');
    await calendar.events.delete({
      calendarId: credentials.calendarId,
      eventId: createdEvent.data.id,
    });
    console.log('✓ Successfully deleted test event');

    console.log('\nAll tests passed successfully! Calendar setup is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testCalendarSetup();
