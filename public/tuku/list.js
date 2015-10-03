;(function () {
  Array.prototype.forEach.call(
    document.querySelectorAll('.image-item'),
    function (item) {
      item.addEventListener('contextmenu', onContextmenu)
    }
  )

  function onContextmenu(e) {
    if (!user || user.role !== 'admin') return
    e.preventDefault()
    window.open('/tuku/delete?id=' + e.currentTarget.dataset.id)
  }
})()
