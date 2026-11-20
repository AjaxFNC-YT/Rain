const ACCURACY_MODES = [
  ["off", "Always right"],
  ["chance", "Chance"],
  ["target", "Target score"]
];

const Accuracy = {
  load() {
    return { total: 0, wrong: 0, lastMissed: false, ...Store.get("accuracy", {}) };
  },

  decide(settings = Settings.load()) {
    const record = this.load();
    if (settings.accuracyMode === "chance") {
      if (record.lastMissed) return false;
      return Math.random() * 100 < settings.missChance;
    }
    if (settings.accuracyMode === "target") {
      const allowed = (record.total + 1) * (1 - settings.targetScore / 100);
      return record.wrong + 1 <= allowed + (Math.random() - .5) * .8;
    }
    return false;
  },

  record(missed) {
    const record = this.load();
    record.total += 1;
    if (missed) record.wrong += 1;
    record.lastMissed = missed;
    Store.set("accuracy", record);
    return record;
  },

  score(record = this.load()) {
    return record.total ? Math.round((record.total - record.wrong) / record.total * 100) : null;
  },

  reset() {
    Store.set("accuracy", {});
  }
};
