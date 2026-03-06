import { makeAutoObservable } from "mobx";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class GameManager{
    constructor(player, enemies){
        this.time = 0;
        this.player = player;
        this.enemies = enemies;
        this.enemies_index = 0;
        makeAutoObservable(this);
    }
    async progressTime(t){
        for (let i = 0; i < t + 1; i++){
            if (i!=0) this.time +=1;
            await this.runIntents()
            this.updateGame()
        }
    }
    async runIntents(){
        let pi = this.player.intents[0];
        if (pi){if (pi.time <= this.time) {
            this.player.playCard(pi.target, this.player.deck.hand[pi.card_idx], pi.card_idx);
            await delay(800)
        }}
        this.enemies[this.enemies_index].forEach(async e => {
            if (e.alive){
                let ei = e.intents[0];
                let matchTarget = {"player": this.player, "self": e}
                if (ei.time <= this.time) {
                    e.playCard(matchTarget[ei.target], ei.card);
                    await delay(800)
                }
            }
        });
    }
    updateGame(){
        this.player.checkAlive()
        this.enemies[this.enemies_index].forEach(e => {e.checkAlive()})

        let allEnemyDead = true;
        this.enemies[this.enemies_index].forEach(e => { if (e.alive){ allEnemyDead = false; }})
        if(allEnemyDead){ this.time = 0; this.enemies_index += 1;}

    }
    intentAction(target, card_idx){
        let card = this.player.deck.hand[card_idx];
        console.log(card, target)
        this.player.intents.push({
            'time': this.time + card.time_cost,
            'target': target,
            'card_idx': card_idx
        });
        this.progressTime(card.time_cost);
    }
    drawCard(n){
        this.player.drawCard(n);
        this.progressTime(1);
    }
}