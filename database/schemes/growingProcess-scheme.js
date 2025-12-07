import mongoose from 'mongoose';

const GrowingProcessSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

export const GrowingProcess = mongoose.model('GrowingProcess', GrowingProcessSchema);
