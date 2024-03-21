require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()

morgan.token('body', function(req, res) {
  return JSON.stringify(req.body)
})

app.use(express.json())
app.use(morgan('tiny', { skip: function(req,res) {return req.method === 'POST'} }))
app.use(morgan(
  ':method :url :status :res[content-length] - :response-time ms :body',
  { skip: function(req,res) {return req.method !== 'POST'} }
))
app.use(express.static('dist'))

app.get('/info', (req, res) => {
  const t = new Date(Date.now())
  Person.find({}).then(persons =>
    res.send(`
      <p>Phonebook has info for ${persons.length} people</p> 
      <p>${t}</p>
    `))
})

app.get('/api/persons', (req, res) => {
  Person.find({}).then(persons => {
    res.json(persons)
  })
})

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }})
    .catch(err => next(err))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
    .then(result => res.status(204).end())
    .catch(err => next(err))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body

  if (!body.name || !body.number) {
    return res.status(400).send({ error: 'Name or number missing' })
  }
  Person.find({ name: body.name })
    .then(person => {
      if (person.length > 0) {
        res.status(400).send({ error: 'Name must be unique' })
      } else {
        const person = new Person({
          name: body.name,
          number: body.number
        })
        person.save()
          .then(savedPerson => {
            res.json(savedPerson)
          })
          .catch(err => next(err))
      }
    })
})

app.put('/api/persons/:id', (req, res, next) => {
  const { name, number } = req.body

  Person.findByIdAndUpdate(req.params.id, { name, number }, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => res.json(updatedPerson))
    .catch(err => next(err))
})

const errorHandler = (err, req, res, next) => {
  console.log(err.message)
  if (err.name === 'CastError') {
    return res.status(400).send({ error: 'Malformatted id' })
  } else if (err.name === 'ValidationError') {
    return res.status(400).send({ error: err.message })
  }
  next(err)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})