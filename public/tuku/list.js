;(function () {
  var container = document.querySelector('#image_list')
  var items = document.querySelectorAll('.image-item')
  var itemsImg = document.querySelectorAll('.image-item-img')

  reflow()

  container.style.opacity = 1

  loadImages()

  window.addEventListener('resize', function () {
    requestReflow()
  })

  Array.prototype.forEach.call(
    document.querySelectorAll('.image-item'),
    function (item) {
      item.addEventListener('contextmenu', onContextmenu)
    }
  )

  function loadImages() {
    async.eachLimit(itemsImg, 3, function (img, callback) {
      img.src = img.dataset.src
      img.addEventListener('load', function () {
        callback()
      })
      img.addEventListener('error', function () {
        callback()
      })
    })
  }

  function onContextmenu(e) {
    if (!user || user.role !== 'admin') return
    e.preventDefault()
    location = '/tuku/delete?id=' + e.currentTarget.dataset.id
  }

  var reflowTimeoutId

  function requestReflow() {
    if (reflowTimeoutId) return
    reflowTimeoutId = setTimeout(function () {
      reflowTimeoutId = null
      reflow()
    }, 100)
  }

  function reflow() {
    var itemWidth = 300
    var itemMargin = 6
    var itemPadding = 10

    var itemWidthWithMargin = itemWidth + itemMargin * 2
    var itemWidthWithOutPadding = itemWidth - itemPadding * 2

    var rowItemCount

    var windowWidth = window.innerWidth

    if (windowWidth - 20 < itemWidthWithMargin * 2) {
      rowItemCount = 1
      if (windowWidth > 500) {
        itemWidth = windowWidth - 20 - itemMargin * 2
      } else {
        itemWidth = windowWidth - itemMargin * 2
      }
      itemWidthWithMargin = itemWidth + itemMargin * 2
      itemWidthWithOutPadding = itemWidth - itemPadding * 2
    } else {
      rowItemCount = Math.floor(
        (windowWidth - 20) / itemWidthWithMargin
      )
    }

    var containerMaxWidth = rowItemCount * itemWidthWithMargin

    container.style.maxWidth = containerMaxWidth + 'px'

    var i, j, item, imageNaturalWidth, imageNaturalHeight
    var x, yList = [], minY, minYIndex

    for (i = 0; i < rowItemCount; i++) {
      yList.push(0)
    }

    for (i = 0; i < items.length; i++) {
      item = items[i]

      imageNaturalWidth = parseFloat(item.dataset.width)
      imageNaturalHeight = parseFloat(item.dataset.height)

      item.style.padding = itemPadding + 'px'
      item.style.width = itemWidth + 'px'
      item.style.height =
        itemWidthWithOutPadding *
        imageNaturalHeight / imageNaturalWidth +
        itemPadding * 2 + 'px'

      minYIndex = 0
      minY = yList[0]

      for (j = 0; j < yList.length; j++) {
        if (yList[j] < minY) {
          minYIndex = j
          minY = yList[j]
        }
      }

      x = itemWidthWithMargin * (minYIndex)

      item.style.transform = item.style.webkitTransform =
        'translate(' + (x + itemMargin) + 'px,' +
        (minY + itemMargin) + 'px)'

      yList[minYIndex] += itemWidthWithOutPadding *
        imageNaturalHeight / imageNaturalWidth +
        itemPadding * 2 +
        itemMargin * 2
    }

    var maxY = yList[0]

    yList.forEach(function (y) {
      if (y > maxY) maxY = y
    })

    container.style.height = maxY + 'px'
  }
})()
