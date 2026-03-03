import { makeAutoObservable } from "mobx";

export class GameManager{
    constructor(player, enemies){
        this.time = 0;
        this.player = player;
        this.enemies = enemies;
        makeAutoObservable(this);
    }
    progressTime(t){
        for (let i = 1; i < t + 1; i++){
            this.time +=1;
            let pi = this.player.intents[0];
            if (pi){
                if (pi.time == this.time) this.player.playCard(pi.target, pi.card_idx);
                this.enemies[0].forEach(e => {
                    let ei = e.intents[0];
                    if (ei.time == this.time) e.playCard(ei.target, ei.card);
                });
            }
        }
    }
    intentAction(target, card_idx){
        let card = this.player.deck.hand[card_idx];
        this.player.intents.push({
            'time': this.time + card.time_cost,
            'target': target,
            'card_idx': card_idx
        });
        console.log(card)
        this.progressTime(card.time_cost);
    }
    drawCard(n){
        this.player.drawCard(n);
        this.progressTime(1);
    }
}