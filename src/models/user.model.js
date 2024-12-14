/**
 * User Model
 * Defines the schema and methods for User entity in MongoDB
 * @module models/user
 */

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

/**
 * User Schema
 * @typedef {Object} UserSchema
 * @property {string} name - User's full name
 * @property {string} email - User's email address (unique)
 * @property {string} password - User's hashed password
 * @property {string} phone - User's phone number
 * @property {string} role - User's role (default: 'user')
 * @property {boolean} isEmailVerified - Whether email is verified
 * @property {Date} createdAt - Timestamp of user creation
 * @property {Date} updatedAt - Timestamp of last update
 */
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        // Using validator's isMobilePhone with 'any' locale to support international formats
        if (!validator.isMobilePhone(value, 'any', { strictMode: false })) {
          throw new Error('Invalid phone number');
        }
      },
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins that convert mongoose to json and enable pagination
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is already taken
 * @async
 * @param {string} email - The email to check
 * @param {ObjectId} [excludeUserId] - The user ID to exclude from the search
 * @returns {Promise<boolean>} - Returns true if email is taken, false otherwise
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if phone number is already taken
 * @async
 * @param {string} phone - The phone number to check
 * @param {ObjectId} [excludeUserId] - The user ID to exclude from the search
 * @returns {Promise<boolean>} - Returns true if phone is taken, false otherwise
 */
userSchema.statics.isPhoneTaken = async function (phone, excludeUserId) {
  const user = await this.findOne({ phone, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @async
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} - Returns true if password matches, false otherwise
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

/**
 * Hash password before saving
 * @pre save
 */
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef {Model} User
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} password - User's hashed password
 * @property {string} phone - User's phone number
 * @property {string} role - User's role
 * @property {boolean} isEmailVerified - Email verification status
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Update timestamp
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
