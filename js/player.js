/* Plays one channel. Tries each of the channel's streams in turn: first with
 * hls.js, then with the TV's built-in HLS player. Calls onFail when nothing
 * works, onPlaying once video starts.
 */
(function () {
  var video = document.getElementById('video');
  var hls = null;
  var timer = null;
  var channel = null;
  var streamIndex = 0;
  var triedNative = false;
  var token = 0; // ignores events from a stream we already gave up on

  var canNative = !!video.canPlayType('application/vnd.apple.mpegurl');
  var canHlsJs = !!(window.Hls && window.Hls.isSupported());

  function stop() {
    clearTimeout(timer);
    if (hls) { hls.destroy(); hls = null; }
    video.removeAttribute('src');
    try { video.load(); } catch (e) { /* ignore */ }
  }

  function startStream() {
    stop();
    var my = ++token;
    var url = channel.s[streamIndex].u;
    triedNative = false;

    // Give each stream 20 seconds to start.
    timer = setTimeout(function () { if (my === token) failStream('timeout'); }, 20000);

    if (canHlsJs) {
      hls = new Hls({ maxBufferLength: 30, manifestLoadingMaxRetry: 1, levelLoadingMaxRetry: 2 });
      hls.on(Hls.Events.ERROR, function (evt, data) {
        if (my !== token || !data.fatal) return;
        // hls.js needs CORS; the native player doesn't, so fall back to it.
        if (canNative && !triedNative) { playNative(url, my); return; }
        failStream(data.details);
      });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      playNative(url, my);
    }
    video.play().catch(function () { /* autoplay may wait for media */ });
  }

  function playNative(url, my) {
    triedNative = true;
    if (hls) { hls.destroy(); hls = null; }
    video.src = url;
    video.play().catch(function () {});
  }

  video.addEventListener('error', function () {
    if (!hls && channel) failStream('media error');
  });
  video.addEventListener('playing', function () {
    clearTimeout(timer);
    if (Player.onPlaying) Player.onPlaying(channel, streamIndex);
  });

  function failStream(reason) {
    if (!channel) return;
    console.warn('Stream failed', channel.i, streamIndex, reason);
    if (streamIndex + 1 < channel.s.length) {
      streamIndex++;
      if (Player.onStatus) Player.onStatus('Trying another stream…');
      startStream();
    } else {
      stop();
      if (Player.onFail) Player.onFail(channel);
    }
  }

  window.Player = {
    play: function (ch) {
      channel = ch;
      streamIndex = 0;
      startStream();
    },
    nextStream: function () {
      if (!channel) return false;
      streamIndex = (streamIndex + 1) % channel.s.length;
      startStream();
      return channel.s.length > 1;
    },
    stop: function () { token++; channel = null; stop(); },
    onPlaying: null,
    onStatus: null,
    onFail: null
  };
})();
