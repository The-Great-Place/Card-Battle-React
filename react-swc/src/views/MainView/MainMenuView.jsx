import './css/MainMenuView.css';
import { useGameStore } from '../../store/useGameStore.js';

export const MainMenuView = () => {
  const setScreen = useGameStore((state) => state.setScreen);

  return (
    <div className="mainMenuPage">
      <div className="mainMenuPage__overlay" />

      <div className="mainMenuPage__content">
        <div className="mainMenuPage__titleBlock">
          <h1 className="mainMenuPage__title">Grand Card Battle</h1>
          <p className="mainMenuPage__subtitle">
            A fantasy card-battling roguelike
          </p>
        </div>

        <div className="mainMenuPage__menu">
          <button
            className="mainMenuPage__button mainMenuPage__button--primary"
            onClick={() => setScreen("chapter")}
          >
            Start Run
          </button>

          <button
            className="mainMenuPage__button"
            onClick={() => setScreen("library")}
          >
            Card Library
          </button>

          <button
            className="mainMenuPage__button"
            onClick={() => setScreen("settings")}
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};