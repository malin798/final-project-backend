import express from "express"
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/users"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const User = mongoose.model('User', {
  name: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})

//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())
require('dotenv').config()

// Start defining your routes here
app.get('/', (req, res) => {
  res.send('Hello Jennifer')
})

if (process.env.RESET_DB === "true") {
  const seedDatabase = async () => {
    await User.deleteMany({})
  }
  seedDatabase()
}

app.listen(3000, () => console.log('App listening on port 3000)'))

