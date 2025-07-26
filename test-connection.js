// Test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  if (process.env.MONGODB_URI) {
    console.log('MONGODB_URI preview:', process.env.MONGODB_URI.substring(0, 30) + '...');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('Connected to:', conn.connection.host);
    
    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
};

testConnection();