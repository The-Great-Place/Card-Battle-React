# Card Engine Design

## Purpose

This document defines a scalable card engine architecture for this project.

The goal is to support:

- object-oriented runtime entities and cards
- data-driven card, enemy, status, summon, and environment definitions
- temporary and permanent card modifications
- advanced target selection
- triggered statuses and event-driven effects
- multi-step UI interactions such as discard, upgrade, transform, and choose
- future expansion without turning the engine into a god object

This document is intended to be the common ground for future refactors, implementations, and new chat sessions.

## Design Goals

The engine should:

- keep runtime gameplay state explicit and inspectable
- separate immutable content definitions from mutable runtime instances
- allow most content to be authored in JSON
- support weird cards without requiring one-off hacks in JSX
- keep UI code thin and driven by legal actions and pending interactions
- support permanent run-level changes and temporary combat-level changes
- remain friendly to object-oriented design

## Non-Goals

This design does not try to:

- make JSON a full programming language
- force every possible mechanic into a single generic effect format
- eliminate all custom engine-side logic for exotic cards

The engine should be data-driven first, not data-only at all costs.

## Current Pain Points

The current implementation already has a strong prototype foundation, but it is hard to scale because:

- state ownership is split between a screen store, a battle store, MobX objects, and local React state
- `GameManager` owns too many responsibilities
- targeting rules are too simple for future mechanics
- card behavior is only partially data-driven
- statuses are stored as a loose object bag instead of first-class runtime instances
- card instances do not exist yet, which blocks upgrades, enchantments, charges, and card-specific temporary effects
- UI interaction flow is hardcoded around "select targets then click play"

## High-Level Architecture

The recommended architecture is:

1. Definitions Layer
2. Runtime State Layer
3. Command Layer
4. Rules / Resolution Layer
5. Query / Interaction Layer

### Definitions Layer

Immutable content loaded from JSON or engine-authored registries.

Examples:

- `CardDefinition`
- `StatusDefinition`
- `EnemyDefinition`
- `EnvironmentDefinition`
- `ModifierDefinition`
- `SummonDefinition`
- `LevelDefinition`

### Runtime State Layer

Mutable object instances representing the current run and battle.

Examples:

- `RunState`
- `BattleState`
- `Entity`
- `Player`
- `Enemy`
- `Ally`
- `DeckInstance`
- `CardInstance`
- `StatusInstance`
- `EnvironmentInstance`
- `PendingInteraction`

### Command Layer

Explicit actions issued by the UI or the engine.

Examples:

- `PLAY_CARD`
- `END_TURN`
- `SELECT_ENTITIES`
- `SELECT_CARDS`
- `CONFIRM_INTERACTION`
- `CANCEL_INTERACTION`
- `CHOOSE_REWARD`
- `BUY_CARD`

### Rules / Resolution Layer

Resolves commands into gameplay outcomes.

Examples:

- validate a play request
- compute legal targets
- apply damage
- emit events
- resolve triggered statuses
- resolve modifiers and replacement effects

### Query / Interaction Layer

Produces UI-ready read models from game state.

Examples:

- which cards are playable now
- which entities are valid targets for the selected card
- whether the current interaction action label is `Play`, `Discard`, `Upgrade`, or `Choose`
- whether a card click should begin an interaction or directly resolve

## Recommended Ownership Split

The current `GameManager` should be replaced by smaller responsibilities.

Recommended split:

- `GameState`
  - owns runtime state only
- `BattleEngine`
  - owns command dispatch and mutation orchestration
- `RulesEngine`
  - owns effect resolution, modifier resolution, event emission, and trigger execution
- `InteractionController`
  - owns pending UI interactions and multi-step card flows
- `DefinitionRegistry`
  - owns loaded card, status, enemy, summon, and environment definitions

`GameState` should not expose ad hoc mutation methods directly to JSX.

JSX should talk to an engine facade such as:

```ts
engine.dispatch({ type: "PLAY_CARD", cardInstanceId, targetIds })
engine.dispatch({ type: "END_TURN" })
engine.dispatch({ type: "SELECT_CARDS", interactionId, cardIds })
```

