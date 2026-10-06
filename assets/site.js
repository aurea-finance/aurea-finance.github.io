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
