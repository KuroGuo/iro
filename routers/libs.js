var express = require('express')
var router = express.Router()
var fs = require('fs')
var path = require('path')

router.get('/vue.js', function (req, res, next) {
  res.sendFile(path.normalize(
    `${__dirname}/../node_modules/vue/dist/vue.min.js`
  ), function (err) {
    if (err)
      next(err)
  })
})

module.exports = router
