import { LootView } from "../LootView.jsx";
import { RunCompleteView } from "../RunCompleteView.jsx";
import { observer } from "mobx-react";

export const BattleOverlays = observer(({ gameState, battleEngine }) => {
  return (
    <>
      {gameState.lootOpen && (
        <LootView
          loot={gameState.pendingLoot}
          onPick={(cardId) => battleEngine.dispatch({ type: "CLAIM_REWARD", cardId })}
          onSkip={() => battleEngine.dispatch({ type: "SKIP_REWARD" })}
        />
      )}
      {gameState.runComplete && (
        <RunCompleteView
          title="Run Complete"
          buttonText="Next Level"
          onRestart={() => battleEngine.dispatch({ type: "NEXT_LEVEL" })}
        />
      )}
      {gameState.runFailed && (
        <RunCompleteView
          title="You Died"
          buttonText="Try Again"
          onRestart={() => battleEngine.dispatch({ type: "RESTART_RUN" })}
        />
      )}
    </>
  );
})
