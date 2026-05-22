const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log(`Attempting to connect to MongoDB at: ${mongoUri}...`);
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000 // 3 second timeout for initial connection
    });
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    process.env.USE_MOCK_DB = 'false';
  } catch (error) {
    console.log('MongoDB connection failed!');
    console.log(`Reason: ${error.message}`);
    process.env.USE_MOCK_DB = 'true';
  }
};

module.exports = connectDB;
