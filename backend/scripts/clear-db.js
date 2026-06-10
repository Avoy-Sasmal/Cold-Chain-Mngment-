import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    await mongoose.connection.db.dropCollection('stakeholders').catch(() => console.log('Stakeholders collection already empty'));
    await mongoose.connection.db.dropCollection('products').catch(() => console.log('Products collection already empty'));
    await mongoose.connection.db.dropCollection('transferhistories').catch(() => console.log('Transfers collection already empty'));
    await mongoose.connection.db.dropCollection('monitoringlogs').catch(() => console.log('Logs collection already empty'));

    console.log('✅ Database cleared successfully! You can now re-register stakeholders on your new Anvil instance.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDB();
