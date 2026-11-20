const SOUND_SHAPES = {
  open: [{ freq: 520, to: 760, dur: .11, gain: .1 }, { freq: 760, to: 1020, at: .05, dur: .12, gain: .07 }],
  close: [{ freq: 760, to: 430, dur: .13, gain: .08 }],
  send: [{ freq: 880, to: 1180, dur: .06, gain: .06, type: "triangle" }],
  reply: [{ freq: 1500, to: 520, dur: .15, gain: .16 }],
  action: [{ freq: 1250, dur: .045, gain: .05, type: "triangle" }],
  success: [{ freq: 660, dur: .09, gain: .08 }, { freq: 990, at: .08, dur: .18, gain: .08 }],
  error: [{ freq: 310, to: 230, dur: .15, gain: .11, type: "triangle" }, { freq: 250, to: 180, at: .12, dur: .18, gain: .08, type: "triangle" }],
  on: [{ freq: 880, to: 1320, dur: .08, gain: .07 }],
  off: [{ freq: 1100, to: 690, dur: .08, gain: .06 }],
  tick: [{ freq: 1900, dur: .02, gain: .03, type: "square" }]
};

const Sounds = {
  ctx: null,

  play(name, force = false) {
    const settings = Settings.load();
    if ((!settings.sounds && !force) || settings.volume <= 0) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      for (const note of SOUND_SHAPES[name] || []) this.tone(note, settings.volume);
    } catch {}
  },

  tone({ freq, to, at = 0, dur = .12, type = "sine", gain = .1 }, volume) {
    const ctx = this.ctx;
    const start = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
    amp.gain.setValueAtTime(.0001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0002, gain * volume), start + .008);
    amp.gain.exponentialRampToValueAtTime(.0001, start + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + .03);
  }
};
