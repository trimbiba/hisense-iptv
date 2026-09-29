/* Loads config.json and data/channels.json, and keeps the viewer's own
 * favourites / recently watched / hidden channels in localStorage.
 */
(function () {
  // Browsers block http video on https pages (GitHub Pages), so there we
  // only keep https streams.
  var secure = location.protocol === 'https:';

  function load(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem('mytv.' + key)); return v || fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem('mytv.' + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }

  var Data = {
    secure: secure,
    config: {},
    channels: [],
    byId: {},
    countries: {},
    categories: {},
    favourites: load('favourites', []),
    recents: load('recents', []),
    hidden: load('hidden', []),

    init: function () {
      return Promise.all([getJSON('config.json'), getJSON('data/channels.json')]).then(function (res) {
        var config = res[0], data = res[1];
        Data.config = config;
        Data.countries = data.countries;
        Data.categories = data.categories;
        Data.updated = data.updated;
        var hidden = {};
        (config.hiddenChannels || []).concat(Data.hidden).forEach(function (id) { hidden[id] = true; });
        Data.channels = data.channels.filter(function (ch) {
          if (hidden[ch.i]) return false;
          if (secure) ch.s = ch.s.filter(function (s) { return s.u.indexOf('https:') === 0; });
          return ch.s.length > 0;
        });
        Data.byId = {};
        Data.channels.forEach(function (ch) { Data.byId[ch.i] = ch; });
      });
    },

    // Channels with a logo first, so rows look good.
    filter: function (opts) {
      var list = Data.channels.filter(function (ch) {
        if (opts.country && ch.c !== opts.country) return false;
        if (opts.category && ch.g.indexOf(opts.category) === -1) return false;
        return true;
      });
      if (opts.logosFirst) list.sort(function (a, b) { return (b.l ? 1 : 0) - (a.l ? 1 : 0); });
      return list;
    },

    search: function (q) {
      q = q.trim().toLowerCase();
      if (!q) return [];
      var starts = [], contains = [];
      Data.channels.forEach(function (ch) {
        var n = ch.n.toLowerCase();
        if (n.indexOf(q) === 0) starts.push(ch);
        else if (n.indexOf(q) !== -1) contains.push(ch);
      });
      return starts.concat(contains);
    },

    idsToChannels: function (ids) {
      return ids.map(function (id) { return Data.byId[id]; }).filter(Boolean);
    },

    isFavourite: function (id) { return Data.favourites.indexOf(id) !== -1; },
    toggleFavourite: function (id) {
      var i = Data.favourites.indexOf(id);
      if (i === -1) Data.favourites.unshift(id); else Data.favourites.splice(i, 1);
      save('favourites', Data.favourites);
      return i === -1;
    },
    addRecent: function (id) {
      Data.recents = [id].concat(Data.recents.filter(function (x) { return x !== id; })).slice(0, 20);
      save('recents', Data.recents);
    },
    hide: function (id) {
      if (Data.hidden.indexOf(id) === -1) Data.hidden.push(id);
      save('hidden', Data.hidden);
      Data.channels = Data.channels.filter(function (ch) { return ch.i !== id; });
      delete Data.byId[id];
    },

    countryName: function (code) {
      var c = Data.countries[code];
      return c ? c.n : (code || '');
    },
    countryLabel: function (code) {
      var c = Data.countries[code];
      return c ? (c.f ? c.f + ' ' : '') + c.n : (code || '');
    }
  };

  window.Data = Data;
})();
