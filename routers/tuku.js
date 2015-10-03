'use strict'

var express = require('express')
var router = express.Router()
var bodyParser = require('body-parser')
var async = require('async')
var fs = require('fs')
var path = require('path')

var Image = require('../models/image')

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

const PAGE_SIZE = 20

router.get('/', function (req, res, next) {
  var page = Math.floor(req.query.page) || 1

  renderList(req, res, next, null, '-uploadTime', page)
})

router.get('/today', function (req, res, next) {
  var page = Math.floor(req.query.page) || 1

  var start = new Date()
  start.setHours(0)
  start.setMinutes(0)
  start.setSeconds(0)
  start.setMilliseconds(0)

  var end = new Date()
  end.setHours(24)
  end.setMinutes(0)
  end.setSeconds(0)
  end.setMilliseconds(0)

  var selector = {
    uploadTime: {
      $gte: start,
      $lt: end
    }
  }

  renderList(req, res, next, selector, '-uploadTime', page, '今日最新')
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

function renderList(req, res, next, selector, sort, page, title) {
  async.waterfall([
    function (callback) {
      Image.find(selector).count(function (err, count) {
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
        .find(selector)
        .sort(sort)
        .select('fileName width height')
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .exec(function (err, images) {
          if (err) return next(err)
          res.render('tuku/index', {
            title: title,
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
}

module.exports = router
