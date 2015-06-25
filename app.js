var express = require('express')
var app = express()
var multer = require('multer')
var http = require('http').Server(app)
var io = require('socket.io')(http)
var fs = require('fs')
var crypto = require('crypto')
var path = require('path')

app.use(express.static('client'))
app.use('/upload', express.static('upload'))

app.use(multer({
  dest: './upload/temp/',
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
    fields: 0
  }
}))

app.get('/vue.js', function (req, res, next) {
  res.sendFile(__dirname + '/node_modules/vue/dist/vue.min.js', function (err) {
    if (err)
      return next(err)
  })
})

app.put('/teams/:name/image', function (req, res, next) {
  var name = req.params.name
  var imageFile = req.files && req.files.image

  if (!imageFile)
    return res.status(400).end()

  var team = data.teams[name]

  if (!team || imageFile.mimetype.indexOf('image/') !== 0) {
    fs.unlink(imageFile.path)
    return res.status(400).end()
  }

  var md5 = crypto.createHash('md5')
  var s = fs.ReadStream(imageFile.path)
  s.on('data', function (d) {
    md5.update(d)
  })
  s.on('end', function () {
    var imageSrc = '/upload/' + md5.digest('hex') + path.extname(imageFile.name)
    fs.rename(imageFile.path, __dirname + imageSrc, function (err) {
      if (err)
        return next(err)

      if (team.image)
        return res.status(400).end()

      team.image = imageSrc
      res.status(201).end()
      io.emit('update', data)
    })
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
  },
}

var updateTimeoutId

io.on('connection', function (socket) {
  data.onlines += 1

  socket.emit('update', data)

  var tugTimeoutId

  socket.on('tug', function (team) {
    if (tugTimeoutId)
      return

    tugTimeoutId = setTimeout(function () {
      tugTimeoutId = null

      if (!data.teams[team] || !data.teams.a.image || !data.teams.b.image)
        return

      if (data.teams[team].image)
        data.teams[team].score += 1

      if (Math.abs(data.teams.a.score - data.teams.b.score) > 50 * data.onlines) {
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

  var tucaoTimeoutId
  var tucaoCount = 0
  var clearTucaoCountTimeoutId

  socket.on('tucao', function (team, content) {
    tucaoCount += 1    

    if (!clearTucaoCountTimeoutId)
      clearTucaoCountTimeoutId = setTimeout(function () {
        clearTucaoCountTimeoutId = null
        tucaoCount = 0
      }, 100000)

    if (
      tucaoTimeoutId ||
      !content || !content.trim() ||
      content.length > 20
    )
      return

    tucaoTimeoutId = setTimeout(function () {
      tucaoTimeoutId = null

      if (tucaoCount > 100) {
        clearTimeout(clearTucaoCountTimeoutId)
        socket.emit('tucao', team, content)
        return
      }

      io.emit('tucao', team, content)
    }, 16)
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
