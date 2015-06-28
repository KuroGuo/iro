'use strict'

var express = require('express')
var router = express.Router()
var multer = require('multer')
var crypto = require('crypto')
var fs = require('fs')
var path = require('path')
var async = require('async')

var log = require ('../log')
var tugOfWar = require('../models/tug-of-war')
var Image = require('../models/image')

router.use(multer({
  dest: './public/uploads/temps/',
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
    fields: 2
  }
}))

router.get('/', function (req, res, next) {
  var viewsDirname = req.app.get('views')
  res.sendFile(path.normalize(
    `${viewsDirname}/tug-of-war/index.html`
  ), function (err) {
      if (err) return next(err)
  })
})

router.put('/teams/:name/image', function (req, res, next) {
  var name = req.params.name
  var width = req.body.width
  var height = req.body.height
  var imageFile = req.files && req.files.image

  if (!imageFile)
    return res.sendStatus(400)

  var team = tugOfWar.teams[name]

  if (!team || imageFile.mimetype.indexOf('image/') !== 0) {
    fs.unlink(imageFile.path)
    return res.sendStatus(400)
  }

  async.waterfall([
    function (callback) {
      var md5 = crypto.createHash('md5')
      var s = fs.ReadStream(imageFile.path)
      s.on('data', function (d) {
        md5.update(d)
      })
      s.on('end', function () {
        callback(null, md5.digest('hex'))
      })
    },
    function (imageId, callback) {
      Image.findById(imageId, 'fileName', function (err, image) {
        if (err) return callback(err)
        if (image) {
          if (team.image) return res.sendStatus(400)
          team.image = `/uploads/${image.fileName}`
          res.sendStatus(201)
          res.locals.io.emit('update', tugOfWar)
          return
        }
        callback(null, imageId)
      })
    },
    function (imageId, callback) {
      const FILE_NAME = `${imageId}${path.extname(imageFile.name)}`
      const IMAGE_SRC = `/uploads/${FILE_NAME}`

      fs.rename(
        imageFile.path,
        path.normalize(`${__dirname}/../public${IMAGE_SRC}`),
        function (err) {
          if (err) return callback(err)

          if (team.image) return res.sendStatus(400)

          team.image = IMAGE_SRC
          res.sendStatus(201)
          res.locals.io.emit('update', tugOfWar)

          callback(null, imageId, FILE_NAME)
        }
      )
    },
    function (imageId, fileName, callback) {
      Image.findByIdAndUpdate(
        imageId,
        {
          uploadTime: new Date(),
          fileName: fileName,
          width: width,
          height: height
        },
        { upsert: true, select: '_id' },
        function (err) {
          if (err) return log(err)
          callback()
        }
      )
    }
  ], function (err) {
    if (err) return next(err)
  })
})

module.exports = router
