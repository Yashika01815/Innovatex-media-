import config from './src/config/config.js'
import express from 'express'
import connectDB from './src/config/db.js'

const app = express()


app.get('/', (req, res) => {
    res.send('Hello World')
})

const PORT = config.PORT;
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})