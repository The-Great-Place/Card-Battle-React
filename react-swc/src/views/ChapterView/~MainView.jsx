import { useState } from 'react';
import './ChapterView.css';
import { useGameStore } from '../../store/useBattleStore';
import { BattleView } from '../BattleView/~MainPage';
import { createEnemy } from '../../engine/enemyRegistry';
import { observer } from "mobx-react"

export const ChapterView = observer(() => {
    const [currentView, setCurrentView] = useState('chapter-view')
    const [currentLevel, setCurrentLevel] = useState(null)


    const gameManager = useGameStore(s => s.gameManager);

    const buildEnemiesArray = (enemiesJSON) => {
        return enemiesJSON.waves.map(wave => 
            wave.enemies.map(enemyType => createEnemy(enemyType))
        );
    }

    const EnterLevel = async (levelId) =>{
        const response = await fetch('./Data/Levels/Chapter1/' + levelId + '.json')
        const enemiesJson = await response.json()
        gameManager.enemies = buildEnemiesArray(enemiesJson)
        gameManager.current_view = "battle-view"
        console.log(gameManager.current_view)
    }
    const levels = [
        { id: 'darkened-grave', name: 'Darkened Grave', x: 15, y: 42 }, // Percentages
        { id: 'goblin-huts', name: 'Goblin Huts', x: 50, y: 50 }, // Changed to percentages (was 500,200)
        { id: 'monster-tunnel', name: 'Monster Tunnel', x: 90, y: 47 },
        { id: 'secret-passage', name: 'Secret Passage', x: 55, y: 17 },
    ];


    if (gameManager.current_view == 'chapter-view') return (
        <div className="chapter-view">
            {/* Map Container */}
            <div className="map-container">
                {/* The Map */}
                <img 
                    src="./dungeon.jpg" 
                    alt="Dungeon Map" 
                    className="dungeon-map"
                />

                {/* Interactive Buttons */}
                {levels.map((level) => (
                    <button 
                        key={level.id} 
                        className={`level-button ${level.id}`}
                        style={{
                            left: `${level.x}%`,
                            top: `${level.y}%`
                        }}
                        onClick={() => {EnterLevel(level.id)}}
                    >
                        {level.name}
                    </button>
                ))}
            </div>
        </div>
    );

    if (gameManager.current_view == 'battle-view') return (
        <BattleView></BattleView>
    )
});