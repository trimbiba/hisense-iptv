/* Screens: Home, Browse, Search and the full-screen player. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var PAGE = 60; // cards rendered at a time in grids; TVs are slow with thousands

  var state = {
    screen: 'home',
    browseCountry: null,
    browseCategory: null,
    query: '',
    playlist: [],     // channels the player steps through with up/down
    playIndex: 0,
    returnFocus: null
  };

  // ---------- helpers ----------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2500);
  }

  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  function card(ch, list) {
    var c = el('button', 'card focusable');
    c.dataset.id = ch.i;
    var logo = el('div', 'logo');
    if (ch.l) {
      var img = el('img');
      img.loading = 'lazy';
      img.alt = '';
      img.src = ch.l;
      img.onerror = function () { logo.innerHTML = ''; logo.appendChild(el('span', 'initials', initials(ch.n))); };
      logo.appendChild(img);
    } else {
      logo.appendChild(el('span', 'initials', initials(ch.n)));
    }
    c.appendChild(logo);
    c.appendChild(el('div', 'name', ch.n));
    if (Data.isFavourite(ch.i)) c.appendChild(el('span', 'fav-badge', '★'));
    c.addEventListener('click', function () { openPlayer(list, list.indexOf(ch)); });
    return c;
  }

  // Render a grid page by page, with a "Show more" card at the end.
  function fillGrid(container, list, emptyText) {
    container.innerHTML = '';
    container.scrollTop = 0;
    if (!list.length) { container.appendChild(el('div', 'empty-hint', emptyText)); return; }
    var shown = 0;
    function more() {
      var old = container.querySelector('.more');
      if (old) old.remove();
      list.slice(shown, shown + PAGE).forEach(function (ch) { container.appendChild(card(ch, list)); });
      shown += PAGE;
      if (shown < list.length) {
        var m = el('button', 'card more focusable', 'Show more (' + (list.length - shown) + ')');
        m.addEventListener('click', function () {
          var first = shown;
          more();
          Nav.focus(container.querySelectorAll('.card')[first]);
        });
        container.appendChild(m);
      }
    }
    more();
  }

  // ---------- screens ----------
  function showScreen(name, focusContent) {
    state.screen = name;
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.toggle('active', screens[i].id === 'screen-' + name);
    var tabs = document.querySelectorAll('.tab');
    for (var j = 0; j < tabs.length; j++) tabs[j].classList.toggle('active', tabs[j].dataset.screen === name);
    if (name === 'home') renderHome();
    if (name === 'browse' && !$('country-list').children.length) renderBrowse();
    if (name === 'search' && !$('keyboard').children.length) renderKeyboard();
    if (focusContent) {
      var first = $('screen-' + name).querySelector('.focusable');
      if (first) Nav.focus(first);
    }
  }

  function renderHome() {
    var home = $('screen-home');
    var cfg = Data.config;
    var n = cfg.rowLength || 30;
    home.innerHTML = '';

    function addRow(title, list, hint) {
      if (!list.length && !hint) return;
      var row = el('div', 'row');
      row.appendChild(el('h2', null, title));
      if (!list.length) { row.appendChild(el('p', 'empty-hint', hint)); home.appendChild(row); return; }
      var items = el('div', 'row-items');
      list.slice(0, n).forEach(function (ch) { items.appendChild(card(ch, list)); });
      row.appendChild(items);
      home.appendChild(row);
    }

    addRow('Continue watching', Data.idsToChannels(Data.recents));
    addRow('★ Favourites', Data.idsToChannels(Data.favourites),
      'No favourites yet. While a channel plays, press OK and choose ☆ Favourite.');
    addRow('Pinned', Data.idsToChannels(cfg.pinnedChannels || []));
    (cfg.homeCountries || []).forEach(function (code) {
      addRow(Data.countryLabel(code), Data.filter({ country: code, logosFirst: true }));
    });
    var home_ = cfg.homeCountries || [];
    (cfg.homeCategories || []).forEach(function (cat) {
      var list = Data.filter({ category: cat, logosFirst: true });
      // Channels from your home countries first.
      list.sort(function (a, b) { return (home_.indexOf(b.c) !== -1) - (home_.indexOf(a.c) !== -1); });
      addRow(Data.categories[cat] || cat, list);
    });
  }

  function renderBrowse() {
    var counts = {};
    Data.channels.forEach(function (ch) { counts[ch.c] = (counts[ch.c] || 0) + 1; });
    var home_ = Data.config.homeCountries || [];
    var codes = Object.keys(counts).filter(function (c) { return Data.countries[c]; });
    codes.sort(function (a, b) {
      var ha = home_.indexOf(a), hb = home_.indexOf(b);
      if (ha !== -1 || hb !== -1) return (ha === -1 ? 99 : ha) - (hb === -1 ? 99 : hb);
      return Data.countryName(a).localeCompare(Data.countryName(b));
    });

    var list = $('country-list');
    list.innerHTML = '';
    function item(code, label, count) {
      var b = el('button', 'list-item focusable');
      b.textContent = label;
      b.appendChild(el('span', 'count', String(count)));
      b.dataset.code = code || '';
      b.addEventListener('click', function () { state.browseCountry = code; updateBrowse(); });
      list.appendChild(b);
    }
    item(null, 'All countries', Data.channels.length);
    codes.forEach(function (c) { item(c, Data.countryLabel(c), counts[c]); });

    var chips = $('category-chips');
    chips.innerHTML = '';
    function chip(id, label) {
      var b = el('button', 'chip focusable', label);
      b.dataset.cat = id || '';
      b.addEventListener('click', function () { state.browseCategory = id; updateBrowse(); });
      chips.appendChild(b);
    }
    chip(null, 'All');
    Object.keys(Data.categories).forEach(function (id) { chip(id, Data.categories[id]); });

    state.browseCountry = home_[0] || null;
    updateBrowse();
  }

  function updateBrowse() {
    var items = $('country-list').children;
    for (var i = 0; i < items.length; i++) items[i].classList.toggle('selected', (items[i].dataset.code || null) === state.browseCountry);
    var chips = $('category-chips').children;
    for (var j = 0; j < chips.length; j++) chips[j].classList.toggle('selected', (chips[j].dataset.cat || null) === state.browseCategory);
    var list = Data.filter({ country: state.browseCountry, category: state.browseCategory });
    $('browse-title').textContent =
      (state.browseCountry ? Data.countryName(state.browseCountry) : 'All countries') +
      (state.browseCategory ? ' · ' + Data.categories[state.browseCategory] : '') +
      ' — ' + list.length + ' channels';
    fillGrid($('browse-grid'), list, 'No channels here.');
  }

  // ---------- search ----------
  var searchTimer;
  function renderKeyboard() {
    var kb = $('keyboard');
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('').forEach(function (ch) {
      var k = el('button', 'key focusable', ch);
      k.addEventListener('click', function () { typeChar(ch.toLowerCase()); });
      kb.appendChild(k);
    });
    [['Space', ' '], ['⌫ Delete', 'del'], ['Clear', 'clear']].forEach(function (d) {
      var k = el('button', 'key wide focusable', d[0]);
      k.addEventListener('click', function () { typeChar(d[1]); });
      kb.appendChild(k);
    });
    updateSearch();
  }

  function typeChar(c) {
    if (c === 'del') state.query = state.query.slice(0, -1);
    else if (c === 'clear') state.query = '';
    else state.query += c;
    var q = $('search-query');
    q.innerHTML = '';
    if (state.query) q.textContent = state.query;
    else q.appendChild(el('span', 'placeholder', 'Type a channel name…'));
    clearTimeout(searchTimer);
    searchTimer = setTimeout(updateSearch, 250);
  }

  function updateSearch() {
    fillGrid($('search-grid'), Data.search(state.query),
      state.query ? 'No channels found.' : 'Results will appear here.');
  }

  // ---------- player ----------
  var overlayTimer;
  function openPlayer(list, index) {
    state.playlist = list;
    state.returnFocus = Nav.current;
    $('player').hidden = false;
    Nav.blur();
    Nav.setScope($('player-actions'));
    playAt(index);
  }

  function playAt(index) {
    var list = state.playlist;
    if (!list.length) return;
    state.playIndex = (index + list.length) % list.length;
    var ch = list[state.playIndex];
    $('player-name').textContent = ch.n;
    $('player-meta').textContent = [
      Data.countryLabel(ch.c),
      ch.g.map(function (g) { return Data.categories[g] || g; }).join(', '),
      (state.playIndex + 1) + ' / ' + list.length
    ].filter(Boolean).join('  ·  ');
    var logo = $('player-logo');
    logo.hidden = !ch.l;
    if (ch.l) logo.src = ch.l;
    updateFavButton();
    setStatus('Loading…');
    showOverlay(false);
    Data.addRecent(ch.i);
    Player.play(ch);
  }

  function setStatus(text) { $('player-status').textContent = text || ''; }

  function updateFavButton() {
    var ch = state.playlist[state.playIndex];
    var b = document.querySelector('[data-action="fav"]');
    b.textContent = ch && Data.isFavourite(ch.i) ? '★ Favourite' : '☆ Favourite';
  }

  function overlayVisible() { return !$('player-overlay').classList.contains('hidden'); }

  function showOverlay(withFocus) {
    $('player-overlay').classList.remove('hidden');
    if (withFocus && !Nav.current) Nav.focus(document.querySelector('#player-actions button'));
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(hideOverlay, 6000);
  }

  function hideOverlay() {
    $('player-overlay').classList.add('hidden');
    Nav.blur();
  }

  function closePlayer() {
    Player.stop();
    clearTimeout(overlayTimer);
    $('player').hidden = true;
    Nav.setScope(null);
    Nav.blur();
    // Rows may have changed (recents, favourites).
    if (state.screen === 'home') renderHome();
    var back = state.returnFocus && document.body.contains(state.returnFocus) ? state.returnFocus : null;
    if (!back && state.returnFocus) back = document.querySelector('.card[data-id="' + state.returnFocus.dataset.id + '"]');
    Nav.focus(back || document.querySelector('.tab.active'));
  }

  Player.onPlaying = function () { setStatus(''); };
  Player.onStatus = setStatus;
  Player.onFail = function () {
    setStatus('This channel isn’t available right now.\nPress OK for the next channel.');
    showOverlay(false);
    Nav.focus(document.querySelector('[data-action="next"]'));
  };

  document.getElementById('player-actions').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var ch = state.playlist[state.playIndex];
    var a = b.dataset.action;
    if (a === 'prev') playAt(state.playIndex - 1);
    if (a === 'next') playAt(state.playIndex + 1);
    if (a === 'close') closePlayer();
    if (a === 'fav') { toast(Data.toggleFavourite(ch.i) ? 'Added to favourites' : 'Removed from favourites'); updateFavButton(); }
    if (a === 'alt') { if (!Player.nextStream()) toast('This channel has only one stream'); else setStatus('Trying another stream…'); }
    if (a === 'hide') {
      Data.hide(ch.i);
      state.playlist.splice(state.playIndex, 1);
      toast(ch.n + ' hidden');
      if (!state.playlist.length) { closePlayer(); return; }
      playAt(state.playIndex);
    }
    showOverlay(true);
  });

  // ---------- keys ----------
  Nav.onKey = function (key, e) {
    var playing = !$('player').hidden;
    if (playing) {
      if (key === 'chup') { playAt(state.playIndex - 1); return true; }
      if (key === 'chdown') { playAt(state.playIndex + 1); return true; }
      if (!overlayVisible()) {
        if (key === 'up') { playAt(state.playIndex - 1); return true; }
        if (key === 'down') { playAt(state.playIndex + 1); return true; }
        if (key === 'enter' || key === 'left' || key === 'right') { showOverlay(true); return true; }
      } else if (key) {
        showOverlay(false); // keep it open while the user is using it
      }
      return false;
    }
    // Typing on a real keyboard in Search.
    if (state.screen === 'search' && e.key && e.key.length === 1 && /[\w ]/.test(e.key)) {
      typeChar(e.key.toLowerCase()); return true;
    }
    if (state.screen === 'search' && e.keyCode === 8 && state.query) { typeChar('del'); return true; }
    // Moving up from the top of a screen lands on the tabs.
    if (key === 'up' && !Nav.current) { Nav.focus(document.querySelector('.tab.active')); return true; }
    return false;
  };

  Nav.onBack = function () {
    if (!$('player').hidden) {
      if (overlayVisible() && Nav.current) { hideOverlay(); return; }
      closePlayer();
      return;
    }
    var active = document.querySelector('.tab.active');
    if (Nav.current && Nav.current.classList.contains('tab')) {
      if (state.screen !== 'home') { showScreen('home'); Nav.focus(document.querySelector('.tab.active')); }
      return;
    }
    Nav.focus(active);
  };

  var tabs = document.querySelectorAll('.tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () { showScreen(this.dataset.screen, true); });
  }
  // Switch screens as soon as a tab is focused, like most TV apps.
  Nav.onFocus = function (elem) {
    if (elem.classList.contains('tab') && elem.dataset.screen !== state.screen) showScreen(elem.dataset.screen);
  };

  function tick() {
    var d = new Date();
    $('clock').textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  // ---------- start ----------
  Data.init().then(function () {
    var cfg = Data.config;
    if (cfg.appName) { $('brand').textContent = cfg.appName; document.title = cfg.appName; }
    if (cfg.accentColor) document.documentElement.style.setProperty('--accent', cfg.accentColor);
    tick(); setInterval(tick, 30000);
    showScreen('home');
    $('loading').hidden = true;
    var first = $('screen-home').querySelector('.card');
    Nav.focus(first || document.querySelector('.tab'));
  }).catch(function (err) {
    console.error(err);
    $('loading').textContent = 'Could not load channels. Check the internet connection and reload.';
  });
})();
