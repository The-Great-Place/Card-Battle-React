import { getAllCardDefinitions, getCardDefinition } from "./definitions/cardRegistry";

function buildRewardPools() {
  const pools = {
    common: [],
    uncommon: [],
    rare: [],
    epic: [],
    legendary: [],
  };

  Object.entries(getAllCardDefinitions()).forEach(([id, card]) => {
    if (!card.rewardable) return;

    const rarity = card.rarity || "common";

    if (!pools[rarity]) {
      pools[rarity] = [];
    }

    pools[rarity].push(id);
  });

  return pools;
}


function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function rollRarityForWave(waveIndex) {
  const r = Math.random();

  if (r < 0.4) return "common";
  if (r < 0.7) return "uncommon";
  if (r < 0.85) return "rare";
  if (r < 0.95) return "epic";
  return "legendary";
}

export function getRandomLootChoices(waveIndex, count = 3) {
  const chosenIds = new Set();
  const rewards = [];
  const rewardPool = buildRewardPools();

  let safety = 0;
  while (rewards.length < count && safety < 100) {
    safety++;

    const rarity = rollRarityForWave(waveIndex);
    const pool = rewardPool[rarity] || [];
    if (pool.length === 0) continue;

    const id = randomFrom(pool);
    if (chosenIds.has(id)) continue;

    const card = getCardDefinition(id);
    if (!card) continue;

    chosenIds.add(id);
    rewards.push({
      id,
      rewardRarity: rarity,
    });
  }

  return rewards;
}
