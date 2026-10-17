// Wren voice shim. Swaps the browser's built-in speechSynthesis voice for
// Wren's recorded voice (ElevenLabs "Jessica") fetched from /api/tts, and
// falls back to the original browser voice if that is unavailable.
//
// app/route.ts injects this into "Wren Learning Tutor.html" when it serves
// the page, so the page's own code keeps calling speechSynthesis.speak()
// unchanged: same queueing, same onend callbacks, same cancel().
(function () {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || window.__wrenVoice) return;
  window.__wrenVoice = true;

  var synth = window.speechSynthesis;
  var origSpeak = synth.speak.bind(synth);
  var origCancel = synth.cancel.bind(synth);
  var queue = [];
  var current = null;
  var generation = 0;
  var urls = new Map(); // text -> object URL, so a repeated line never refetches
  var disabled = false; // set once /api/tts says there is no voice to give

  function urlFor(text) {
    if (urls.has(text)) return Promise.resolve(urls.get(text));
    return fetch("/api/tts?text=" + encodeURIComponent(text))
      .then(function (r) {
        if (r.status === 503) disabled = true;
        if (!r.ok) throw new Error("tts " + r.status);
        return r.blob();
      })
      .then(function (blob) {
        var u = URL.createObjectURL(blob);
        urls.set(text, u);
        return u;
      });
  }

  // Fire the utterance's event the way the browser would.
  function fire(u, name) {
    if (!u) return;
    try {
      var handler = u["on" + name];
      if (typeof handler === "function") handler.call(u, { type: name, utterance: u, charIndex: 0, elapsedTime: 0 });
    } catch (e) {}
  }

  function speakWithBrowser(u) {
    current = null;
    try {
      origSpeak(u); // its own onend fires from the browser
    } catch (e) {
      fire(u, "end");
    }
    next();
  }

  function next() {
    if (current || !queue.length) return;
    var u = queue.shift();
    var mine = ++generation;
    current = u;
    if (disabled) return speakWithBrowser(u);

    urlFor(u.text)
      .then(function (url) {
        if (mine !== generation) return; // cancelled while fetching
        var audio = new Audio(url);
        u.__wrenAudio = audio;
        audio.onplay = function () { fire(u, "start"); };
        audio.onended = function () {
          if (mine !== generation) return;
          current = null;
          fire(u, "end");
          next();
        };
        audio.onerror = function () { if (mine === generation) speakWithBrowser(u); };
        audio.play().catch(function () { if (mine === generation) speakWithBrowser(u); });
      })
      .catch(function () { if (mine === generation) speakWithBrowser(u); });
  }

  synth.speak = function (u) {
    if (!u || !u.text || !String(u.text).trim()) { fire(u, "end"); return; }
    queue.push(u);
    next();
  };

  synth.cancel = function () {
    generation++;
    queue = [];
    if (current && current.__wrenAudio) {
      try { current.__wrenAudio.pause(); } catch (e) {}
    }
    current = null;
    origCancel();
  };

  try {
    Object.defineProperty(synth, "speaking", { get: function () { return !!current; }, configurable: true });
    Object.defineProperty(synth, "pending", { get: function () { return queue.length > 0; }, configurable: true });
  } catch (e) {}
})();
