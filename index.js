require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()

morgan.token('body', function(req, res) {
  return JSON.stringify(req.body)
})

app.use(express.json())
app.use(morgan('tiny', {skip: function(req,res) {return req.method === 'POST'}}))
app.use(morgan(
  ':method :url :status :res[content-length] - :response-time ms :body', 
  {skip: function(req,res) {return req.method !== 'POST'}}
))
app.use(express.static('dist'))


// let persons = [
//   { 
//     "id": 1,
//     "name": "Arto Hellas", 
//     "number": "040-123456"
//   },
//   { 
//     "id": 2,
//     "name": "Ada Lovelace", 
//     "number": "39-44-5323523"
//   },
//   { 
//     "id": 3,
//     "name": "Dan Abramov", 
//     "number": "12-43-234345"
//   },
//   { 
//     "id": 4,
//     "name": "Mary Poppendieck", 
//     "number": "39-23-6423122"
//   }
// ]

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

app.get('/api/persons/:id', (req, res) => {
  Person
    .findById(req.params.id)
    .then(person => res.json(person))
    .catch(err => res.status(404).end())
})

// app.delete('/api/persons/:id  ', (req, res) => {
//   const id = Number(req.params.id)
//   persons = persons.filter(person => person.id !== id)
//   res.status(204).end()
// })

app.post('/api/persons', (req, res) => {
  const body = req.body

  if (!body.name || !body.number) {
    return res.status(400).send({error: 'Name or number missing'})
  }
  // if (persons.find(person => person.name === body.name)) {
  //   return res.status(400).send({error: 'Name must be unique'})
  // }

  const person = new Person({
    name: body.name, 
    number: body.number
  })
  
  person.save().then(savedPerson => {
    res.json(savedPerson)
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})