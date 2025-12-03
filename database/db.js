import 'dotenv/config';
import mongoose from 'mongoose';

export async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_TOKEN);
  } catch (error) {
    console.log('MongoDB connection error: ', error);
    process.exit(1);
  }
}

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected.');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error.', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected.');
});
