var mongoose = require('mongoose')

var imageSchema = new mongoose.Schema({
  _id: String,
  uploadTime: { type: Date, index: true },
  fileName: String,
  width: Number,
  height: Number
}, { autoIndex: false })

module.exports = mongoose.model('Image', imageSchema)
