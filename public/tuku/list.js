;(function () {
  document.body.style.display = 'block'

  reflow()

  window.addEventListener('resize', function () {
    requestReflow()
  })

  Array.prototype.forEach.call(
    document.querySelectorAll('.image-item'),
    function (item) {
      item.addEventListener('contextmenu', onContextmenu)
    }
  )

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

    var container = document.querySelector('#image_list')

    var rowItemCount

    if (window.innerWidth - 20 < itemWidthWithMargin * 2) {
      rowItemCount = 1
      itemWidth = window.innerWidth - 20 - itemMargin * 2
      itemWidthWithMargin = itemWidth + itemMargin * 2
      itemWidthWithOutPadding = itemWidth - itemPadding * 2
    } else {
      rowItemCount = Math.floor(
        (window.innerWidth - 20) / itemWidthWithMargin
      )
    }

    var containerMaxWidth = rowItemCount * itemWidthWithMargin

    container.style.maxWidth = containerMaxWidth + 'px'

    var items = document.querySelectorAll('.image-item')

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
