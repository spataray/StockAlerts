#!/usr/bin/env node
require('dotenv').config();

console.log('🔍 Stock Alerts System Configuration Check\n');
console.log('=' .repeat(50));

// Check required environment variables
const requiredVars = {
    'EMAIL_USER': process.env.EMAIL_USER,
    'EMAIL_PASS': process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : undefined,
    'EMAIL_HOST': process.env.EMAIL_HOST || 'smtp.gmail.com (default)',
    'EMAIL_PORT': process.env.EMAIL_PORT || '587 (default)',
    'ALPHA_VANTAGE_API_KEY': process.env.ALPHA_VANTAGE_API_KEY ? '***' + process.env.ALPHA_VANTAGE_API_KEY.slice(-4) : undefined,
    'JWT_SECRET': process.env.JWT_SECRET ? 'SET ✓' : undefined,
    'PORT': process.env.PORT || '3000 (default)',
    'FRONTEND_URL': process.env.FRONTEND_URL
};

let allConfigured = true;

for (const [key, value] of Object.entries(requiredVars)) {
    const status = value ? '✓' : '✗';
    const color = value ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${status}${reset} ${key}: ${value || 'NOT SET'}`);

    if (!value) allConfigured = false;
}

console.log('=' .repeat(50));

if (allConfigured) {
    console.log('\n✅ All required environment variables are configured!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Create an account and add stock alerts via the web UI');
    console.log('3. Run test: npm run monitor-test');
} else {
    console.log('\n⚠️  Missing required configuration!');
    console.log('\nTo fix:');
    console.log('1. Copy .env.example: cp stock-alert-system/.env.example .env');
    console.log('2. Edit .env and add your actual credentials');
    console.log('3. Get Alpha Vantage API key: https://www.alphavantage.co/support/#api-key');
    console.log('4. For Gmail: Enable 2FA and create an App Password');
}

// Check if database exists
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'stockalerts.db');

console.log('\n📦 Database Status:');
if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`✓ Database exists: ${dbPath}`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  Modified: ${stats.mtime.toLocaleString()}`);
} else {
    console.log(`✗ Database not found: ${dbPath}`);
    console.log('  (Will be created automatically when you start the server)');
}

console.log('\n' + '='.repeat(50) + '\n');
