#!/usr/bin/env node

require('dotenv').config();
const { sendTestAlert } = require('./alertSender');

async function main() {
    console.log('🚀 Stock Alert Email-to-SMS Test');
    console.log('================================\n');

    // Display current configuration
    console.log('📧 Email Configuration:');
    console.log(`   Email User: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.log(`   Email Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
    console.log(`   Email Port: ${process.env.EMAIL_PORT || '587'}`);
    console.log(`   Alert Phone: ${process.env.ALERT_PHONE_NUMBER || 'NOT SET'}`);
    console.log(`   Carrier Override: ${process.env.CARRIER_OVERRIDE || 'auto-detect'}\n`);

    // Check for required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ Missing email configuration!');
        console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
        console.log('For Gmail, use an "App Password" not your regular password');
        console.log('See: https://support.google.com/mail/answer/185833\n');
        process.exit(1);
    }

    if (!process.env.ALERT_PHONE_NUMBER) {
        console.log('❌ Missing phone number!');
        console.log('Please set ALERT_PHONE_NUMBER in your .env file\n');
        process.exit(1);
    }

    // Send test alert
    try {
        await sendTestAlert();
        console.log('\n💡 If you didn\'t receive the SMS, try:');
        console.log('   1. Setting CARRIER_OVERRIDE in .env to your specific carrier');
        console.log('   2. Checking your email spam folder');
        console.log('   3. Verifying your email credentials are correct');
        console.log('   4. Ensuring 2FA/App Passwords are set up for Gmail');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Handle command line execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };