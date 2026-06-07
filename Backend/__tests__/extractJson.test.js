import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJson, isValidAssistantResponse } from "../utils/extractJson.js";

test("extracts a plain JSON object", () => {
  const obj = extractJson('{"type":"general","response":"hi"}');
  assert.equal(obj.type, "general");
});

test("extracts JSON wrapped in prose", () => {
  const obj = extractJson('Sure! {"type":"get-time","userInput":"x","response":"now"} done');
  assert.equal(obj.type, "get-time");
});

test("extracts JSON from a code fence", () => {
  const obj = extractJson('```json\n{"type":"general","response":"ok"}\n```');
  assert.equal(obj.response, "ok");
});

test("handles braces inside string values", () => {
  const obj = extractJson('{"type":"general","response":"use {curly} braces"}');
  assert.equal(obj.response, "use {curly} braces");
});

test("returns null on malformed JSON instead of throwing", () => {
  assert.equal(extractJson("{not valid json"), null);
  assert.equal(extractJson("no json here"), null);
  assert.equal(extractJson(undefined), null);
});

test("validates response shape and rejects unknown intents", () => {
  assert.ok(isValidAssistantResponse({ type: "general", response: "x" }));
  assert.ok(!isValidAssistantResponse({ type: "rm-rf", response: "x" }));
  assert.ok(!isValidAssistantResponse({ type: "general" }));
  assert.ok(!isValidAssistantResponse(null));
});