This keeps runtime state readable and engine behavior centralized.

## Core Runtime Types

The following interfaces are conceptual. Final implementation may be plain JS classes with runtime validation rather than TypeScript interfaces.

### DefinitionRegistry

```ts
interface DefinitionRegistry {
  cards: Record<string, CardDefinition>
  statuses: Record<string, StatusDefinition>
  enemies: Record<string, EnemyDefinition>
  summons: Record<string, SummonDefinition>
  environments: Record<string, EnvironmentDefinition>
  modifiers: Record<string, ModifierDefinition>
  levels: Record<string, LevelDefinition>
}
```

### GameState

Top-level runtime state for an ongoing run.

```ts
interface GameState {
  run: RunState
  battle: BattleState | null
  ui: UIState
}
```

### RunState

Persists across battles in a run.

```ts
interface RunState {
  runId: string
  chapterId: string
  currentLevelId: string | null
  gold: number
  player: Player
  unlocks: Record<string, boolean>
  flags: Record<string, unknown>
  completedLevels: string[]
  activeGlobalModifiers: ModifierInstance[]
}
```

### BattleState

Only exists during a combat.

```ts
interface BattleState {
  battleId: string
  turn: number
  activeSide: "player" | "enemy"
  phase: "idle" | "resolving" | "awaiting_input" | "victory" | "defeat"
  waveIndex: number
  environment: EnvironmentInstance | null
  entities: Record<string, Entity>
  order: string[]
  eventLog: GameEvent[]
  pendingInteraction: PendingInteraction | null
  battleModifiers: ModifierInstance[]
  rewardState: RewardState | null
}
```

### Entity

Shared runtime base class for player, enemies, allies, summons, and future units.

```ts
interface Entity {
  id: string
  kind: "player" | "enemy" | "ally" | "summon"
  ownerSide: "player" | "enemy"
  definitionId?: string
  name: string
  image?: string
  alive: boolean

  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
  shield: number

  tags: string[]
  stats: Record<string, number>
  resources: Record<string, number>
  state: Record<string, unknown>

  statuses: StatusInstance[]
  modifiers: ModifierInstance[]
  zones?: ZoneCollection
}
```

### Player

```ts
interface Player extends Entity {
  deck: DeckInstance
  relics: ModifierInstance[]
}
```

### Enemy

```ts
interface Enemy extends Entity {
  intentState: IntentState
  aiState: Record<string, unknown>
}
```

### DeckInstance

```ts
interface DeckInstance {
  ownerId: string
  drawPile: string[]
  hand: string[]
  discardPile: string[]
  exhaustPile: string[]
  banishedPile: string[]
  cards: Record<string, CardInstance>
}
```

Recommendation:

- piles should hold `cardInstanceId`s, not raw card objects
- actual card data should live in `cards`

### CardInstance

`CardInstance` is required for upgrades, enchantments, temporary effects, charges, retain, created cards, stolen cards, and deck persistence.

```ts
interface CardInstance {
  instanceId: string
  definitionId: string
  ownerId: string

  zone: "draw" | "hand" | "discard" | "exhaust" | "banished" | "limbo"
  visibility: "public" | "hidden"

  createdAt: "deck_start" | "battle" | "level" | "event" | "enemy_steal"
  lifetime: "run" | "level" | "battle" | "one_shot"

  baseOverrides: {
    cost?: number
    exhaustOnUse?: boolean
    retainAtEndOfTurn?: boolean
    startsInOpeningHand?: boolean
    charges?: ChargePool[]
  }

  permanentModifiers: ModifierInstance[]
  levelModifiers: ModifierInstance[]
  battleModifiers: ModifierInstance[]
  ephemeralModifiers: ModifierInstance[]

  tags: string[]
  state: Record<string, unknown>
}
```

### ChargePool

Charges need scope because some should refresh each battle, some each level, and some never.

```ts
interface ChargePool {
  id: string
  current: number
  max: number
  refresh: "never" | "battle" | "level"
  onEmpty: "exhaust_card" | "banish_card" | "disable_card"
}
```

### StatusInstance

Statuses should be runtime objects, not entries in a generic stack bag.

