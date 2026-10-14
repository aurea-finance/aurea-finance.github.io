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
