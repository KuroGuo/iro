var express = require('express')
var router = express.Router()
var bodyParser = require('body-parser')
var bcrypt = require('bcrypt')

var User = require('../models/user')

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))

router.get('/', function (req, res, next) {
  res.render('login')
})

router.post('/', function (req, res, next) {
  var name = req.body.name
  var password = req.body.password

  User.findOne({ name: name }, function (err, user) {
    if (!user) return res.sendStatus(401)
    bcrypt.compare(password, user.password, function (err, equal) {
      if (err) return next(err)
      if (equal) {
        req.session.user = {
          id: user._id,
          name: user.name,
          role: user.role
        }
        res.sendStatus(201)
      } else {
        res.sendStatus(401)
      }
    })
  })
})

module.exports = router
