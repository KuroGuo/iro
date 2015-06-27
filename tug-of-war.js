var data = {
  onlines: 0,
  teams: {
    a: { score: 0, power: 0, image: null },
    b: { score: 0, power: 0, image: null }
  },
}

module.exports = {
  get onlines() {
    return data.onlines
  },
  set onlines(value) {
    if (typeof value !== 'number') return
    data.onlines = value
  },
  get teams() {
    return {
      get a() {
        return {
          get score() {
            return data.teams.a.score
          },
          set score(value) {
            if (typeof value !== 'number') return
            data.teams.a.score = value
          },
          get power() {
            return data.teams.a.power
          },
          set power(value) {
            if (typeof value !== 'number') return
            data.teams.a.power = value
          },
          get image() {
            return data.teams.a.image
          },
          set image(value) {
            if (typeof value !== 'string') return
            data.teams.a.image = value
          }
        }
      },
      get b() {
        return {
          get score() {
            return data.teams.b.score
          },
          set score(value) {
            if (typeof value !== 'number') return
            data.teams.b.score = value
          },
          get power() {
            return data.teams.b.power
          },
          set power(value) {
            if (typeof value !== 'number') return
            data.teams.b.power = value
          },
          get image() {
            return data.teams.b.image
          },
          set image(value) {
            if (typeof value !== 'string') return
            data.teams.b.image = value
          }
        }
      }
    }
  }
}
