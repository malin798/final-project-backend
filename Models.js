import mongoose from 'mongoose'
import crypto from 'crypto'

export const User = mongoose.model('User', {
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  watchlist: {
    type: Array
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})