```ts
interface StatusInstance {
  instanceId: string
  definitionId: string
  ownerId: string
  sourceEntityId?: string
  sourceCardInstanceId?: string

  stacks?: number
  duration?: number
  amount?: number

  state: Record<string, unknown>
  modifiers: ModifierInstance[]
}
```

### ModifierInstance

Modifiers can exist on cards, entities, statuses, the battle, or the environment.

```ts
interface ModifierInstance {
  instanceId: string
  definitionId?: string
  kind: string
  scope: "card" | "entity" | "team" | "battle" | "environment" | "run"
  sourceEntityId?: string
  sourceCardInstanceId?: string
  sourceStatusInstanceId?: string

  duration?: number
  remainingUses?: number
  amount?: number
  tags?: string[]
  state: Record<string, unknown>
}
```

### PendingInteraction

This is required for cards that change what happens when the player clicks next.

Examples:

- discard cards
- upgrade a card
- transform a card
- select targets
- choose one of several options

```ts
interface PendingInteraction {
  id: string
  type: "select_entities" | "select_cards" | "select_option"
  source: {
    kind: "card" | "status" | "system"
    id: string
  }
  actionLabel: string
  minSelections: number
  maxSelections: number
  validEntityIds?: string[]
  validCardInstanceIds?: string[]
  options?: { id: string; label: string }[]
  payload: Record<string, unknown>
}
```

## Definitions Model

Definitions should be immutable content data.

### CardDefinition

```ts
interface CardDefinition {
  id: string
  name: string
  image?: string
  rarity: string
  cost: number
  description: string
  tags: string[]

  targeting: TargetingRule
  playRequirements?: Requirement[]
  effects: EffectDefinition[]

  keywords?: string[]
  aiHints?: Record<string, unknown>
}
```

### StatusDefinition

```ts
interface StatusDefinition {
  id: string
  name: string
  icon?: string
  stacking?: "duration" | "amount" | "separate_instances" | "replace"
  triggers: TriggerDefinition[]
  grantedModifiers?: ModifierDefinition[]
  removalRules?: ConditionDefinition[]
}
```

### EnemyDefinition

```ts
interface EnemyDefinition {
  id: string
  name: string
  image?: string
  baseStats: Record<string, number>
  deck?: EnemyDeckDefinition
  intentModel: IntentModelDefinition
  startingStatuses?: AppliedStatusDefinition[]
  tags?: string[]
}
```

### EnvironmentDefinition

```ts
interface EnvironmentDefinition {
  id: string
  name: string
  description?: string
  triggers?: TriggerDefinition[]
  modifiers?: ModifierDefinition[]
}
```

## Commands

Commands are the only sanctioned way for the UI to request game changes.

Recommended initial command set:

- `START_BATTLE`
- `PLAY_CARD`
- `END_TURN`
- `SELECT_ENTITIES`
- `SELECT_CARDS`
- `SELECT_OPTION`
- `CONFIRM_INTERACTION`
- `CANCEL_INTERACTION`
- `CLAIM_REWARD`
- `SKIP_REWARD`
- `BUY_CARD`

Example:

```ts
type GameCommand =
  | { type: "PLAY_CARD"; cardInstanceId: string; targetIds?: string[] }
  | { type: "END_TURN" }
  | { type: "CONFIRM_INTERACTION"; interactionId: string; selectionIds: string[] }
```

Benefits:

- easier testing
- explicit behavior
- replay and save/load become easier
- UI remains thin

## Events

Events are emitted by the engine during resolution.

Events are used by:

- statuses
- modifiers
- relics / enchantments
- summons
- environment effects
- logging and debugging

Recommended initial event list:

- `battle_started`
- `turn_started`
- `turn_ended`
- `card_play_started`
- `card_played`
- `card_resolved`
- `card_moved`
- `card_drawn`
- `card_discarded`
- `card_exhausted`
- `card_created`
- `damage_dealt`
- `damage_taken`
- `healing_received`
- `shield_gained`
- `shield_lost`
- `entity_spawned`
- `entity_died`
- `status_applied`
- `status_removed`
- `charges_spent`
- `reward_granted`

