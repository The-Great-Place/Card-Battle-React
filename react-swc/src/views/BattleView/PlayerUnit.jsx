import { observer } from "mobx-react"
import { DeckView } from "./DeckView"
import { StatusMarks } from "./StatusMarks";


export const PlayerUnit = ({ onPress, player, gameManager }) => {

  //  const refreshHandSimple = () => {
    //    const n = player.deck.hand.length;
     //   if (n <= 0) return;

       // player.deck.discardPile.push(...player.deck.hand);
        //player.deck.hand.splice(0, player.deck.hand.length);

        //player.drawCard(n);
     //   gameManager.progressTime(2);
   // };

    const playerDrawCard = () => { gameManager.drawCard(1) }

    return(
        <div className='player-area'>
            <div className='player-row'>
                    <div className="playerWrap" onClick={onPress}>
                         <div className="player-energy">⚡ {gameManager.energy}/{gameManager.maxEnergy} </div>
                    <div className='playerSection'>
                        
           
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
                   {/* <button onClick={refreshHandSimple} className='clickable refresh-button' > Refresh Hand </button>*/}
                   {/* <button onClick={gameManager.endTurn} className="clickable refresh-button"> End Turn</button> */}
                </div>

            </div>
        </div>
    )
};
