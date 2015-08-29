var express = require('express')
var router = express.Router()
var fs = require('fs')
var path = require('path')

router.get('/vue.js', function (req, res) {
  res.sendFile(path.normalize(
    `${__dirname}/../node_modules/vue/dist/vue.min.js`
  ))
})

router.get('/async.js', function (req, res) {
  res.sendFile(path.normalize(
    `${__dirname}/../node_modules/async/lib/async.js`
  ))
})

module.exports = router