Example:

```ts
interface GameEvent {
  id: string
  type: string
  sourceEntityId?: string
  sourceCardInstanceId?: string
  targetEntityId?: string
  payload: Record<string, unknown>
}
```

## Important Distinction: Events vs Calculation Hooks

Events alone are not enough.

Some mechanics react after something happens:

- lifesteal after damage
- looting after a kill
- "when damaged, gain shield"

Other mechanics must modify a calculation before it resolves:

- next card costs 1 less
- Strike cards deal half damage in this environment
- multicast
- multiselect
- extra charges
- forbidden or invalid plays

Therefore the engine needs both:

- post/pre event triggers
- calculation and permission hooks

Recommended hook families:

- `canPlayCard`
- `getCardCost`
- `getLegalTargets`
- `modifyDamage`
- `modifyShieldGain`
- `modifyStatusApplication`
- `modifyCardEffects`
- `onEvent`

## Targeting System

The current `targets: 0/1` model should be replaced by a full targeting rule.

### TargetingRule

```ts
interface TargetingRule {
  selector:
    | "self"
    | "ally"
    | "enemy"
    | "all_allies"
    | "all_enemies"
    | "all_entities"
    | "random_ally"
    | "random_allies"
    | "random_enemy"
    | "random_enemies"
    | "cards_in_hand"
    | "cards_in_draw"
    | "cards_in_discard"
    | "cards_matching_query"
  count?: number
  min?: number
  max?: number
  required?: boolean
  filters?: ConditionDefinition[]
}
```

Examples:

- basic shield: selector `self`
- magic shield: selector `ally`, filters allow enemy if upgraded version says so
- fireball all enemies: selector `all_enemies`
- infest: selector `enemy`, but `playRequirements` or a card interaction may make the next step card-based

Legal targets should be computed by engine queries, not by JSX heuristics.

## Card Modifiers

Modifiers are necessary for your planned mechanics.

Examples from your list:

- lifesteal
- looting
- thorn shield
- frozen guard
- cost reduction
- multicast
- multiselect
- extra charges
- attack bonus this turn
- permanent enchantments
- upgrades

### Modifier Scopes

Modifiers should exist at different scopes:

- `card`
- `entity`
- `team`
- `battle`
- `environment`
- `run`

Examples:

- "Make a random card play twice next time" -> one card-scoped modifier
- "Your next card costs 1 less" -> entity-scoped modifier with `remainingUses: 1`
- "All attack cards deal +1 damage this turn" -> entity or battle modifier filtered by card tag
- "Strike cards deal half damage here" -> environment modifier

### Modifier Lifetimes

Modifiers should support:

- permanent for the run
- persistent for the level
- battle only
- until card is played
- until turn end
- until status expires

### Modifier Example

```json
{
  "id": "next_card_cost_less",
  "kind": "cost_adjustment",
  "scope": "entity",
  "amount": -1,
  "remainingUses": 1
}
```

## Status System

Statuses should be first-class runtime instances with:

- duration
- amount
- internal state
- event triggers
- granted modifiers

This supports:

- burn
- freeze
- regeneration
- gain energy at the start of the next n turns
- delayed kill checks
- counters and watchers

### Example: Energy Boost

Card definition:

```json
{
  "id": "energy_boost",
  "cost": 1,
  "tags": ["skill"],
  "targeting": { "selector": "self", "required": true },
  "effects": [
    {
      "type": "apply_status",
      "statusId": "energy_boost",
      "duration": 2,
      "amount": 2
    }
  ]
}
```

Status definition:

```json
{
  "id": "energy_boost",
  "name": "Energy Boost",
  "triggers": [
    {
      "event": "turn_started",
      "conditions": [
        { "check": "owner_is_active_player" }
      ],
      "effects": [
        { "type": "gain_energy", "amount": { "var": "status.amount" } },
        { "type": "change_status_duration", "amount": -1 }
      ]
    }
  ],
  "removalRules": [
    { "check": "status.duration_lte", "value": 0 }
  ]
}
```

### Example: Shadow Execution Direction

Card definition:

