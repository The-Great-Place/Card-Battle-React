import './ChapterView.css';
import { useGameStore } from '../../store/useBattleStore';
import { BattleView } from '../BattleView/~MainPage';
import { createEnemy } from '../../engine/enemyRegistry';
import { observer } from "mobx-react";
import { ShopView } from './ShopView';

export const ChapterView = observer(() => {
  const gameState = useGameStore(s => s.gameState);
  const battleEngine = useGameStore(s => s.battleEngine);

  const buildEnemiesArray = (enemiesJSON) => {
    return enemiesJSON.waves.map(wave =>
      wave.enemies.map(enemyType => createEnemy(enemyType))
    );
  };

  const EnterLevel = async (levelId) => {
    const levelStatus = gameState.chapterProgress.levels[levelId]?.status;
    if (levelStatus !== 'available') return;

    const response = await fetch('./Data/Levels/Chapter1/' + levelId + '.json');
    const enemiesJson = await response.json();

    battleEngine.dispatch({
      type: "START_LEVEL",
      levelId,
      enemies: buildEnemiesArray(enemiesJson),
    });
  };

  const allNormalCleared =
    gameState.chapterProgress.levels['darkened-grave'].status === 'completed' &&
    gameState.chapterProgress.levels['goblin-huts'].status === 'completed' &&
    gameState.chapterProgress.levels['monster-tunnel'].status === 'completed';

  const mapImage = allNormalCleared
    ? "./Map/Dungeon1.png"
    : "./Map/Dungeon2.png";

  const levels = [
     {
      id: 'secret-passage',
      name: 'Secret Passage',
      className: 'secret',
      info: 'Secret passages to the Prime Dragon.',
      x: 55,
      y: 90,
    },
    {
      id: 'darkened-grave',
      name: 'Darkened Grave',
      className: 'graveyard',
      info: 'Undead enemies',
      x: 30,
      y: 40,
    },
    
    {
      id: 'goblin-huts',
      name: 'Goblin Huts',
      className: 'goblin-huts',
      info: 'Goblin enemies',
      x: 26,
      y: 77,
    },
    {
      id: 'monster-tunnel',
      name: 'Monster Tunnel',
      className: 'mine',
      info: 'Tunnel monsters',
      x: 80,
      y: 30,
    },
    {
      id: 'dragon-den',
      name: "DRAGON'S DEN",
      className: 'dragon-lair',
      info: 'Final boss',
      x: 88,
      y: 80,
    },
  ];

  if (gameState.currentView === 'chapter-view') {
    return (
      <div className="chapter-view">
        <div className="map-container">
          <ShopView gameState={gameState} battleEngine={battleEngine}></ShopView>
          <img
            src={mapImage}
            alt="Dungeon Map"
            className="dungeon-map"
          />

          {levels.map((level) => {
            const status = gameState.chapterProgress.levels[level.id]?.status ?? 'locked';

            if (level.id === 'dragon-den' && status === 'locked') {
              return null;
            }

            return (
              <button
                key={level.id}
                className={`level-button ${level.className} ${status}`}
                style={{
                  left: `${level.x}%`,
                  top: `${level.y}%`,
                }}
                data-info={
                  status === 'completed'
                    ? 'Completed'
                    : status === 'locked'
                    ? 'Locked'
                    : level.info
                }
                disabled={status !== 'available'}
                onClick={() => EnterLevel(level.id)}
              >
                {status === 'completed' ? `✓ ${level.name}` : level.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (gameState.currentView === 'battle-view') {
    return <BattleView />;
  }

  return null;
});
