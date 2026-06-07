// Offline intent classifier — Multinomial Naive Bayes with Laplace smoothing.
// Pure Node.js, zero runtime dependencies. Trains from intents.dataset.json and
// exposes predict(text) -> { label, confidence, scores }. Used as a fast, private,
// network-free first stage in front of the LLM (see user.controller.js).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Feature extractor: combines three views of the utterance.
//   1. word unigrams + bigrams  — capture phrasing ("open google", "on youtube")
//   2. character n-grams (3,4)   — robust to romanized-Hindi morphology
//      (kholo / khol / kholna) and ASR spelling drift, where word features alone
//      are too sparse on a small bilingual corpus.
// Returns the full feature token list (with repeats; counts matter for NB).
export function tokenize(text) {
  const clean = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = clean.split(/\s+/).filter(Boolean);

  const feats = [];
  // Word unigrams + bigrams.
  for (const w of words) feats.push("w:" + w);
  for (let i = 0; i < words.length - 1; i++) feats.push("wb:" + words[i] + "_" + words[i + 1]);

  // Character n-grams (3 and 4) over each word, padded to mark word edges.
  for (const w of words) {
    const padded = "#" + w + "#";
    for (let n = 3; n <= 4; n++) {
      for (let i = 0; i + n <= padded.length; i++) {
        feats.push("c:" + padded.slice(i, i + n));
      }
    }
  }
  return feats;
}

export class IntentClassifier {
  constructor() {
    this.classCounts = new Map();   // label -> doc count
    this.tokenCounts = new Map();   // label -> Map(token -> count)
    this.classTokenTotals = new Map(); // label -> total tokens in class
    this.vocab = new Set();
    this.totalDocs = 0;
    this.trained = false;
  }

  train(samples) {
    for (const { text, label } of samples) {
      this.totalDocs += 1;
      this.classCounts.set(label, (this.classCounts.get(label) || 0) + 1);
      if (!this.tokenCounts.has(label)) this.tokenCounts.set(label, new Map());
      const tc = this.tokenCounts.get(label);
      let classTotal = this.classTokenTotals.get(label) || 0;
      for (const tok of tokenize(text)) {
        tc.set(tok, (tc.get(tok) || 0) + 1);
        this.vocab.add(tok);
        classTotal += 1;
      }
      this.classTokenTotals.set(label, classTotal);
    }
    this.trained = true;
    return this;
  }

  // Returns { label, confidence, scores } where scores is a softmax over
  // log-probabilities so confidence is a usable [0,1] gating signal.
  predict(text) {
    if (!this.trained) throw new Error("IntentClassifier not trained");
    const tokens = tokenize(text);
    const V = this.vocab.size;
    const logScores = new Map();

    for (const [label, docCount] of this.classCounts) {
      let logProb = Math.log(docCount / this.totalDocs); // log prior
      const tc = this.tokenCounts.get(label);
      const classTotal = this.classTokenTotals.get(label);
      for (const tok of tokens) {
        const count = tc.get(tok) || 0;
        // Laplace (add-one) smoothing
        logProb += Math.log((count + 1) / (classTotal + V));
      }
      logScores.set(label, logProb);
    }

    // Softmax over log-scores for a normalized confidence.
    const maxLog = Math.max(...logScores.values());
    let denom = 0;
    const exp = new Map();
    for (const [label, lp] of logScores) {
      const e = Math.exp(lp - maxLog);
      exp.set(label, e);
      denom += e;
    }
    const scores = {};
    let best = null;
    let bestP = -1;
    for (const [label, e] of exp) {
      const p = e / denom;
      scores[label] = p;
      if (p > bestP) { bestP = p; best = label; }
    }
    return { label: best, confidence: bestP, scores };
  }

  toJSON() {
    return {
      classCounts: [...this.classCounts],
      tokenCounts: [...this.tokenCounts].map(([l, m]) => [l, [...m]]),
      classTokenTotals: [...this.classTokenTotals],
      vocab: [...this.vocab],
      totalDocs: this.totalDocs,
    };
  }

  static fromJSON(obj) {
    const c = new IntentClassifier();
    c.classCounts = new Map(obj.classCounts);
    c.tokenCounts = new Map(obj.tokenCounts.map(([l, m]) => [l, new Map(m)]));
    c.classTokenTotals = new Map(obj.classTokenTotals);
    c.vocab = new Set(obj.vocab);
    c.totalDocs = obj.totalDocs;
    c.trained = true;
    return c;
  }
}

// Convenience: build a classifier from the bundled dataset.
export function loadDataset() {
  const raw = fs.readFileSync(path.join(__dirname, "intents.dataset.json"), "utf-8");
  return JSON.parse(raw).samples;
}

let _singleton = null;
// Lazily-trained process-wide singleton for use by the request path.
export function getClassifier() {
  if (!_singleton) {
    _singleton = new IntentClassifier().train(loadDataset());
  }
  return _singleton;
}

export default IntentClassifier;
