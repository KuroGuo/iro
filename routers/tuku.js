'use strict'

var express = require('express')
var router = express.Router()
var bodyParser = require('body-parser')
var async = require('async')
var fs = require('fs')
var path = require('path')
var sizeOf = require('image-size')

var Image = require('../models/image')

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

router.get('/', function (req, res, next) {
  var page = Math.floor(req.query.page) || 1
  const PAGE_SIZE = 30

  async.waterfall([
    function (callback) {
      Image.find().count(function (err, count) {
        if (err) return next(err)
        callback(null, count)
      })
    },
    function (count, callback) {
      var pageCount = Math.max(Math.ceil(count / PAGE_SIZE), 1)

      if (page < 1) return res.redirect('?page=1')
      else if (page > pageCount) return res.redirect('?page=' + pageCount)

      var buttonCountHalf = 2

      var startPage

      if (page <= buttonCountHalf || pageCount < buttonCountHalf * 2 + 1) {
        startPage = 1
      } else if (page > pageCount - buttonCountHalf) {
        startPage = pageCount - buttonCountHalf * 2
      } else {
        startPage = page - buttonCountHalf
      }

      var pageButtons = []

      if (startPage !== 1){
        pageButtons.push({
          text: '首',
          value: 1
        })
      }

      var i

      for (i = startPage; i < startPage + 5 && i <= pageCount; i++) {
        pageButtons.push({
          text: i.toString(),
          value: i
        })
      }

      if (i - 1 !== pageCount) {
        pageButtons.push({
          text: '尾',
          value: pageCount
        })
      }

      Image
        .find()
        .sort('uploadTime')
        .select('fileName width height')
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .exec(function (err, images) {
          if (err) return next(err)
          res.render('tuku/index', {
            user: req.session.user,
            page: page,
            pageCount: pageCount,
            pageButtons: pageButtons,
            images: images.map(function (image) {
              return {
                id: image._id,
                src: `/uploads/${image.fileName}`,
                width: image.width,
                height: image.height,
                uploadTime: image.uploadTime
              }
            })
          })
        })
    }
  ])
})

router.all('/delete', function (req, res, next) {
  var id = req.query.id

  if (
    !req.session ||
    !req.session.user ||
    req.session.user.role !== 'admin'
  ) {
    return res.sendStatus(403)
  }

  Image.findByIdAndRemove(
    { _id: id },
    { select: 'fileName' },
    function (err, image) {
      if (err) return next(err)

      if (!image) return res.sendStatus(404)

      fs.unlink(
        path.normalize(`${__dirname}/../public/uploads/${image.fileName}`),
        function (err) {
          if (err) return next(err)
        }
      )

      res.redirect('back')
    }
  )
})

router.get('/init', function (req, res, next) {
  if (
    !req.session ||
    !req.session.user ||
    req.session.user.role !== 'admin'
  ) {
    return res.sendStatus(403)
  }

  fs.readdir('./public/uploads/', function (err, files) {
    if (err) throw err
    async.each(files, function (file, callback) {
      if (file === 'temps') return callback()
      sizeOf('./public/uploads/' + file, function (err, dimensions) {
        if (err) return callback()
        var width = dimensions.width
        var height = dimensions.height
        new Image({
          _id: path.basename(file, path.extname(file)),
          width: width,
          height: height,
          fileName: file,
          uploadTime: new Date()
        }).save(function () { callback() })
      })
    }, function (err) {
      if (err) return next(err)
      res.sendStatus(200)
    })
  })
})

module.exports = router
