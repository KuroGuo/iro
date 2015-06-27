var fs = require('fs')
var moment = require('moment')

module.exports = function (err) {
  var showInConsole = true
  var callback

  if (arguments.length === 2) {
    if (typeof arguments[1] === 'function') callback = arguments[1]
    else showInConsole = arguments[1]
  } else if (arguments.length > 2) {
    showInConsole = arguments[1]
    callback = arguments[2]
  }

  var path = `${__dirname}/logs/${moment().format('YYYY-MM-DD')}.log`
  var content = `\n\n\n${moment().format('HH:mm:ss')}\n${err.stack || err}\n\n\n`
  if (showInConsole) console.log(content)
  fs.appendFile(path, content, callback)
}
