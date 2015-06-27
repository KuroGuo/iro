var log = require('../log')

module.exports = function (err, req, res, next) {
  log(err, false)
  next(err)
}
