var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.use(express.static('public'))
app.use('/uploads', express.static('uploads'))

require('./routers/home.io')(io.of('/'))

app.use(
  '/',
  function (req, res, next) {
    res.locals.io = io.of('/')
    next()
  },
  require('./routers/home')
)

app.use('/libs', require('./routers/libs'))

app.use(function (req, res, next) {
  res.status(404).send('Not Found.')
})

http.listen(1338)
