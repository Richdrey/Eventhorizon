const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventhorizon';

const connectDB = async () => {
  try {
    await mongoose.connect(url);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Check that MongoDB is running and that MONGO_URI is correct. Default local port is 27017.');
    process.exit(1);
  }
};

module.exports = connectDB;