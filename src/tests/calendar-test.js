require('dotenv').config();
const { google } = require('googleapis');
const moment = require('moment');

const CALENDAR_ID = 'elitetransportationpc@gmail.com';

// Credentials object (replace private_key with your actual key)
const credentials = {
  type: 'service_account',
  project_id: 'elite-transportation-450818',
  private_key_id: '42b1d519f894d739f203aef96dd3f317efbdae8a',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCO8uAGM4dZELRr\nn3tZ9tHGvfRsK7o5k4uWPK0MdF2t+60ls6aCsWJxywVeIU7KbCYdSb85bWbGnX3H\nt05O5tW0tRJkbUh1rBLrTdvzVz2DI2kxtT6DFR7XsEuBOVh9/9/IW9woNRpnnR3H\n5c9JlFme0SEi5c9gDc2J37570c5TlIL15Vd1FiLuxbFagkjiNDCEuw2fzkfPN77u\nmlKyIK3TPyJGkYcg04ai9eEZz+hwskzSH5fr7s0DrZBc5LzCN9wR1EcuZP47w6E5\n/Vk2nOiKsLKs6zA71lYVY02kao1rXVAm5fNS7WT1twG3NWm/WFag5+zHGSerQTBs\nIeh1LXdjAgMBAAECggEADguIqFioFpUAwnGdKzXdiaNAoIoxVhaMSKV13pCRDcGk\nfbJSN2rEqz072Jz5gq5allZtyUTZrBptm9GuX4E9rm97ZaOj0sVRPI5eAIw/Tnhh\nuGZq7x0u9m6WFJXKVI2Z8rPX2e7RxSwXm3xAatB+d7oWK+QcL9Swr7hsnPonGr4J\n+9NHoMPXogIkiRddytxT24mMLsHZg/gNthf5HnjjO14QksDdTnvWK0Rc0VIAvS93\nV6r0Bc8xJl8ZiEu7lLssQFneT4qfqQxWr0SwuUooaf/KpgRoXsysGe4NC7lp3aGk\nUVaPmM1+9Zadu4JR9I+2F6vqwwDcpPOl0+VD1qxiiQKBgQDGmhOFemWAW8vGnpoO\nbbF6UAUoMCCms59PjjnGv7zMgXW4c0cR6ggQtmBWKGVRyt4mTZNwKpp8jjo862J4\nDZ+aTqUHORZPcXTX3o5wYZLc4hy4c1DfeuGHoi4tvzbZ8YTGov7IQod5XHMRT7++\n8f+Z3ncXb1biYxZsrYEz1ZbmKwKBgQC4QzMiG2rkgooFHCKwRY2cEj0WNlPyfzkV\nr6a6iYgXI9D0zVfTtV/YsF1gXOtCN4kVA0sXrtxG9gboGQvZ8LXFMncmZ6Z1IS0a\ndpQrIJToV3kLBD2N5d5hiFGjQqiHeFrLnkDV3T9YjG8pZ1TnCBgB3+S6D0OldEJF\nBLjE2LkPqQKBgDwPHjYwZH+jwwUms3oHjDNr/ZNAsq8XBOd/IFPNaiACSoJkQirV\ntmivboS/pJxOmE3HCf5Ss/NU46HGoTmjDRASFnAPwIJ30hjyEetEZrBrpLnXDa73\nrzpgPkzRVZolIr0bT6dqDyQRZC7pChiJgH2cvDEXF5RQ2Ng2xCrTvdWPAoGBAKFQ\ne5CNjkxVmD2W/ytxCOOs9/vdPisbhD9fEslWJGWVvpbCuvQmYq3S4Ty+vFuxQPq7\ncl9ef4xEUZGac8yuNoRYhQWDUrBShikXzOng0VyDT/38DWOP7dtXO5mBfwdyr5J5\njmttEcsUzzDhPOwyIsppV9YoDOHp4SaJVrVGwuVZAoGARm/l6cPUJxWHmc6J8M6s\nzEUfm25bQNubMtsq9zTXzbg5A0s/EG1vHT/At6Un1gZrmPfmDMDolJo5Fn5yDaxP\n863G1OSHNszFPHXAFsBwj/smK6RPbbzPf8hJPVA9qIMnTBkk+L20ZTbDbsTB4e8R\nMnOegyvOGICkk4k2Gt85EBU=\n-----END PRIVATE KEY-----\n',
  client_email: 'elite-transportation@elite-transportation-450818.iam.gserviceaccount.com',
  client_id: '112764763379658178421',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/elite-transportation%40elite-transportation-450818.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
};

const calendarId = CALENDAR_ID;

async function testCalendar() {
  try {
    console.log('\nStarting calendar test...');

    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({
      version: 'v3',
      auth,
    });

    // Create a test event for tomorrow
    const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
    const startTime = '15:00';
    const endTime = '15:30';

    const event = {
      summary: 'Test Booking #12345',
      description: `
Pickup: Test Address 123
Dropoff: Test Address 456
Passenger: John Doe
Phone: +1234567890
Email: test@example.com
      `.trim(),
      start: {
        dateTime: moment(`${tomorrow} ${startTime}`).format('YYYY-MM-DDTHH:mm:ss'),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: moment(`${tomorrow} ${endTime}`).format('YYYY-MM-DDTHH:mm:ss'),
        timeZone: 'America/New_York',
      },
    };

    console.log('\nCreating test event...');
    console.log('Using calendar ID:', calendarId);
    console.log('Event details:', JSON.stringify(event, null, 2));

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    console.log('\nEvent created successfully!');
    console.log('Event ID:', response.data.id);
    console.log('Event link:', response.data.htmlLink);
  } catch (error) {
    console.error('\nError in calendar test:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

// Run the test
testCalendar();
