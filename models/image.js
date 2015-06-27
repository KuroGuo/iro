var mongoose = require('mongoose')

var imageSchema = new mongoose.Schema({
  _id: String,
  uploadTime: Date,
  fileName: String,
  width: Number,
  height: Number
})

module.exports = mongoose.model('Image', imageSchema)
