import assert from 'node:assert/strict';
import { buyItem, interactWithPet, upgradePet, useInventoryItem, applyPetAction } from '../src/core/petActions';
import { advancePet } from '../src/core/petLifecycle';
import { selectGardenSlot } from '../src/core/garden';
import {
  advancePartnerSchedule,
  claimPartnerScheduleResult,
  getPartnerScheduleDefinition,
  getPartnerScheduleProgress,
  getPartnerScheduleSkillXpReward,
  normalizePartnerScheduleState,
  partnerScheduleDefinitions,
  startPartnerSchedule,
} from '../src/core/partnerSchedule';
import { createDefaultPet } from '../src/core/petState';
import { loadStoredPetJson } from '../src/core/saveCodec';
import { startPomodoro } from '../src/core/petActions';
import type { PartnerScheduleState, PetState } from '../src/core/petTypes';

const minuteMs = 60 * 1000;
const now = new Date(2026, 6, 20, 12, 0, 0).getTime();

const createReadyPet = (level: number, createdAt = now - 10 * 24 * 60 * minuteMs) => {
  const pet = createDefaultPet(now);
  return advancePartnerSchedule({
    ...pet,
    level,
    createdAt,
    energy: 100,
    hunger: 100,
    mood: 100,
    cleanliness: 100,
    health: 100,
    lastUpdatedAt: now,
    lastEnergyRecoveryAt: now,
  }, now);
};

const level2 = createReadyPet(2);
assert.equal(level2.partnerSchedule.offers.length, 0, 'Lv2 should remain locked');

const level3 = createReadyPet(3);
assert.equal(level3.partnerSchedule.offers.length, 3, 'Lv3 should receive three offers');
const sameBoard = createReadyPet(3, level3.createdAt);
assert.deepEqual(sameBoard.partnerSchedule.offers, level3.partnerSchedule.offers, 'same-day board should be deterministic');

const level8 = createReadyPet(8);
assert(level8.partnerSchedule.offers.some((offer) => getPartnerScheduleDefinition(offer.templateId)?.size === 'long'), 'Lv8 should receive a long offer');
assert.deepEqual(
  ['short', 'standard', 'long'].map((size) => partnerScheduleDefinitions.find((item) => item.size === size)?.durationMinutes),
  [45, 120, 240],
  'activity durations should use the unified real-time values',
);
assert.deepEqual(
  ['short', 'standard', 'long'].map((size) => getPartnerScheduleSkillXpReward(size as 'short' | 'standard' | 'long')),
  [10, 23, 50],
  'skill XP should use the unified reward values',
);

const offer = level3.partnerSchedule.offers[0];
const definition = getPartnerScheduleDefinition(offer.templateId);
assert(definition, 'offer definition should exist');
const started = startPartnerSchedule(level3, offer.id, now);
assert(started.partnerSchedule.active, 'schedule should start');
assert.equal(started.partnerSchedule.active.endsAt - started.partnerSchedule.active.startedAt, definition.durationMinutes * minuteMs);
assert.equal(started.lastEnergyRecoveryAt, now, 'schedule start should reset the energy recovery baseline');

const startStats = {
  hunger: started.hunger,
  mood: started.mood,
  cleanliness: started.cleanliness,
  health: started.health,
  energy: started.energy,
};
const halfway = advancePet(started, now + 20 * minuteMs);
assert.deepEqual(
  {
    hunger: halfway.hunger,
    mood: halfway.mood,
    cleanliness: halfway.cleanliness,
    health: halfway.health,
    energy: halfway.energy,
  },
  startStats,
  'natural stats and energy recovery should freeze during the schedule',
);
assert.equal(halfway.ageSeconds - started.ageSeconds, 20 * 60, 'age should continue during the schedule');

const pomodoroStarted = startPomodoro(started, now + minuteMs);
const pomodoroAdvanced = advancePet(pomodoroStarted, now + 6 * minuteMs);
assert.equal(
  pomodoroAdvanced.partnerSchedule.active?.endsAt,
  started.partnerSchedule.active.endsAt,
  'Pomodoro progress should not change the schedule end time',
);
assert(pomodoroAdvanced.pomodoro.sessionFocusMs > 0, 'Pomodoro should continue independently');

const blockedAction = applyPetAction(started, 'clean', now + minuteMs);
assert.equal(blockedAction.cleanliness, started.cleanliness, 'cleaning should be blocked in core');
assert(blockedAction.partnerSchedule.active, 'blocked care should not cancel the schedule');
const blockedItem = useInventoryItem(started, 'emergency_biscuit', now + minuteMs);
assert.deepEqual(blockedItem.inventory, started.inventory, 'item use should be blocked in core');
const blockedTouch = interactWithPet(started, now + minuteMs);
assert.equal(blockedTouch.lastPetInteractionAt, started.lastPetInteractionAt, 'pet touch should be blocked in core');
const blockedUpgrade = upgradePet({ ...started, hearts: 999 }, now + minuteMs);
assert.equal(blockedUpgrade.level, started.level, 'pet upgrade should be blocked in core');

