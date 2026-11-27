import assert from "node:assert/strict";
import test from "node:test";
import { summarizeOpenGymState } from "./sync-opengym.mjs";

const singleSessionWeeks = [
  "2025-12-27",
  "2025-12-28",
  "2026-01-04",
  "2026-01-11",
  "2026-01-18",
];

function stateForDates(dates) {
  return {
    workouts: dates.map((d) => ({
      d,
      entries: [{ sets: [{ done: true, w: 20, r: 10 }] }],
    })),
  };
}

test("counts single-session weeks across Sunday and year boundaries", () => {
  const summary = summarizeOpenGymState(
    stateForDates(singleSessionWeeks),
    "2026-01-19",
  );
  assert.deepEqual(summary.streak, {
    currentWeeks: 5,
    bestWeeks: 5,
    minPerWeek: 1,
  });

  const extraSessions = summarizeOpenGymState(
    stateForDates([...singleSessionWeeks, "2026-01-19", "2026-01-19"]),
    "2026-01-19",
  );
  assert.deepEqual(extraSessions.streak, summary.streak);
});

test("preserves the streak during the current week but not a fully inactive week", () => {
  const state = stateForDates(["2026-01-04", "2026-01-11", "2026-01-18"]);
  const graceWeek = summarizeOpenGymState(state, "2026-01-25");
  assert.deepEqual(graceWeek.streak, {
    currentWeeks: 3,
    bestWeeks: 3,
    minPerWeek: 1,
  });

  const missedWeek = summarizeOpenGymState(state, "2026-02-01");
  assert.deepEqual(missedWeek.streak, {
    currentWeeks: 0,
    bestWeeks: 3,
    minPerWeek: 1,
  });
});

test("restarts after an inactive week without losing the best streak", () => {
  const state = stateForDates([
    "2025-12-21",
    "2025-12-28",
    "2026-01-04",
    "2026-01-18",
  ]);
  state.workouts.push({ d: "2026-01-11", entries: [] });

  const summary = summarizeOpenGymState(state, "2026-01-19");
  assert.deepEqual(summary.streak, {
    currentWeeks: 1,
    bestWeeks: 3,
    minPerWeek: 1,
  });
});

test("invalidates the old sync fingerprint without triggering updates on rest days", () => {
  const state = stateForDates(singleSessionWeeks);
  const oldRuleFingerprint = "sha256:4b7e9ca97d8d03eb";
  const summary = summarizeOpenGymState(state, "2026-01-19");

  assert.notEqual(summary.fingerprint, oldRuleFingerprint);
  assert.equal(
    summary.fingerprint,
    summarizeOpenGymState(state, "2026-01-20").fingerprint,
  );
});
