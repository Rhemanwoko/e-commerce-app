const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Connect to in-memory MongoDB instance
const connectTestDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to test database');
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
};

// Disconnect and clean up
const disconnectTestDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Test database disconnection error:', error);
    throw error;
  }
};

// Clear all collections
const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Test database clear error:', error);
    throw error;
  }
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearTestDB
};