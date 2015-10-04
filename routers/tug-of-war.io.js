var tugOfWar = require('../models/tug-of-war')

module.exports = function (io) {
  var updateTimeoutId

  io.on('connection', function (socket) {
    tugOfWar.onlines += 1

    socket.emit('update', tugOfWar)

    var tugTimeoutId

    socket.on('tug', function (team) {
      if (tugTimeoutId)
        return

      tugTimeoutId = setTimeout(function () {
        tugTimeoutId = null

        if (!tugOfWar.teams[team] || !tugOfWar.teams.a.image || !tugOfWar.teams.b.image)
          return

        if (tugOfWar.teams[team].image)
          tugOfWar.teams[team].score += 1

        if (Math.abs(tugOfWar.teams.a.score - tugOfWar.teams.b.score) > 50 * tugOfWar.onlines) {
          tugOfWar.teams.a.score = 0
          tugOfWar.teams.a.power = 0
          tugOfWar.teams.a.image = null
          tugOfWar.teams.b.score = 0
          tugOfWar.teams.b.power = 0
          tugOfWar.teams.b.image = null
        }

        if (updateTimeoutId)
          return

        updateTimeoutId = setTimeout(function () {
          updateTimeoutId = null
          io.emit('update', tugOfWar)
        }, 16)
      })
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
      tugOfWar.onlines -= 1
    })
  })

  var lastTime = new Date().getTime()
  var lastScoreA = tugOfWar.teams.a.score
  var lastScoreB = tugOfWar.teams.b.score

  setInterval(function () {
    var now = new Date().getTime()
    var timespan = (now - lastTime)

    tugOfWar.teams.a.power = (tugOfWar.teams.a.score - lastScoreA) / timespan * 1000
    tugOfWar.teams.b.power = (tugOfWar.teams.b.score - lastScoreB) / timespan * 1000

    lastTime = now
    lastScoreA = tugOfWar.teams.a.score
    lastScoreB = tugOfWar.teams.b.score

    io.emit('update', tugOfWar)
  }, 1000)
}
