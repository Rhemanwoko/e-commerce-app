// Test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns').promises;

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  if (process.env.MONGODB_URI) {
    console.log('MONGODB_URI preview:', process.env.MONGODB_URI.substring(0, 50) + '...');
    
    // Extract hostname for DNS test
    const match = process.env.MONGODB_URI.match(/mongodb\+srv:\/\/[^@]+@([^\/]+)/);
    if (match) {
      const hostname = match[1];
      console.log('Extracted hostname:', hostname);
      
      try {
        console.log('Testing DNS resolution...');
        const addresses = await dns.resolveSrv(`_mongodb._tcp.${hostname}`);
        console.log('✅ DNS resolution successful:', addresses.length, 'records found');
      } catch (dnsError) {
        console.error('❌ DNS resolution failed:', dnsError.message);
        console.log('💡 Try using standard connection string instead of SRV');
      }
    }
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
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Suggestions:');
      console.log('1. Check if your MongoDB Atlas cluster is running');
      console.log('2. Verify the connection string is correct');
      console.log('3. Try using standard connection string instead of SRV');
      console.log('4. Check MongoDB Atlas network access settings');
    }
    
    process.exit(1);
  }
};

testConnection();