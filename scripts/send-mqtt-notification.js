#!/usr/bin/env node

/**
 * Script to send MQTT notification about version release
 *
 * Usage:
 *   node scripts/send-mqtt-notification.js <packageVersion> <androidVersion> <androidBuild> <iosVersion> <iosBuild>
 *
 * Environment variables (from .env file):
 *   MQTT_TOKEN - MQTT broker authentication token
 *   MQTT_URL - MQTT broker URL
 */

// Load environment variables from .env file
require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});

const mqtt = require('mqtt');

// Get arguments
const packageVersion = process.argv[2];
const androidVersion = process.argv[3];
const androidBuild = process.argv[4];
const iosVersion = process.argv[5];
const iosBuild = process.argv[6];

// Get environment variables
const mqttToken = process.env.MQTT_TOKEN;
const mqttUrl = process.env.MQTT_URL;

// Validate required parameters
if (
  !packageVersion ||
  !androidVersion ||
  !androidBuild ||
  !iosVersion ||
  !iosBuild
) {
  console.error('Error: Missing required arguments');
  console.log(
    'Usage: node scripts/send-mqtt-notification.js <packageVersion> <androidVersion> <androidBuild> <iosVersion> <iosBuild>'
  );
  process.exit(1);
}

// Validate environment variables
if (!mqttToken || !mqttUrl) {
  console.error('Error: Missing required MQTT environment variables');
  console.log('Required: MQTT_TOKEN, MQTT_URL');
  process.exit(1);
}

// Construct MQTT URL
const brokerUrl = `wss://${mqttUrl}`;

console.log(`Connecting to MQTT broker: ${mqttUrl}`);
console.log(`Full URL: ${brokerUrl}`);
console.log(`Version: ${packageVersion}`);
console.log(`Client ID: arvut_mobile_release`);
console.log(`Username: arvut_mobile`);

let options = {
  clientId: 'arvut_mobile_release',
  protocolId: 'MQTT',
  protocolVersion: 5,
  username: 'arvut_mobile',
  password: mqttToken,
  reconnectPeriod: 0, // Don't auto-reconnect in CI
  connectTimeout: 30 * 1000, // 30 seconds
  rejectUnauthorized: true, // Verify SSL certificate
};

console.log('Attempting connection...');
const client = mqtt.connect(brokerUrl, options);

client.on('connect', data => {
  console.log('✅ Connected to MQTT broker');
  // Create message payload
  const message = {
    type: 'version_release',
    project: 'galaxy-mobile',
    timestamp: new Date().toISOString(),
    versions: {
      package: packageVersion,
      android: {
        version: androidVersion,
        code: parseInt(androidBuild),
      },
      ios: {
        version: iosVersion,
        code: parseInt(iosBuild),
      },
    },
  };

  console.log('📤 Sending message:', JSON.stringify(message, null, 2));

  // Publish message
  client.publish(
    'mobile/releases',
    JSON.stringify(message),
    { qos: 1, retain: true },
    err => {
      if (err) {
        console.error('❌ Error publishing message:', err);
        process.exit(1);
      } else {
        console.log(`✅ Successfully sent version notification`);
        console.log(`📱 Android: v${androidVersion} (${androidBuild})`);
        console.log(`🍎 iOS: v${iosVersion} (${iosBuild})`);
        client.end();
      }
    }
  );
});

client.on('error', err => {
  console.error('❌ MQTT connection error:', err);
  console.error('Error details:', {
    message: err.message,
    code: err.code,
    syscall: err.syscall,
  });
  process.exit(1);
});

client.on('offline', () => {
  console.log('⚠️  Client went offline');
});

client.on('close', () => {
  console.log('🔌 Connection closed');
});

client.on('reconnect', () => {
  console.log('🔄 Attempting to reconnect...');
});

// Timeout after 15 seconds (reduced for CI)
setTimeout(() => {
  console.error('❌ MQTT connection timeout (15s)');
  console.error('⚠️  This might be due to:');
  console.error('   - GitHub Actions runner cannot reach MQTT broker');
  console.error('   - Firewall or network restrictions');
  console.error('   - MQTT broker requires IP whitelisting');
  console.error(`   - Broker URL: ${mqttUrl}`);
  client.end();
  process.exit(1);
}, 15000);
