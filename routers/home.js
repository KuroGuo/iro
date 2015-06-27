var express = require('express')
var router = express.Router()
var multer = require('multer')
var crypto = require('crypto')
var fs = require('fs')
var path = require('path')

var tugOfWar = require('../tug-of-war')

router.use(express.static('public/home'))

router.use(multer({
  dest: './uploads/temps/',
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
    fields: 0
  }
}))

router.put('/teams/:name/image', function (req, res, next) {
  var name = req.params.name
  var imageFile = req.files && req.files.image

  if (!imageFile)
    return res.sendStatus(400)

  var team = tugOfWar.teams[name]

  if (!team || imageFile.mimetype.indexOf('image/') !== 0) {
    fs.unlink(imageFile.path)
    return res.sendStatus(400)
  }

  var md5 = crypto.createHash('md5')
  var s = fs.ReadStream(imageFile.path)
  s.on('data', function (d) {
    md5.update(d)
  })
  s.on('end', function () {
    var imageSrc = '/uploads/' + md5.digest('hex') + path.extname(imageFile.name)
    fs.rename(
      imageFile.path,
      path.normalize(`${__dirname}/..${imageSrc}`),
      function (err) {
        if (err)
          return next(err)

        if (team.image)
          return res.sendStatus(400)

        team.image = imageSrc
        res.sendStatus(201)
        res.locals.io.emit('update', tugOfWar)
      }
    )
  })
})

module.exports = router
