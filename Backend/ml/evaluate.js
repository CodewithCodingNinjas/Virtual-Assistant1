// Evaluation harness for the intent classifier.
// Performs a deterministic stratified train/test split, trains on the train fold,
// and reports accuracy, per-class precision/recall/F1, macro averages, and a
// confusion matrix. Run: `node ml/evaluate.js`.

import path from "path";
import { IntentClassifier, loadDataset } from "./intentClassifier.js";

// Deterministic seeded shuffle (mulberry32) so reported metrics are reproducible.
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Stratified split: hold out ~testFrac of each label for the test fold.
function stratifiedSplit(samples, testFrac, seed) {
  const byLabel = new Map();
  for (const s of samples) {
    if (!byLabel.has(s.label)) byLabel.set(s.label, []);
    byLabel.get(s.label).push(s);
  }
  const train = [];
  const test = [];
  for (const [label, items] of byLabel) {
    const shuffled = seededShuffle(items, seed + label.length);
    const nTest = Math.max(1, Math.round(items.length * testFrac));
    test.push(...shuffled.slice(0, nTest));
    train.push(...shuffled.slice(nTest));
  }
  return { train, test };
}

export function evaluate({ testFrac = 0.3, seed = 42 } = {}) {
  const samples = loadDataset();
  const { train, test } = stratifiedSplit(samples, testFrac, seed);
  const clf = new IntentClassifier().train(train);

  const labels = [...new Set(samples.map((s) => s.label))].sort();
  const idx = new Map(labels.map((l, i) => [l, i]));
  const confusion = labels.map(() => labels.map(() => 0));

  let correct = 0;
  for (const { text, label } of test) {
    const { label: pred } = clf.predict(text);
    confusion[idx.get(label)][idx.get(pred)] += 1;
    if (pred === label) correct += 1;
  }
  const accuracy = correct / test.length;

  // Per-class precision / recall / F1 from the confusion matrix.
  const perClass = {};
  let macroP = 0, macroR = 0, macroF1 = 0;
  for (const label of labels) {
    const i = idx.get(label);
    const tp = confusion[i][i];
    let fp = 0, fn = 0;
    for (let k = 0; k < labels.length; k++) {
      if (k !== i) { fp += confusion[k][i]; fn += confusion[i][k]; }
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    perClass[label] = { precision, recall, f1, support: tp + fn };
    macroP += precision; macroR += recall; macroF1 += f1;
  }
  macroP /= labels.length; macroR /= labels.length; macroF1 /= labels.length;

  return {
    trainSize: train.length,
    testSize: test.length,
    accuracy,
    macro: { precision: macroP, recall: macroR, f1: macroF1 },
    perClass,
    labels,
    confusion,
  };
}

// Stratified k-fold cross-validation: every sample is tested exactly once across
// folds. This is the headline metric — far more stable than one arbitrary split.
export function crossValidate({ k = 5, seed = 42 } = {}) {
  const samples = loadDataset();
  const byLabel = new Map();
  for (const s of samples) {
    if (!byLabel.has(s.label)) byLabel.set(s.label, []);
    byLabel.get(s.label).push(s);
  }
  // Assign each label's samples round-robin into k folds (stratified).
  const folds = Array.from({ length: k }, () => []);
  for (const [label, items] of byLabel) {
    const shuffled = seededShuffle(items, seed + label.length);
    shuffled.forEach((s, i) => folds[i % k].push(s));
  }

  const labels = [...new Set(samples.map((s) => s.label))].sort();
  const idx = new Map(labels.map((l, i) => [l, i]));
  const confusion = labels.map(() => labels.map(() => 0));
  const accPerFold = [];

  for (let f = 0; f < k; f++) {
    const test = folds[f];
    const train = folds.filter((_, i) => i !== f).flat();
    const clf = new IntentClassifier().train(train);
    let correct = 0;
    for (const { text, label } of test) {
      const { label: pred } = clf.predict(text);
      confusion[idx.get(label)][idx.get(pred)] += 1;
      if (pred === label) correct += 1;
    }
    accPerFold.push(correct / test.length);
  }

  const total = confusion.flat().reduce((a, b) => a + b, 0);
  const accuracy = labels.reduce((acc, l) => acc + confusion[idx.get(l)][idx.get(l)], 0) / total;

  let macroP = 0, macroR = 0, macroF1 = 0;
  const perClass = {};
  for (const label of labels) {
    const i = idx.get(label);
    const tp = confusion[i][i];
    let fp = 0, fn = 0;
    for (let kk = 0; kk < labels.length; kk++) {
      if (kk !== i) { fp += confusion[kk][i]; fn += confusion[i][kk]; }
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    perClass[label] = { precision, recall, f1, support: tp + fn };
    macroP += precision; macroR += recall; macroF1 += f1;
  }
  macroP /= labels.length; macroR /= labels.length; macroF1 /= labels.length;

  const mean = accPerFold.reduce((a, b) => a + b, 0) / k;
  const std = Math.sqrt(accPerFold.reduce((a, b) => a + (b - mean) ** 2, 0) / k);

  return { k, accuracy, accPerFold, accStd: std, macro: { precision: macroP, recall: macroR, f1: macroF1 }, perClass, labels, confusion };
}

// Median single-prediction latency over the full dataset, in milliseconds.
export function benchmarkLatency() {
  const samples = loadDataset();
  const clf = new IntentClassifier().train(samples);
  const times = [];
  for (const { text } of samples) {
    const t0 = process.hrtime.bigint();
    clf.predict(text);
    const t1 = process.hrtime.bigint();
    times.push(Number(t1 - t0) / 1e6);
  }
  times.sort((a, b) => a - b);
  return { median: times[Math.floor(times.length / 2)], p95: times[Math.floor(times.length * 0.95)] };
}

// CLI entry point (cross-platform: compares resolved file paths, not URL strings).
import { fileURLToPath as _f2u } from "url";
const _invokedDirectly = process.argv[1] && _f2u(import.meta.url) === path.resolve(process.argv[1]);
if (_invokedDirectly) {
  const pct = (x) => (x * 100).toFixed(1) + "%";
  const cv = crossValidate({ k: 5 });
  console.log("\n=== Intent Classifier — 5-Fold Stratified Cross-Validation (seed=42) ===");
  console.log(`Total samples: ${cv.confusion.flat().reduce((a, b) => a + b, 0)}   Classes: ${cv.labels.length}`);
  console.log(`\nCV accuracy:       ${pct(cv.accuracy)}  (per-fold std ${pct(cv.accStd)})`);
  console.log(`Macro precision:   ${pct(cv.macro.precision)}`);
  console.log(`Macro recall:      ${pct(cv.macro.recall)}`);
  console.log(`Macro F1:          ${pct(cv.macro.f1)}`);
  console.log(`Per-fold accuracy: [${cv.accPerFold.map((a) => pct(a)).join(", ")}]`);
  const lat = benchmarkLatency();
  console.log(`\nInference latency: median ${lat.median.toFixed(3)} ms, p95 ${lat.p95.toFixed(3)} ms`);
  console.log("\nPer-class metrics (aggregated over folds):");
  for (const label of cv.labels) {
    const c = cv.perClass[label];
    console.log(`  ${label.padEnd(16)} P=${pct(c.precision).padStart(6)} R=${pct(c.recall).padStart(6)} F1=${pct(c.f1).padStart(6)} (n=${c.support})`);
  }
}
