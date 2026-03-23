import { observer } from "mobx-react"
import { DeckView } from "./DeckView"
import { StatusMarks } from "./StatusMarks";


export const PlayerUnit = ({ onPress, player, selectedTargets }) => {
    return(
        <div className='player-area'>
            <div className='player-row'>
                    <div className="playerWrap" onClick={onPress}>
                         <div className="player-energy">⚡ {player.energy}/{player.maxEnergy} </div>

                    <div className={`playerSection ${selectedTargets.idx.includes(0) ? 'selectedEnemy' : ''}`}>
                        
           
                        <img src={player.image} alt="Player" className='playerImg' />
                        <div className='statsOverlay'>
                            <div className="stat-bar health-bar">
                            <div
                                className="bar-fill"
                                style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                            />
                            <span className="bar-text">
                                {player.health} / {player.maxHealth}
                            </span>
                            </div>
                            <StatusMarks unit={player} className="statusMarks--player" />

                        </div>
                    </div>
                </div>
                <div>
                    <DeckView className='clickable refresh-button' deck={player.deck}></DeckView>
                </div>

            </div>
        </div>
    )
};
