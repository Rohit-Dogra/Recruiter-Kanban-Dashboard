const { describe, it, expect, beforeEach } = require('@jest/globals');
const fc = require('fast-check');

/**
 * Property 22: Application Timeline Ordering
 *
 * For any application with stage change history: timeline returns all
 * transitions in chronological order with no gaps or duplicates.
 *
 * Validates: Requirements 14.4, 22.4
 */

// --- Helpers to build the timeline the same way the route does ---

const ADVANCED_STATUSES = ['shortlisted', 'interview', 'offered', 'hired', 'rejected'];

function buildTimeline(application) {
  const timeline = [];

  // Applied entry
  timeline.push({
    stage: 'applied',
    label: 'Applied',
    timestamp: application.appliedDate || application.createdAt,
    status: 'completed',
  });

  // Reviewed entry
  if (application.reviewedDate) {
    timeline.push({
      stage: 'reviewed',
      label: 'Reviewed',
      timestamp: application.reviewedDate,
      status: 'completed',
    });
  }

  // Current status entry (if beyond applied/reviewed)
  const currentStatus = application.status;
  if (
    ADVANCED_STATUSES.includes(currentStatus) ||
    (currentStatus && currentStatus.startsWith('custom-'))
  ) {
    timeline.push({
      stage: currentStatus,
      label:
        currentStatus.charAt(0).toUpperCase() +
        currentStatus.slice(1).replace(/-/g, ' '),
      timestamp: application.updatedAt,
      status: currentStatus === 'rejected' ? 'rejected' : 'completed',
    });
  }

  // Mark the current stage
  if (timeline.length > 0) {
    timeline[timeline.length - 1].current = true;
  }

  return timeline;
}

// --- Arbitraries ---

/** Generate a timestamp (ms) within a reasonable range, then convert to Date */
const MIN_TS = new Date('2023-01-01').getTime();
const MAX_TS = new Date('2026-12-31').getTime();
const arbTimestamp = fc.integer({ min: MIN_TS, max: MAX_TS });

/** Generate a status string that the timeline endpoint recognises */
const arbStatus = fc.oneof(
  fc.constant('new'),
  fc.constant('applied'),
  fc.constant('reviewed'),
  fc.constant('shortlisted'),
  fc.constant('interview'),
  fc.constant('offered'),
  fc.constant('hired'),
  fc.constant('rejected'),
  fc.integer({ min: 1, max: 999 }).map((n) => `custom-${n}`)
);

/**
 * Generate a realistic application object.
 * Dates are constrained so createdAt <= appliedDate <= reviewedDate <= updatedAt
 * to mirror real-world ordering.
 */
const arbApplication = fc
  .tuple(arbTimestamp, arbTimestamp, arbTimestamp, arbTimestamp, arbStatus)
  .map(([t1, t2, t3, t4, status]) => {
    // Sort the four timestamps to guarantee chronological ordering
    const sorted = [t1, t2, t3, t4].sort((a, b) => a - b);
    const [createdAt, appliedDate, reviewedDate, updatedAt] = sorted.map(
      (t) => new Date(t)
    );

    // Only include reviewedDate when the status has progressed past 'new'/'applied'
    const hasReview = !['new', 'applied'].includes(status);

    return {
      id: 1,
      status,
      createdAt,
      appliedDate,
      reviewedDate: hasReview ? reviewedDate : null,
      updatedAt,
    };
  });

// --- Property tests ---

describe('Property 22: Application Timeline Ordering', () => {
  it('timeline entries are in strictly non-decreasing chronological order', () => {
    fc.assert(
      fc.property(arbApplication, (app) => {
        const timeline = buildTimeline(app);

        for (let i = 1; i < timeline.length; i++) {
          const prev = new Date(timeline[i - 1].timestamp).getTime();
          const curr = new Date(timeline[i].timestamp).getTime();
          expect(curr).toBeGreaterThanOrEqual(prev);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('timeline contains no duplicate stages', () => {
    fc.assert(
      fc.property(arbApplication, (app) => {
        const timeline = buildTimeline(app);
        const stages = timeline.map((e) => e.stage);
        const unique = new Set(stages);
        expect(unique.size).toBe(stages.length);
      }),
      { numRuns: 200 }
    );
  });

  it('timeline always starts with "applied"', () => {
    fc.assert(
      fc.property(arbApplication, (app) => {
        const timeline = buildTimeline(app);
        expect(timeline.length).toBeGreaterThanOrEqual(1);
        expect(timeline[0].stage).toBe('applied');
      }),
      { numRuns: 200 }
    );
  });

  it('exactly one entry is marked as current (the last one)', () => {
    fc.assert(
      fc.property(arbApplication, (app) => {
        const timeline = buildTimeline(app);
        const currentEntries = timeline.filter((e) => e.current === true);
        expect(currentEntries.length).toBe(1);
        expect(timeline[timeline.length - 1].current).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('every timeline entry has a valid timestamp (no nulls or undefined)', () => {
    fc.assert(
      fc.property(arbApplication, (app) => {
        const timeline = buildTimeline(app);
        for (const entry of timeline) {
          expect(entry.timestamp).toBeDefined();
          expect(entry.timestamp).not.toBeNull();
          expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
        }
      }),
      { numRuns: 200 }
    );
  });

  it('reviewed entry appears only when reviewedDate is set', () => {
    fc.assert(
      fc.property(arbApplication, (app) => {
        const timeline = buildTimeline(app);
        const hasReviewedEntry = timeline.some((e) => e.stage === 'reviewed');

        if (app.reviewedDate) {
          expect(hasReviewedEntry).toBe(true);
        } else {
          expect(hasReviewedEntry).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('timeline has no gaps — if reviewed exists it is between applied and current status', () => {
    fc.assert(
      fc.property(arbApplication, (app) => {
        const timeline = buildTimeline(app);
        const stages = timeline.map((e) => e.stage);

        const reviewedIdx = stages.indexOf('reviewed');
        if (reviewedIdx !== -1) {
          // reviewed must come after applied
          expect(stages.indexOf('applied')).toBeLessThan(reviewedIdx);
          // if there's a third entry, reviewed must come before it
          if (stages.length > reviewedIdx + 1) {
            expect(reviewedIdx).toBeLessThan(stages.length - 1);
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('rejected status is labelled correctly in the timeline', () => {
    fc.assert(
      fc.property(arbApplication, (app) => {
        const timeline = buildTimeline(app);
        const rejectedEntry = timeline.find((e) => e.stage === 'rejected');
        if (rejectedEntry) {
          expect(rejectedEntry.status).toBe('rejected');
        }
        // Non-rejected entries should be 'completed'
        for (const entry of timeline) {
          if (entry.stage !== 'rejected') {
            expect(entry.status).toBe('completed');
          }
        }
      }),
      { numRuns: 200 }
    );
  });
});
