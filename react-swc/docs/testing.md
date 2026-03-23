# Testing Guide

## Manual Vs Automated

Use both.

- manual playtesting is best for full battle flow, feel, UI sanity, and animation timing
- automated tests are best for catching regressions in logic and component behavior

You should still play the game after major changes. The tests are there so the same bug does not quietly come back later.

## Good First Tests

Start with small tests you can trust:

- `HandCardView` selected styling follows `cardInstanceId`
- `HandCardView` disables play when energy is too low
- `Deck.drawCard()` moves one exact instance
- `Deck.discardFromHand(instanceId)` discards the correct duplicate
- `GameManager.playCard(targets, cardInstanceId)` removes the right card

## How To Run

From `react-swc/`:

```bash
npm run test
```

Run once:

```bash
npm run test:run
```

## Where Tests Live

You do not need a page dedicated to unit tests.

Recommended structure:

- component tests next to the component, like `HandCardView.test.jsx`
- shared setup in `src/test/setupTests.js`
- future engine logic tests in `src/engine/__tests__/` or `src/Objects/__tests__/`

## Suggested Next Tests

After the starter component test, add tests for:

- `Deck.gainCard`
- `Deck.drawCard`
- `Deck.discardFromHand`
- `Player.refreshSelected`
- `GameManager.playCard`
