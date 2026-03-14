import './ChapterView.css';
import { useGameStore } from '../../store/useBattleStore';
import { BattleView } from '../BattleView/~MainPage';
import { createEnemy } from '../../engine/enemyRegistry';
import { observer } from "mobx-react";
import { ShopView } from './ShopView';

export const ChapterView = observer(() => {
  const gameManager = useGameStore(s => s.gameManager);

  const buildEnemiesArray = (enemiesJSON) => {
    return enemiesJSON.waves.map(wave =>
      wave.enemies.map(enemyType => createEnemy(enemyType))
    );
  };

  const EnterLevel = async (levelId) => {
    const levelStatus = gameManager.chapterProgress.levels[levelId]?.status;
    if (levelStatus !== 'available') return;

    const response = await fetch('./Data/Levels/Chapter1/' + levelId + '.json');
    const enemiesJson = await response.json();

    gameManager.enemies = buildEnemiesArray(enemiesJson);
    gameManager.currentLevelId = levelId;
    gameManager.current_view = "battle-view";
    gameManager.startBattle();
  };

  const allNormalCleared =
    gameManager.chapterProgress.levels['darkened-grave'].status === 'completed' &&
    gameManager.chapterProgress.levels['goblin-huts'].status === 'completed' &&
    gameManager.chapterProgress.levels['monster-tunnel'].status === 'completed';

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

  if (gameManager.current_view === 'chapter-view') {
    return (
      <div className="chapter-view">
        <div className="map-container">
          <ShopView gameManager={gameManager}></ShopView>
          <img
            src={mapImage}
            alt="Dungeon Map"
            className="dungeon-map"
          />

          {levels.map((level) => {
            const status = gameManager.chapterProgress.levels[level.id]?.status ?? 'locked';

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

  if (gameManager.current_view === 'battle-view') {
    return <BattleView />;
  }

  return null;
});