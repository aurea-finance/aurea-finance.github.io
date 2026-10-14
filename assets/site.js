// Picks pt, en or fr from ?lang=, then the browser, and lets the reader switch.
(function () {
  var supported = ['pt', 'en', 'fr']
  function pick() {
    var fromQuery = new URLSearchParams(location.search).get('lang')
    if (supported.indexOf(fromQuery) >= 0) return fromQuery
    var languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']
    for (var i = 0; i < languages.length; i++) {
      var code = String(languages[i]).slice(0, 2).toLowerCase()
      if (supported.indexOf(code) >= 0) return code
    }
    return 'en'
  }
  function apply(lang) {
    document.documentElement.lang = lang
    var buttons = document.querySelectorAll('.languages button')
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-current', String(buttons[i].dataset.set === lang))
    var title = document.querySelector('[data-title-' + lang + ']')
    if (title) document.title = title.getAttribute('data-title-' + lang)
  }
  apply(pick())
  document.addEventListener('click', function (event) {
    var target = event.target.closest('.languages button')
    if (target) apply(target.dataset.set)
  })
})()

// Opens gallery screenshots enlarged; arrows and swipes move through the
// gallery of the visible language, Escape or a click outside closes it.
;(function () {
  var box = document.createElement('div')
  box.className = 'lightbox'
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-modal', 'true')
  box.innerHTML = '<button type="button" class="lb-close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><button type="button" class="lb-prev"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><img alt=""><p></p><button type="button" class="lb-next"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>'
  document.body.appendChild(box)
  var image = box.querySelector('img')
  var caption = box.querySelector('p')
  var shots = []
  var index = 0
  function show(i) {
    index = (i + shots.length) % shots.length
    var shot = shots[index]
    image.src = shot.src
    image.alt = shot.alt
    var figcaption = shot.parentNode.querySelector('figcaption')
    caption.textContent = figcaption ? figcaption.textContent : ''
  }
  var labels = { pt: ['Fechar', 'Anterior', 'Seguinte'], en: ['Close', 'Previous', 'Next'], fr: ['Fermer', 'Précédente', 'Suivante'] }
  function open(shot) {
    var words = labels[document.documentElement.lang] || labels.en
    var buttons = box.querySelectorAll('button')
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-label', words[i])
    shots = Array.prototype.slice.call(shot.closest('.gallery').querySelectorAll('.shot'))
    show(shots.indexOf(shot))
    box.classList.add('open')
    document.body.classList.add('lightbox-open')
  }
  function close() {
    box.classList.remove('open')
    document.body.classList.remove('lightbox-open')
  }
  document.addEventListener('click', function (event) {
    var shot = event.target.closest('.gallery .shot')
    if (shot) return open(shot)
    if (!box.classList.contains('open')) return
    if (event.target.closest('.lb-prev')) return show(index - 1)
    if (event.target.closest('.lb-next')) return show(index + 1)
    close()
  })
  document.addEventListener('keydown', function (event) {
    if (!box.classList.contains('open')) return
    if (event.key === 'Escape') close()
    else if (event.key === 'ArrowLeft') show(index - 1)
    else if (event.key === 'ArrowRight') show(index + 1)
  })
  var startX = null
  box.addEventListener('touchstart', function (event) { startX = event.touches[0].clientX }, { passive: true })
  box.addEventListener('touchend', function (event) {
    if (startX === null) return
    var delta = event.changedTouches[0].clientX - startX
    startX = null
    if (Math.abs(delta) > 50) show(delta < 0 ? index + 1 : index - 1)
  })
})()

// A soft curved line, like a chart, that links the feature headings: it runs
// beside each text, bends across in the space between rows and never crosses
// an image. Only drawn when the window leaves room for it.
;(function () {
  var NS = 'http://www.w3.org/2000/svg'
  var LANE = 28
  function draw() {
    var lists = document.querySelectorAll('.show')
    for (var l = 0; l < lists.length; l++) {
      var list = lists[l]
      var old = list.querySelector('.show-curve')
      if (old) old.remove()
      if (!list.offsetParent || window.innerWidth < 1240) continue
      var box = list.getBoundingClientRect()
      var rows = list.querySelectorAll('.show-row')
      var stops = []
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i].getBoundingClientRect()
        var text = rows[i].querySelector('.show-text').getBoundingClientRect()
        var head = rows[i].querySelector('.show-text h3').getBoundingClientRect()
        stops.push({
          wide: rows[i].classList.contains('wide'),
          lane: text.left - box.left - LANE,
          dot: head.top - box.top + head.height / 2,
          textBottom: text.bottom - box.top,
          top: row.top - box.top,
          bottom: row.bottom - box.top
        })
      }
      if (stops.length < 2) continue
      var margin = -LANE
      function bend(x1, y1, x2, y2) {
        var m = (y1 + y2) / 2
        return ' L' + x1 + ' ' + y1 + ' C' + x1 + ' ' + m + ' ' + x2 + ' ' + m + ' ' + x2 + ' ' + y2
      }
      var d = 'M' + stops[0].lane + ' ' + stops[0].dot
      for (var s = 0; s < stops.length - 1; s++) {
        var a = stops[s]
        var b = stops[s + 1]
        var x = a.lane
        var y = a.bottom
        if (a.wide) {
          // Out of the centred text into the margin, then down beside the wide image.
          var gapMid = a.textBottom + 28
          d += bend(a.lane, a.textBottom + 4, margin, gapMid + 20)
          x = margin
        }
        d += bend(x, y, b.lane, b.top) + ' L' + b.lane + ' ' + b.dot
      }
      var svg = document.createElementNS(NS, 'svg')
      svg.setAttribute('class', 'show-curve')
      svg.setAttribute('aria-hidden', 'true')
      svg.setAttribute('width', box.width)
      svg.setAttribute('height', box.height)
      var id = 'curve-grad-' + l
      svg.innerHTML =
        '<defs><linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="' + box.height + '"><stop offset="0" stop-color="#b6cee3" stop-opacity="0.15"/><stop offset="0.12" stop-color="#b6cee3" stop-opacity="0.5"/><stop offset="0.8" stop-color="#b6cee3" stop-opacity="0.45"/><stop offset="1" stop-color="#ebd8b0" stop-opacity="0.5"/></linearGradient></defs>' +
        '<path d="' + d + '" fill="none" stroke="url(#' + id + ')" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        stops.map(function (st) { return '<circle cx="' + st.lane + '" cy="' + st.dot + '" r="5" class="show-curve-dot"/>' }).join('')
      list.appendChild(svg)
    }
  }
  var timer = null
  function later() { clearTimeout(timer); timer = setTimeout(draw, 60) }
  window.addEventListener('load', later)
  window.addEventListener('resize', later)
  document.addEventListener('click', function (event) { if (event.target.closest('.languages button')) later() })
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(later)
  if (window.ResizeObserver) {
    var observer = new ResizeObserver(later)
    var lists = document.querySelectorAll('.show')
    for (var i = 0; i < lists.length; i++) observer.observe(lists[i])
  }
  var images = document.querySelectorAll('.show img')
  for (var k = 0; k < images.length; k++) images[k].addEventListener('load', later)
})()
