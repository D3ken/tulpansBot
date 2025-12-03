import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  tgId: {
    type: Number,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    default: '',
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    default: '',
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

export const User = mongoose.model('User', UserSchema);
