import mongoose from 'mongoose';

const SoloTulpanSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

export const SoloTulpan = mongoose.model('SoloTulpan', SoloTulpanSchema);