```json
{
  "id": "shadow_execution",
  "cost": 2,
  "tags": ["skill", "curse"],
  "targeting": { "selector": "enemy", "count": 1, "required": true },
  "effects": [
    {
      "type": "apply_status",
      "statusId": "shadow_counter",
      "duration": 3,
      "state": { "damaged": false }
    }
  ]
}
```

Status definition:

```json
{
  "id": "shadow_counter",
  "name": "Shadow Counter",
  "triggers": [
    {
      "event": "damage_taken",
      "conditions": [
        { "check": "event.target_is_status_owner" }
      ],
      "effects": [
        {
          "type": "set_status_state",
          "key": "damaged",
          "value": true
        }
      ]
    },
    {
      "event": "turn_ended",
      "conditions": [
        { "check": "status.duration_eq", "value": 1 },
        { "check": "status_state_equals", "key": "damaged", "value": false }
      ],
      "effects": [
        {
          "type": "apply_modifier",
          "modifier": {
            "kind": "attack_charge",
            "scope": "entity",
            "amount": 999,
            "remainingUses": 1
          }
        },
        {
          "type": "change_status_duration",
          "amount": -1
        }
      ]
    }
  ],
  "removalRules": [
    { "check": "status.duration_lte", "value": 0 }
  ]
}
```

This example may still evolve, but the principle is important:

- mutable status state belongs on the runtime status instance
- behavior belongs in the status definition
- conditions should remain declarative

## Effects Model

Effects should be declarative where possible.

Recommended initial effect families:

- `deal_damage`
- `heal`
- `gain_shield`
- `gain_energy`
- `draw_cards`
- `discard_cards`
- `exhaust_cards`
- `move_card`
- `create_card`
- `transform_card`
- `upgrade_card`
- `apply_status`
- `remove_status`
- `apply_modifier`
- `remove_modifier`
- `summon_entity`
- `gain_gold`
- `conditional`
- `begin_interaction`

### Conditional Effects

Do not embed arbitrary code into JSON.

Prefer a declarative conditional shape:

```json
{
  "type": "conditional",
  "if": {
    "all": [
      { "check": "status_state_equals", "key": "damaged", "value": false },
      { "check": "status.duration_eq", "value": 1 }
    ]
  },
  "then": [
    { "type": "deal_damage", "amount": 999 }
  ],
  "else": []
}
```

### Value Resolution

Values should support:

- constants
- references
- simple arithmetic
- randomness
- counted queries

Recommended value resolver forms:

```json
5
```

```json
{ "var": "status.amount" }
```

```json
{
  "op": "add",
  "left": 2,
  "right": { "var": "source.stats.attack" }
}
```

```json
{
  "op": "count",
  "query": {
    "type": "cards_in_zone",
    "zone": "hand",
    "owner": "source",
    "hasTag": "attack"
  }
}
```

Do not support unbounded custom scripts in phase 1.

## Card Selection and Multi-Step Interactions

To support cards like:

- Tactical Insight
- Balance
- Upgrade
- Infest
- transform cards
- choose cards to retain or discard

the engine must support interaction-based resolution.

### Example: Tactical Insight

Card definition:

```json
{
  "id": "tactical_insight",
  "cost": 1,
  "tags": ["skill"],
  "targeting": { "selector": "self", "required": true },
  "effects": [
    { "type": "draw_cards", "amount": 3, "target": "self" },
    {
      "type": "begin_interaction",
      "interaction": {
        "type": "select_cards",
        "actionLabel": "Discard",
        "selector": {
          "zone": "hand",
          "owner": "self"
        },
        "minSelections": 1,
        "maxSelections": 1,
        "onConfirm": [
          { "type": "discard_selected_cards" }
        ]
      }
    }
  ]
}
```

This allows the UI to render:

- legal clickable cards
- button label `Discard`
- confirm and cancel flow

without hardcoding Tactical Insight in JSX.

## Summons and Allies

Summons should be treated as entities.

Recommended approach:

- define summon templates in `SummonDefinition`
- `summon_entity` creates a runtime `Entity`
- summoned units may have statuses, decks, or intents
- ally and enemy targeting should include summons automatically based on ownership and filters

