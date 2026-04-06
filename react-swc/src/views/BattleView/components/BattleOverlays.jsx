import { LootView } from "../LootView.jsx";
import { RunCompleteView } from "../RunCompleteView.jsx";
import { observer } from "mobx-react";

export const BattleOverlays = observer(({ overlays, battleEngine }) => {
  return (
    <>
      {overlays.lootOpen && (
        <LootView
          loot={overlays.pendingLoot}
          onPick={(cardId) => battleEngine.dispatch({ type: "CLAIM_REWARD", cardId })}
          onSkip={() => battleEngine.dispatch({ type: "SKIP_REWARD" })}
        />
      )}
      {overlays.runComplete && (
        <RunCompleteView
          title="Run Complete"
          buttonText="Next Level"
          onRestart={() => battleEngine.dispatch({ type: "NEXT_LEVEL" })}
        />
      )}
      {overlays.runFailed && (
        <RunCompleteView
          title="You Died"
          buttonText="Try Again"
          onRestart={() => battleEngine.dispatch({ type: "RESTART_RUN" })}
        />
      )}
    </>
  );
})
