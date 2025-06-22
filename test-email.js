const nodemailer = require('nodemailer');
const config = require('./src/config/config');
const { getToAirportTemplate } = require('./src/services/email/templates/booking/toAirportTemplate');
const path = require('path');

// Test booking data - First trip: Home to Airport (to-airport service)
const testBookingData = {
  bookingNumber: 'BK2025060035',
  service: 'to-airport', // This will show as "Airport Drop-off Service"
  pickup: {
    date: '2025-06-24',
    time: '07:30',
    address: '6115 Trailside Dr, Park City, UT 84098, USA' // Home pickup
  },
  dropoff: {
    date: '2025-06-24',
    time: '08:15', // Estimated arrival time at airport
    address: 'Salt Lake City International Airport (SLC)' // Airport dropoff
  },
  distance: {
    miles: '32'
  },
  duration: '45 minutes',
  passengerDetails: {
    notes: 'For Tue 6/24, please pick me up at 7:30AM at home. For Wed 6/25, I estimate I will get to the pickup curb 6A at SLC at 10PM. The flight is scheduled to arrive at 9:54PM. I will text you when I land, and again when I am a few minutes from the curb.'
  },
  extras: [],
  returnDetails: {
    hasReturn: true,
    date: '2025-06-25',
    time: '22:00',
    pickupAddress: 'Salt Lake City International Airport (SLC)',
    dropoffAddress: '6115 Trailside Dr, Park City, UT 84098, USA',
    flightNumber: 'Delta 2214'
  },
  pricing: {
    basePrice: 240.00,
    baseFare: 240.00,
    total: 240.00
  }
};

// Email configuration - use the same config as the main application
const transporter = nodemailer.createTransport(config.email.smtp);

async function sendTestEmail() {
  try {
    console.log('Generating email template...');
    
    // Generate the HTML email content using to-airport template
    const htmlContent = getToAirportTemplate(testBookingData);
    
    // Add logo attachment
    const attachments = [
      {
        filename: 'logo.jpeg',
        path: path.join(__dirname, 'src/assets/logo.jpeg'),
        cid: 'companyLogo'
      }
    ];

    // Email options
    const mailOptions = {
      from: config.email.from,
      to: 'elitetransportationpc@gmail.com',
      subject: `Booking Confirmation - #${testBookingData.bookingNumber}`,
      html: htmlContent,
      text: `Your booking (#${testBookingData.bookingNumber}) for Airport Drop-off Service on June 24th 2025 at 7:30 AM has been confirmed. Pickup: ${testBookingData.pickup.address}. Thank you!`,
      attachments: attachments
    };

    console.log('Sending email...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n📝 Email configuration issue:');
      console.log('Check that your .env file has the correct SMTP settings:');
      console.log('- SMTP_HOST');
      console.log('- SMTP_PORT');
      console.log('- SMTP_USERNAME');
      console.log('- SMTP_PASSWORD');
      console.log('- EMAIL_FROM');
    }
  }
}

// Run the test
console.log('🚀 Starting test email send...');
console.log('Booking Details:');
console.log(`- Booking #: ${testBookingData.bookingNumber}`);
console.log(`- Service: Airport Drop-off Service (to-airport)`);
console.log(`- Date: June 24th 2025`);
console.log(`- Time: 7:30 AM`);
console.log(`- Pickup: ${testBookingData.pickup.address}`);
console.log(`- Dropoff: ${testBookingData.dropoff.address}`);
console.log(`- Return Trip: June 25th 2025 at 10:00 PM`);
console.log(`- Special Instructions: Included`);
console.log(`- Base Fare: $${testBookingData.pricing.baseFare}`);
console.log('');

sendTestEmail();