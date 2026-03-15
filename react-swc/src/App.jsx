import { useState } from 'react'
import { observer } from "mobx-react"
import { useGameStore } from './store/useGameStore.js'
import './App.css'


import { MainMenuView } from './views/MainView/MainMenuView.jsx'
import { LibraryView } from './views/LibraryView/LibraryView.jsx'
import { BattleView } from './views/BattleView/~MainPage.jsx'
import { ChapterView } from './views/ChapterView/~MainView.jsx'

//function App() {

  //const { round, player, enemies, playCard } = useGameStore()
  //const [,setTick] = useState(0)
  
  //const handlePlayCard = () => {
    //playCard(player, player)
    //setTick(tick => {tick+1})
  //}


  //return (
    //<div className='container'>
      //<ChapterView></ChapterView>
      //{/* <BattleView></BattleView> */}
    //</div>
  //)
//}

function App() {
  const screen = useGameStore((state) => state.screen)

  console.log("App screen =", screen)

  return (
    <div className='container'>
      {screen === "mainMenu" && <MainMenuView />}
      {screen === "chapter" && <ChapterView />}
      {screen === "battle" && <BattleView />}
      {screen === "library" && <LibraryView />}
      {screen === "settings" && <div style={{ color: "black" }}>Settings Coming Soon</div>}
    </div>
  )
}

export default App
