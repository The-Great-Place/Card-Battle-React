import { useState } from 'react'
import { useGameStore } from './store/useBattleStore.js'
import './App.css'
import { BattleView } from './views/BattleView/~MainPage.jsx'

function App() {

  const { round, player, enemies, playCard } = useGameStore()
  const [,setTick] = useState(0)
  
  const handlePlayCard = () => {
    playCard(player, player)
    setTick(tick => {tick+1})
  }


  return (
    <div className='container'>
      <BattleView></BattleView>
    </div>
  )
}

export default App
