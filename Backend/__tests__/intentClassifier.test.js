// Unit tests for the offline intent classifier. Run with: `npm test` (node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { IntentClassifier, tokenize, getClassifier } from "../ml/intentClassifier.js";

test("tokenize lowercases and strips punctuation", () => {
  const f = tokenize("Open Google!!");
  assert.ok(f.includes("w:open"));
  assert.ok(f.includes("w:google"));
});

test("tokenize emits word bigrams and char n-grams", () => {
  const f = tokenize("open google");
  assert.ok(f.includes("wb:open_google"), "should contain word bigram");
  assert.ok(f.some((t) => t.startsWith("c:")), "should contain char n-grams");
});

test("classifier predicts a known label with a confidence in [0,1]", () => {
  const clf = getClassifier();
  const { label, confidence, scores } = clf.predict("open instagram");
  assert.equal(label, "instagram-open");
  assert.ok(confidence > 0 && confidence <= 1);
  const sum = Object.values(scores).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, "softmax scores should sum to 1");
});

test("classifier separates open-google from search-on-google", () => {
  const clf = getClassifier();
  assert.equal(clf.predict("open google").label, "google-open");
  assert.equal(clf.predict("search for laptops on google").label, "google-search");
});

test("classifier separates youtube-play from youtube-search", () => {
  const clf = getClassifier();
  assert.equal(clf.predict("play tum hi ho").label, "youtube-play");
  assert.equal(clf.predict("search cooking videos on youtube").label, "youtube-search");
});

test("classifier handles romanized hindi", () => {
  const clf = getClassifier();
  assert.equal(clf.predict("calculator kholo").label, "calculator-open");
});

test("serialization round-trips losslessly", () => {
  const clf = getClassifier();
  const restored = IntentClassifier.fromJSON(JSON.parse(JSON.stringify(clf.toJSON())));
  const a = clf.predict("what time is it");
  const b = restored.predict("what time is it");
  assert.equal(a.label, b.label);
  assert.ok(Math.abs(a.confidence - b.confidence) < 1e-9);
});

test("untrained classifier throws", () => {
  assert.throws(() => new IntentClassifier().predict("hello"));
});