This supports:

- bear warrior
- stone golem
- future pets, minions, and enemy reinforcements

## Tags and Card Queries

Cards should have tags and support deck/hand/discard queries.

Useful tags:

- `attack`
- `skill`
- `defend`
- `spell`
- `projectile`
- `fire`
- `ice`
- `summon`
- `curse`
- `strike`

The engine should support effects and modifiers that filter by:

- tag
- card name
- card definition id
- card owner
- current zone
- created-this-battle
- temporary/permanent origin

Examples:

- all attack cards deal +1 damage this turn
- all defend cards gain thorn
- every `Strike` in your deck is upgraded
- cards named `Strike` deal half damage in this environment

## Environment System

Environment should be a first-class battle system.

Examples:

- wet
- hot
- Strike prohibited
- toxic ground
- frozen hall

Environment can contribute:

- event triggers
- battle-wide modifiers
- restrictions
- status interactions

Example:

```json
{
  "id": "strike_prohibited",
  "name": "Strike Prohibited",
  "modifiers": [
    {
      "kind": "damage_multiplier_for_cards",
      "scope": "environment",
      "filters": [
        { "check": "card_name_equals", "value": "Strike" }
      ],
      "amount": 0.5
    }
  ]
}
```

## Deck Influence Mechanics

Cards that affect target decks should be supported by generic card-zone operations.

Examples:

- infest
- steal enemy cards
- add junk cards to target discard
- curse next draw
- transform future draws

Future-proofing recommendation:

- enemies may eventually own full decks
- card movement should work on any entity with zones
- deck-altering effects should target card zones, not special-case only the player

## Probability and Randomness

Probability should be explicitly representable.

Examples:

- 50% heal, 50% damage
- 25% crit
- random enemy
- random cards in hand

Recommended forms:

```json
{
  "type": "random_choice",
  "choices": [
    {
      "weight": 1,
      "effects": [{ "type": "heal", "amount": 10, "target": "self" }]
    },
    {
      "weight": 1,
      "effects": [{ "type": "deal_damage", "amount": 10, "target": "enemy" }]
    }
  ]
}
```

```json
{
  "type": "deal_damage",
  "amount": 10,
  "modifiers": [
    {
      "type": "chance_to_repeat_with_multiplier",
      "chance": 0.25,
      "multiplier": 2
    }
  ]
}
```

For deterministic testing later, randomness should route through a central RNG service.

## Zones and Card Lifecycles

Recommended card zones:

- draw
- hand
- discard
- exhaust
- banished
- limbo

Recommended lifetimes:

- run
- level
- battle
- one-shot

This supports:

- temporary cards
- permanent cards
- created cards
- stolen cards
- turn-temporary cards becoming permanent
- potion-like cards with one-time use

## Runtime Queries

The UI should not derive gameplay legality from raw arrays.

Recommended engine queries:

- `getPlayableCards(state, playerId)`
- `getCardCost(state, cardInstanceId)`
- `getLegalTargets(state, cardInstanceId)`
- `getVisibleInteraction(state)`
- `getEntityIntent(state, entityId)`
- `getCardPreview(state, cardInstanceId)`

These should become the stable API between engine and JSX.

## Recommended Folder Direction

One possible future folder layout:

```txt
src/
  engine/
    core/
      BattleEngine.js
      RulesEngine.js
      InteractionController.js
      DefinitionRegistry.js
    commands/
      dispatchCommand.js
    events/
      emitEvent.js
    queries/
      getPlayableCards.js
      getLegalTargets.js
      getVisibleInteraction.js
    resolvers/
      resolveEffect.js
      resolveValue.js
      resolveConditions.js
      resolveTargeting.js
    models/
      CardInstance.js
      StatusInstance.js
      DeckInstance.js
      Entity.js
    definitions/
      cards/
      statuses/
      enemies/
      environments/
  docs/
    card_engine.md
```

This is directionally useful, not a requirement.

## Migration Plan

A full rewrite is risky. Prefer staged migration.

### Phase 1: Write and stabilize this design

Deliverables:

