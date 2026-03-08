// A simple definition of what a pattern should do
class IntentPattern {
  // Returns the next intent object based on the last known time
  generateNext(lastTime) {
    throw new Error("Not implemented");
  }
}

export class LoopPattern extends IntentPattern {
  constructor(moves) {
    super();
    this.moves = moves; // e.g., [{card: 'Attack', time: 2}, {card: 'Defend', time: 3}]
    this.currentIndex = -1;
  }

  generateNext() {
    const next_intent = []
    do { 
      this.currentIndex = (this.currentIndex + 1) % this.moves.length;
      next_intent.push( this.moves[this.currentIndex] )
    } while (this.moves[this.currentIndex].time == 0)

    // next_intent.push( this.moves[this.currentIndex] )
    // this.currentIndex = (this.currentIndex + 1) % this.moves.length;

    return next_intent;
  }
}

class RandomPattern extends IntentPattern {
  generateNext(lastTime) {
    const nextDelta = Math.floor(Math.random() * 3) + 2; // Time cost 2-4
    return { 
      card: 'RandomAttack', 
      time: lastTime + nextDelta 
    };
  }
}