const boughtWhileBusy = buyItem(started, 'emergency_biscuit', now + minuteMs);
assert((boughtWhileBusy.inventory.emergency_biscuit ?? 0) > (started.inventory.emergency_biscuit ?? 0), 'shopping should remain available');
const gardenWhileBusy = selectGardenSlot(started, 1, now + minuteMs);
assert.equal(gardenWhileBusy.garden.activeSlotIndex, 1, 'garden actions should remain available');
assert(gardenWhileBusy.partnerSchedule.active);

const completedAt = started.partnerSchedule.active.endsAt;
const completed = advancePet(started, completedAt + 30 * minuteMs);
assert.equal(completed.partnerSchedule.active, undefined, 'expired schedule should stop');
assert(completed.partnerSchedule.pendingResult, 'expired schedule should become claimable');
assert(completed.hunger < started.hunger, 'post-schedule offline time should decay hunger');
assert(completed.hunger > started.hunger - 5, 'only post-schedule offline time should decay hunger');
assert(completed.lastEnergyRecoveryAt >= completedAt, 'energy recovery baseline should resume at schedule end');
const loadedAfterCompletion = loadStoredPetJson(JSON.stringify(started), completedAt + 30 * minuteMs);
assert.equal(loadedAfterCompletion.partnerSchedule.active, undefined);
assert(loadedAfterCompletion.partnerSchedule.pendingResult, 'stored expired activity should become claimable on load');
assert(Math.abs(loadedAfterCompletion.hunger - completed.hunger) < 0.01, 'load should preserve the same frozen activity interval');

const pendingAdvanced = advancePet(completed, completedAt + 60 * minuteMs);
assert(pendingAdvanced.hunger < completed.hunger, 'pending rewards must not freeze natural decay');
const claimed = claimPartnerScheduleResult(completed, 'coins', completedAt + 30 * minuteMs);
const claimedAgain = claimPartnerScheduleResult(claimed, 'coins', completedAt + 30 * minuteMs);
assert.equal(claimedAgain.coins, claimed.coins, 'claiming twice must not duplicate rewards');

const baseSchedule = level3.partnerSchedule;
const legacyCommon = {
  offerId: offer.id,
  templateId: offer.templateId,
  category: definition.category,
  size: definition.size,
  coinReward: 88,
  skillXp: 10,
};
const normalizeLegacy = (active: Record<string, unknown> | undefined, pendingResult?: Record<string, unknown>) =>
  normalizePartnerScheduleState({
    ...baseSchedule,
    schemaVersion: 1,
    active,
    pendingResult,
  }, { level: level3.level, createdAt: level3.createdAt }, now);

const legacyIndependentEnd = now + 18 * minuteMs;
const migratedIndependent = normalizeLegacy({
  ...legacyCommon,
  mode: 'independent',
  startedAt: now - 27 * minuteMs,
  endsAt: legacyIndependentEnd,
  requiredFocusMs: 25 * minuteMs,
  focusProgressMs: 0,
});
assert.equal(migratedIndependent.schemaVersion, 2);
assert.equal(migratedIndependent.active?.endsAt, legacyIndependentEnd, 'v1 independent activity should preserve its end time');

const migratedTogether = normalizeLegacy({
  ...legacyCommon,
  mode: 'together',
  startedAt: now - 10 * minuteMs,
  endsAt: 0,
  requiredFocusMs: 25 * minuteMs,
  focusProgressMs: 12.5 * minuteMs,
});
assert.equal(
  getPartnerScheduleProgress(migratedTogether.active!, now).remainingMs,
  definition.durationMinutes * minuteMs / 2,
  'v1 together activity should convert focus ratio to real-time remaining duration',
);
assert.equal(migratedTogether.active?.coinReward, 88, 'migration should preserve reward snapshots');

const expiredLegacy = normalizeLegacy({
  ...legacyCommon,
  mode: 'independent',
  startedAt: now - 60 * minuteMs,
  endsAt: now - minuteMs,
});
assert.equal(expiredLegacy.active, undefined);
assert(expiredLegacy.pendingResult, 'expired migrated activity should immediately become claimable');

const migratedPending = normalizeLegacy(undefined, {
  ...legacyCommon,
  mode: 'together',
  completedAt: now - minuteMs,
});
assert(migratedPending.pendingResult, 'v1 pending result should be preserved');
assert.equal(migratedPending.pendingResult?.coinReward, 88);

const missingFields = normalizeLegacy({
  offerId: offer.id,
  templateId: offer.templateId,
  mode: 'independent',
  startedAt: now,
});
assert(missingFields.active, 'legacy activity with optional fields missing should still migrate');
assert.equal(missingFields.active?.endsAt, now + definition.durationMinutes * minuteMs);
assert((missingFields.active?.coinReward ?? 0) > 0);

const nextDayBoard = advancePartnerSchedule(level3, now + 24 * 60 * minuteMs);
assert.notEqual(nextDayBoard.partnerSchedule.boardDateKey, level3.partnerSchedule.boardDateKey, 'the board should refresh after the daily boundary');
assert.equal(nextDayBoard.partnerSchedule.offers.length, 3);

const schemaCheck: PartnerScheduleState['schemaVersion'] = 2;
const stateCheck: PetState = { ...level3, partnerSchedule: migratedTogether };
assert.equal(schemaCheck, stateCheck.partnerSchedule.schemaVersion);

console.log('partner schedule core checks passed');
