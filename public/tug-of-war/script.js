;(function () {
  var socket = io.connect(location.host + '/tug-of-war')

  var app = new Vue({
    el: document.documentElement,
    data: {
      loaded: false,
      myTeam: null,
      onlines: null,
      teams: {
        a: { score: null, power: null, image: null },
        b: { score: null, power: null, image: null }
      },
      longTugTimeout: null,
      longTugStartTime: null
    },
    ready: function () {
      document.addEventListener('mousedown', function (e) {
        if (e.target.tagName === 'INPUT')
          return

        this.$$.textbox_a.blur()
        this.$$.textbox_b.blur()
      }.bind(this))

      document.addEventListener('touchstart', function (e) {
        if (e.target.tagName === 'INPUT')
          return

        this.$$.textbox_a.blur()
        this.$$.textbox_b.blur()
      }.bind(this))

      socket.on('update', this.update)
      socket.on('tucao', this.onTucao)
    },
    methods: {
      preventDefault: function (e) {
        e.preventDefault()
      },
      stopPropagation: function (e) {
        e.stopPropagation()
      },
      oncontextmenu: function (e) {
        var image = this.teams[this.myTeam].image
        if (image) {
          e.preventDefault()
          window.open(image)
        }
      },
      tug: function (team, event) {
        if (!this.teams[team])
          return

        if ((event === 'click' || event === 'touchstart') && !this.teams[team].image) {
          return this.uploadImageFile(team)
        }

        if (event === 'click')
          return

        if (!this.teams[team].image)
          return

        this.myTeam = team
        socket.emit('tug', this.myTeam)

        var tip = document.createElement('span')
        tip.classList.add('tip')
        tip.innerHTML = '+1'

        this.$$['team_' + team].appendChild(tip)

        setTimeout(function () {
          this.$$['team_' + team].removeChild(tip)
        }.bind(this), 1000)
      },
      longTugStart: function () {
        if (!this.longTugStartTime) {
          this.longTugStartTime = new Date().getTime()
        }

        var requestTug = function () {
          var now = new Date()

          var timespan = now - this.longTugStartTime;

          var timeout = (1000 - timespan) / 10

          if (timeout < 16) timeout = 16

          this.longTugTimeout = setTimeout(function () {
            requestTug()
            this.tug(this.myTeam)
          }.bind(this), timeout)
        }.bind(this)

        requestTug()
      },
      longTugEnd: function () {
        clearTimeout(this.longTugTimeout)
        this.longTugTimeout = null
        this.longTugStartTime = null
      },
      uploadImageFile: function (team) {
        if (this.teams[team].image)
          return
        this.openFileDialog(function (file) {
          this.readImageFileSize(file, function (err, width, height) {
            if (err) return alert(err)

            var xhr = new XMLHttpRequest()
            xhr.open(
              'PUT',
              location.pathname.replace(/\/$/, '') +
                '/teams/' + team + '/image'
              ,
              true
            )
            var formData = new FormData()
            formData.append('width', width)
            formData.append('height', height)
            formData.append('image', file)
            xhr.send(formData)
          }.bind(this))
        }.bind(this))
      },
      openFileDialog: function (callback) {
        var input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.style.visibility = 'hidden'
        input.onchange = function (e) {
          clearTimeout(timeoutId)
          document.body.removeChild(input)
          callback(e.target.files[0])
        }
        document.body.appendChild(input)
        input.click()
        var timeoutId = setTimeout(function () {
          document.body.removeChild(input)
        }, 60000)
      },
      readImageFileSize: function (file, callback) {
        this.readFileAsURL(file, function (err, url) {
          if (err) return callback(err)

          var revoke = function (url) {
            if (url.indexOf('blob') === 0) {
              window.URL.revokeObjectURL(url)
            }
          }

          var img = document.createElement('img')
          img.onload = function (e) {
            revoke(url)
            callback(null, e.target.width, e.target.height)
          }
          img.onerror = function (e) {
            revoke(url)
            callback(new Error('图片加载失败'))
          }
          img.src = url
        })
      },
      readFileAsURL: function (file, callback) {
        var fr

        try {
          if (window.URL) {
            callback(null, window.URL.createObjectURL(file))
          } else if (FileReader) {
            fr = new FileReader
            fr.onload = function (e) {
              callback(null, e.target.result)
            }
            fr.onerror = function (e) {
              throw e.target
              callback(e.target.error)
            }
            fr.readAsDataURL(file)
          } else {
            throw new Error('没有可用的 FileAPI')
          }
        } catch (err) {
          callback(err)
        }
      },
      tucaoA: function (e) {
        e.preventDefault()

        var input = this.$$.textbox_a

        var value = input.value

        if (!value || value.length > 20)
          return

        socket.emit('tucao', 'a', value)

        input.value = ''
      },
      tucaoB: function (e) {
        e.preventDefault()

        var input = this.$$.textbox_b

        var value = input.value

        if (!value || value.length > 20)
          return

        socket.emit('tucao', 'b', value)

        input.value = ''
      },
      onTucao: function (team, content) {
        var tipTucao = document.createElement('div')
        tipTucao.classList.add('tip-tucao')
        tipTucao.classList.add('tip-tucao-' + team)
        tipTucao.textContent = content

        this.$$['tucao_area_' + team].appendChild(tipTucao)

        setTimeout(function () {
          tipTucao.classList.add('leave')
          setTimeout(function () {
            this.$$['tucao_area_' + team].removeChild(tipTucao)
          }.bind(this), 1000)
        }.bind(this), 6000)
      },
      update: function (data) {
        if (!this.loaded)
          this.loaded = true

        this.teams.a.score = data.teams.a.score
        this.teams.a.power = data.teams.a.power
        this.teams.a.image = data.teams.a.image
        this.teams.b.score = data.teams.b.score
        this.teams.b.power = data.teams.b.power
        this.teams.b.image = data.teams.b.image

        this.onlines = data.onlines
      }
    }
  })
})()
