var express = require('express')
var app = express()
var multer = require('multer')
var http = require('http').Server(app)
var io = require('socket.io')(http)
var fs = require('fs')

app.use(express.static('client'))
app.use('/upload', express.static('upload'))

app.use(multer())

app.get('/vue.js', function (req, res, next) {
  res.sendFile(__dirname + '/node_modules/vue/dist/vue.min.js', function (err) {
    if (err)
      return next(err)
  })
})

app.put('/teams/:name/image', function (req, res, next) {
  var name = req.params.name

  if (!req.files)
    return res.status(400).end()

  var imageFile = req.files.image

  var team = data.teams[name]

  if (!team)
    return res.status(400).end()

  if (team.image)
    return res.status(400).end()

  var imageSrc = '/upload/' + imageFile.name

  fs.rename(imageFile.path, __dirname + imageSrc, function (err) {
    if (err)
      return next(err)
    res.status(201).end()
    team.image = imageSrc
    io.emit('update', data)
  })
})

app.use(function (req, res, next) {
  res.status(404).send('Not Found.')
})

var data = {
  onlines: 0,
  teams: {
    a: { score: 0, power: 0, image: null },
    b: { score: 0, power: 0, image: null }
  }
}

var updateTimeoutId

io.on('connection', function (socket) {
  data.onlines += 1

  socket.emit('update', data)

  var timeoutId

  socket.on('tug', function (team) {
    if (timeoutId)
      return

    timeoutId = setTimeout(function () {
      timeoutId = null

      if (data.teams[team])
        data.teams[team].score += 1

      if (Math.abs(data.teams.a.score - data.teams.b.score) > 1000) {
        data.teams.a.score = 0
        data.teams.a.power = 0
        data.teams.a.image = null
        data.teams.b.score = 0
        data.teams.b.power = 0
        data.teams.b.image = null
      }

      if (updateTimeoutId)
        return

      updateTimeoutId = setTimeout(function () {
        updateTimeoutId = null
        io.emit('update', data)
      }, 16)
    }, 16)
  })

  socket.on('tucao', function (team, content) {
    if (!content || content.length > 20)
      return
    io.emit('tucao', team, content)
  })

  socket.on('disconnect', function () {
    data.onlines -= 1
  })
})

var lastTime = new Date().getTime()
var lastScoreA = data.teams.a.score
var lastScoreB = data.teams.b.score

setInterval(function () {
  var now = new Date().getTime()
  var timespan = (now - lastTime)

  data.teams.a.power = (data.teams.a.score - lastScoreA) / timespan * 1000
  data.teams.b.power = (data.teams.b.score - lastScoreB) / timespan * 1000

  lastTime = now
  lastScoreA = data.teams.a.score
  lastScoreB = data.teams.b.score

  io.emit('update', data)
}, 1000)

http.listen(1338)