- `docs/card_engine.md`
- shared terminology
- agreement on command, event, status, modifier, and targeting concepts

### Phase 2: Introduce CardInstance

Deliverables:

- every card in deck/hand/discard becomes a `CardInstance`
- pile arrays store `cardInstanceId`s
- card definitions remain loaded from JSON

Benefits:

- upgrades
- enchantments
- charges
- temporary battle cards
- permanent run cards

### Phase 3: Separate runtime state from orchestration

Deliverables:

- reduce `GameManager`
- introduce `GameState` and `BattleEngine`
- move UI to command-based engine entry points

### Phase 4: Add query API for JSX

Deliverables:

- legal targets query
- playable card query
- visible interaction query

Benefits:

- thinner UI
- easier testing
- easier future mechanics

### Phase 5: Introduce StatusInstance and ModifierInstance

Deliverables:

- burn, freeze, shield, fortify, regeneration migrated first
- event-based status triggers
- scoped modifiers

### Phase 6: Replace simple targeting with TargetingRule

Deliverables:

- self / enemy / ally / all / random target resolution
- legality filtering in engine

### Phase 7: Add PendingInteraction

Deliverables:

- discard selection
- upgrade selection
- transform selection
- non-standard card click actions

### Phase 8: Migrate cards gradually

Start with vertical slices:

- one simple attack
- one shield card
- one status card
- one random/probability card
- one discard interaction card
- one summon card

Do not migrate the whole library at once.

### Phase 9: Add environments and deck influence mechanics

After the core systems are stable:

- environment modifiers
- deck manipulation
- enemy decks
- persistent level-scoped charges

## Testing Strategy

This engine will become too complex to trust without tests.

Recommended testing priorities:

1. value resolution
2. target legality
3. card play legality
4. effect resolution
5. status trigger timing
6. modifier precedence
7. interaction flow
8. end-of-turn and start-of-turn lifecycle

Examples of good tests:

- next card cost reduction is consumed exactly once
- multicast duplicates card effects but preserves target legality
- retained cards stay in hand and still carry battle modifiers
- a status with duration 2 triggers exactly twice
- a card with level-scoped charges refreshes on next level, not next battle

## Practical Rules for Future Design Decisions

When adding a new mechanic, prefer the following order:

1. Can this be represented as a definition plus existing effect types?
2. Can this be represented as a status or modifier?
3. Can this be represented as a pending interaction?
4. Can this be represented as a query or calculation hook?
5. Only then add a new engine-native resolver behavior.

This helps keep the engine extensible without becoming chaotic.

## Session Handoff Guidance

Because future chat context windows may be shorter than the full implementation history, this file should be treated as the main shared architecture reference.

When starting a new session, a good re-entry path is:

1. read `docs/card_engine.md`
2. inspect the current engine/store files that differ from the document
3. identify which migration phase is currently in progress
4. continue from the next smallest vertical slice

Recommended companion docs in the future:

- `docs/migration_plan.md`
- `docs/status_schema.md`
- `docs/card_schema.md`
- `docs/interaction_model.md`

## Recommended Conversation Length

For this project, a good working rhythm is:

- one conversation for one design topic or one implementation slice
- keep each thread focused on a single phase or vertical slice
- once the thread starts mixing architecture, schema changes, UI rewrites, and bugfixes, open a fresh one

Practical examples of good thread scope:

- drafting the card engine architecture
- implementing `CardInstance`
- migrating deck zones to instance ids
- introducing `PendingInteraction`
- migrating burn/freeze/shield to `StatusInstance`

As a rule of thumb, start a new conversation when:

- the current thread has covered multiple subsystems
- we have already made and verified one coherent milestone
- a fresh task would require re-explaining goals anyway

## Recommendation for New Context Windows

Yes, reading `docs/card_engine.md` should be the first common-ground step in a new session.

It is the right anchor document because it explains:

- the target architecture
- why the refactor exists
- the intended runtime models
- the migration phases

If context is lost, the best restart prompt is something like:

"Read `docs/card_engine.md`, inspect the current engine files, tell me which migration phase the repo is currently in, and continue with phase X."

That should be enough to recover shared context efficiently.
