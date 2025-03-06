/**
 * This script will add users to the MongoDB database
 *
 * Usage:
 * - Place this file in the scripts directory of your project
 * - Run with: node scripts/seedUsers.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./src/config/config');
const logger = require('./src/config/logger');
const User = require('./src/models/user.model');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt for input
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  addUser()
    .then(() => {
      logger.info('User added successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error adding user:', error);
      process.exit(1);
    });
});

/**
 * Add a new user to the database
 */
async function addUser() {
  try {
    logger.info('=== Add New User ===');

    // Ask if user wants to delete all existing users first
    const shouldDeleteAll = await question('Do you want to delete all existing users first? (yes/no): ');
    if (shouldDeleteAll.toLowerCase() === 'yes') {
      logger.info('Deleting all existing users...');
      await User.deleteMany({});
      logger.info('All users deleted.');
    }

    // Collect user data
    const userData = {
      name: await question('Enter name: '),
      email: await question('Enter email: '),
      password: await question('Enter password: '),
      phone: await question('Enter phone: '),
      role: (await question('Enter role (user/admin) [default: user]: ')) || 'user',
      isEmailVerified: (await question('Is email verified? (yes/no) [default: no]: ')).toLowerCase() === 'yes',
    };

    // Validate required fields
    if (!userData.name || !userData.email || !userData.password || !userData.phone) {
      throw new Error('All fields (name, email, password, phone) are required.');
    }

    // Validate password
    if (userData.password.length < 8 || !userData.password.match(/\d/) || !userData.password.match(/[a-zA-Z]/)) {
      throw new Error('Password must be at least 8 characters and contain both letters and numbers.');
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const overwrite = await question('A user with this email already exists. Overwrite? (yes/no): ');
      if (overwrite.toLowerCase() === 'yes') {
        logger.info('Overwriting existing user...');
        await User.deleteOne({ email: userData.email });
      } else {
        throw new Error('User creation aborted. Email already exists.');
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    userData.password = hashedPassword;

    // Create the user
    const user = await User.create(userData);

    // Output the created user (excluding password)
    logger.info('User created successfully:');
    logger.info(`Name: ${user.name}`);
    logger.info(`Email: ${user.email}`);
    logger.info(`Phone: ${user.phone}`);
    logger.info(`Role: ${user.role}`);
    logger.info(`Email Verified: ${user.isEmailVerified}`);
    logger.info(`ID: ${user._id}`);

    // Ask if user wants to add another user
    const addAnother = await question('Do you want to add another user? (yes/no): ');
    if (addAnother.toLowerCase() === 'yes') {
      await addUser();
    } else {
      rl.close();
    }
  } catch (error) {
    logger.error(`Error adding user: ${error.message}`);
    rl.close();
    throw error;
  }
}

// Close readline on exit
process.on('exit', () => {
  rl.close();
});
