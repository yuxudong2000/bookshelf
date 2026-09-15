import express from 'express'
import cors from 'cors'
import { getDb } from './db.js'
import { createBooksRouter } from './routes/books.js'
import { createGroupsRouter } from './routes/groups.js'
import { errorHandler } from './middleware/error.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const db = getDb()
app.use('/api', createBooksRouter(db))
app.use('/api', createGroupsRouter(db))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Bookshelf server running on http://localhost:${PORT}`)
})

export { app, db }
