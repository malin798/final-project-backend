import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { User } from './Models'

require('dotenv').config()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project-users"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(bodyParser.json())

const authenticateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      accessToken: req.header('Authorization')
    })
    if (user) {
      req.user = user
      next()
    } else {
      res.status(403).json({ authorized: false })
    }
  } catch (err) {
    res.status(403).json({ message: "Access token missing or incorrect", errors: err })
  }
}

app.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const duplicateEmail = await User.findOne({ email: email }).collation({ locale: "en_US", strength: 1 })
    const duplicateUser = await User.findOne({ name: name }).collation({ locale: "en_US", strength: 1 })

    if (duplicateEmail) {
      throw { code: 12000 }
    }

    if (duplicateUser) {
      throw { code: 11000 }
    }

    const hash = bcrypt.hashSync(password, 10);
    const user = new User({ name, email, password: hash })
    const saved = await user.save()

    res.status(201).json({ userId: saved._id, accessToken: saved.accessToken })
  } catch (err) {
    switch (err.code) {
      case 11000:
        res.status(404).json({ message: "User already exists!", errors: err })
        break;
      case 12000:
        res.status(404).json({ message: "Email already registered!", errors: err })
        break;
      default: res.status(404).json({ message: "Could not create user", errors: err })
    }
  }
})

app.post('/users/:id', authenticateUser)
app.post('/users/:id', async (req, res) => {
  res.status(201).json({ name: req.user.name, userId: req.user._id, authorized: true })
})

app.put('/users/:userId/watchlist', authenticateUser)
app.put('/users/:userId/watchlist', async (req, res) => {
  try {
    const { userId } = req.params
    const { title, showId, poster } = req.body

    const duplicateShow = await User.findOne({ _id: userId, "watchlist.showId": showId })

    if (duplicateShow) {
      throw 'Show already added!'
    }

    const showItem = { "title": title, "showId": showId, "poster": poster }

    await User.updateOne({ _id: userId }, { $push: { watchlist: showItem } })

    res.status(200).json({ message: "Watchlist updated! " })
  } catch (err) {
    res.status(201).json({ message: "Could not update watchlist!", errors: err })
  }
})

app.get('/users/:userId/watchlist', authenticateUser)
app.get('/users/:userId/watchlist', async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findOne({ _id: userId })

    res.status(200).json({ watchlist: user.watchlist })
  } catch {
    res.status(400).json({ message: "Something went wrong, could not fetch watchlist!" })
  }
})

app.delete('/users/:userId/watchlist', authenticateUser)
app.delete('/users/:userId/watchlist', async (req, res) => {
  try {
    const { showId } = req.body
    const { userId } = req.params

    const user = await User.updateOne({ _id: userId }, { $pull: { watchlist: { showId: showId } } })

    const updatedUser = await User.findOne({ _id: userId })

    res.status(200).json({ watchlist: updatedUser.watchlist })
  } catch {
    res.status(400).json({ message: `Show could not be removed` })
  }

})

app.post('/sessions', async (req, res) => {
  try {
    const { name, password } = req.body
    const user = await User.findOne({ name: name }).collation({ locale: "en_US", strength: 1 })

    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(202).json({ userId: user._id, userName: user.name, accessToken: user.accessToken })
    } else {
      res.status(404).json({ notFound: true })
    }
  } catch (err) {
    res.status(404).json({ notFound: true })
  }
})

if (process.env.RESET_DB === "true") {
  const seedDatabase = async () => {
    await User.deleteMany({})
  }
  seedDatabase()
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})