var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.use(express.static('public'))
app.use('/uploads', express.static('uploads'))

require('./routers/tug-of-war.io')(io.of('/tug-of-war'))

app.use(
  '/',
  function (req, res, next) {
    res.locals.io = io.of('/tug-of-war')
    next()
  },
  require('./routers/tug-of-war')
)

app.use('/libs', require('./routers/libs'))

app.use(function (req, res, next) {
  res.status(404).send('Not Found.')
})

http.listen(1338)
