const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;
    
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI exists:', !!mongoURI);
    console.log('MongoDB URI preview:', mongoURI ? `${mongoURI.substring(0, 20)}...` : 'undefined');
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    // Try to use standard connection string if SRV fails
    let connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
    };

    // If using SRV and it fails, we'll catch and suggest standard format
    const conn = await mongoose.connect(mongoURI, connectionOptions);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Database disconnection error:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };