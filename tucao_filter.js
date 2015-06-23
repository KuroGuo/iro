module.exports = function (content) {
  var filter = ['♫', '粗乃玩']

  if (filter.some(function (keyword) {
    return content.indexOf(keyword) >= 0
  }))
    return false
  else
    return true
}