/* Remote-control navigation.
 * Every element with class "focusable" can receive focus. Arrow keys move
 * focus to the nearest focusable element in that direction ("spatial
 * navigation"), OK/Enter clicks it, and Back is handed to the app.
 */
(function () {
  var KEYS = {
    37: 'left', 38: 'up', 39: 'right', 40: 'down',
    13: 'enter',
    8: 'back', 27: 'back', 461: 'back', 10009: 'back', 166: 'back',
    33: 'chup', 427: 'chup', 34: 'chdown', 428: 'chdown',
    403: 'red', 404: 'green', 405: 'yellow', 406: 'blue'
  };

  var current = null;
  var scope = document;

  function isVisible(el) {
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function candidates() {
    var all = scope.querySelectorAll('.focusable');
    var out = [];
    for (var i = 0; i < all.length; i++) if (isVisible(all[i])) out.push(all[i]);
    return out;
  }

  function focus(el, opts) {
    if (!el) return;
    if (current) current.classList.remove('focused');
    current = el;
    el.classList.add('focused');
    if (!(opts && opts.noScroll)) {
      try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      catch (e) { el.scrollIntoView(false); }
    }
    if (Nav.onFocus) Nav.onFocus(el);
  }

  // Find the best element in a direction from the current one.
  function move(dir) {
    var list = candidates();
    if (!current || list.indexOf(current) === -1) { focus(list[0]); return !!list[0]; }
    var a = current.getBoundingClientRect();
    var best = null, bestScore = Infinity;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === current) continue;
      var b = el.getBoundingClientRect();
      var primary, ortho;
      if (dir === 'right') { primary = b.left - a.right; ortho = overlap(a.top, a.bottom, b.top, b.bottom); if (b.left + b.width / 2 <= a.left + a.width / 2) continue; }
      if (dir === 'left') { primary = a.left - b.right; ortho = overlap(a.top, a.bottom, b.top, b.bottom); if (b.left + b.width / 2 >= a.left + a.width / 2) continue; }
      if (dir === 'down') { primary = b.top - a.bottom; ortho = overlap(a.left, a.right, b.left, b.right); if (b.top + b.height / 2 <= a.top + a.height / 2) continue; }
      if (dir === 'up') { primary = a.top - b.bottom; ortho = overlap(a.left, a.right, b.left, b.right); if (b.top + b.height / 2 >= a.top + a.height / 2) continue; }
      var score = Math.max(primary, 0) + ortho * 3;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) focus(best);
    return !!best;
  }

  // 0 when the ranges overlap, otherwise the gap between them.
  function overlap(a1, a2, b1, b2) {
    if (b2 < a1) return a1 - b2;
    if (b1 > a2) return b1 - a2;
    return 0;
  }

  document.addEventListener('keydown', function (e) {
    var key = KEYS[e.keyCode];
    // Let people type in real text inputs.
    if (e.target && e.target.tagName === 'INPUT' && key !== 'up' && key !== 'down' && key !== 'back') return;
    if (Nav.onKey && Nav.onKey(key, e) === true) { e.preventDefault(); return; }
    if (!key) return;
    e.preventDefault();
    if (key === 'enter') { if (current) current.click(); return; }
    if (key === 'back') { if (Nav.onBack) Nav.onBack(); return; }
    if (key === 'left' || key === 'right' || key === 'up' || key === 'down') move(key);
  });

  // Mouse support for testing on a computer. Browsers also fire mousemove
  // when content scrolls under a still pointer; ignore those.
  var lastX = -1, lastY = -1;
  document.addEventListener('mousemove', function (e) {
    if (e.clientX === lastX && e.clientY === lastY) return;
    var first = lastX === -1;
    lastX = e.clientX; lastY = e.clientY;
    if (first) return;
    var el = e.target.closest && e.target.closest('.focusable');
    if (el && el !== current) focus(el, { noScroll: true });
  });

  window.Nav = {
    focus: focus,
    move: move,
    get current() { return current; },
    setScope: function (el) { scope = el || document; },
    blur: function () { if (current) current.classList.remove('focused'); current = null; },
    onKey: null,
    onBack: null,
    onFocus: null
  };
})();
