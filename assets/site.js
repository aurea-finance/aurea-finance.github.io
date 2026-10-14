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

// A soft line in the background, like a chart, that weaves from one feature
// to the next behind the pictures, guiding the eye down the section.
;(function () {
  var NS = 'http://www.w3.org/2000/svg'
  function draw() {
    var lists = document.querySelectorAll('.show')
    for (var l = 0; l < lists.length; l++) {
      var list = lists[l]
      var old = list.querySelector('.show-curve')
      if (old) old.remove()
      if (!list.offsetParent || window.innerWidth <= 720) continue
      var box = list.getBoundingClientRect()
      var rows = list.querySelectorAll('.show-row')
      // Around the outer side of each picture, so the wave sweeps from one side of the page to the other.
      var points = [[box.width / 2, -80]]
      for (var i = 0; i < rows.length; i++) {
        var visual = rows[i].querySelector('.show-visual')
        var shot = (visual.firstElementChild || visual).getBoundingClientRect()
        var mid = shot.top - box.top + shot.height / 2
        if (rows[i].classList.contains('wide')) {
          points.push([box.width / 2, mid])
          continue
        }
        var onRight = shot.left - box.left + shot.width / 2 > box.width / 2
        points.push([onRight ? shot.right - box.left + 36 : shot.left - box.left - 36, mid])
      }
      points.push([box.width / 2, box.height + 80])
      // Catmull-Rom through the points, as smooth cubic curves.
      var d = 'M' + points[0][0] + ' ' + points[0][1]
      for (var p = 0; p < points.length - 1; p++) {
        var p0 = points[Math.max(0, p - 1)]
        var p1 = points[p]
        var p2 = points[p + 1]
        var p3 = points[Math.min(points.length - 1, p + 2)]
        var t = 0.9 / 6
        d += ' C' + (p1[0] + (p2[0] - p0[0]) * t) + ' ' + (p1[1] + (p2[1] - p0[1]) * t) + ' ' + (p2[0] - (p3[0] - p1[0]) * t) + ' ' + (p2[1] - (p3[1] - p1[1]) * t) + ' ' + p2[0] + ' ' + p2[1]
      }
      var svg = document.createElementNS(NS, 'svg')
      svg.setAttribute('class', 'show-curve')
      svg.setAttribute('aria-hidden', 'true')
      svg.setAttribute('width', box.width)
      svg.setAttribute('height', box.height)
      var id = 'curve-grad-' + l
      svg.innerHTML =
        '<defs><linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="-60" x2="0" y2="' + (box.height + 60) + '">' +
        '<stop offset="0" stop-color="#b6cee3" stop-opacity="0"/><stop offset="0.08" stop-color="#b6cee3" stop-opacity="0.55"/>' +
        '<stop offset="0.85" stop-color="#b6cee3" stop-opacity="0.5"/><stop offset="0.95" stop-color="#ebd8b0" stop-opacity="0.45"/><stop offset="1" stop-color="#ebd8b0" stop-opacity="0"/></linearGradient>' +
        '<filter id="' + id + '-glow" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="9"/></filter></defs>' +
        '<path d="' + d + '" fill="none" stroke="url(#' + id + ')" stroke-width="10" opacity="0.35" filter="url(#' + id + '-glow)"/>' +
        '<path d="' + d + '" fill="none" stroke="url(#' + id + ')" stroke-width="1.6" stroke-linecap="round"/>'
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
