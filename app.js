var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')
var session = require('express-session')

var config = require('./config')

mongoose.connect(config.db)

app.use(express.static(`${__dirname}/public`))

app.use('/libs', require('./routers/libs'))

require('./routers/tug-of-war.io')(io.of('/tug-of-war'))
app.use(
  '/tug',
  function (req, res, next) {
    res.locals.io = io.of('/tug-of-war')
    next()
  },
  require('./routers/tug-of-war')
)

app.engine('jade', require('jade').__express)
app.set('view engine', 'jade')

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true
}))

app.use('/', require('./routers/tuku'))
app.use('/tuku', require('./routers/tuku'))
app.use('/login', require('./routers/login'))

app.use(function (req, res, next) {
  res.sendStatus(404)
})

app.use(require('./middlewares/errorhandler'))

http.listen(1338)
