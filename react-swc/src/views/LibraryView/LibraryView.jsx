import './css/LibraryView.css'
import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../../store/useGameStore.js'

export const LibraryView = () => {
  const setScreen = useGameStore((state) => state.setScreen)

  const [tab, setTab] = useState('cards')
  const [search, setSearch] = useState('')
  const [cards, setCards] = useState([])
  const [enemies, setEnemies] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLibraryData = async () => {
      try {
        setLoading(true)

        const [cardsRes, enemiesRes] = await Promise.all([
          fetch('./Data/cards.json'),
          fetch('./Data/enemies.json')
        ])

        const cardsJson = await cardsRes.json()
        const enemiesJson = await enemiesRes.json()

        // cards.json / enemies.json 都是 object，转成 array
        const cardList = Object.entries(cardsJson).map(([key, value]) => ({
          key,
          ...value,
        }))

        const enemyList = Object.entries(enemiesJson).map(([key, value]) => ({
          key,
          id: key,
          ...value,
        }))

        // 卡牌排序：先 rewardable，再 rarity，再 name
        const rarityOrder = {
          common: 1,
          uncommon: 2,
          rare: 3,
          epic: 4,
          legendary: 5,
        }

        cardList.sort((a, b) => {
          const rewardA = a.rewardable ? 0 : 1
          const rewardB = b.rewardable ? 0 : 1
          if (rewardA !== rewardB) return rewardA - rewardB

          const rarityA = rarityOrder[a.rarity] ?? 999
          const rarityB = rarityOrder[b.rarity] ?? 999
          if (rarityA !== rarityB) return rarityA - rarityB

          return (a.name || a.id || '').localeCompare(b.name || b.id || '')
        })

        enemyList.sort((a, b) =>
          (a.name || a.id || '').localeCompare(b.name || b.id || '')
        )

        setCards(cardList)
        setEnemies(enemyList)
      } catch (error) {
        console.error('Failed to load library data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLibraryData()
  }, [])

  const visibleList = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const source = tab === 'cards' ? cards : enemies

    return source.filter((entry) => {
      if (!keyword) return true

      const name = (entry.name || '').toLowerCase()
      const desc = (entry.description || '').toLowerCase()
      const rarity = (entry.rarity || '').toLowerCase()
      const id = (entry.id || entry.key || '').toLowerCase()

      return (
        name.includes(keyword) ||
        desc.includes(keyword) ||
        rarity.includes(keyword) ||
        id.includes(keyword)
      )
    })
  }, [tab, cards, enemies, search])

  return (
    <div className="libraryPage">
      <div className="libraryPage__topBar">
        <button
          className="libraryPage__backButton"
          onClick={() => setScreen('mainMenu')}
        >
          ← Back
        </button>

        <div className="libraryPage__titleWrap">
          <h1 className="libraryPage__title">Codex</h1>
          <p className="libraryPage__subtitle">Cards and monsters</p>
        </div>
      </div>

      <div className="libraryPage__controls">
        <div className="libraryPage__tabs">
          <button
            className={`libraryPage__tab ${tab === 'cards' ? 'is-active' : ''}`}
            onClick={() => {
              setTab('cards')
              setSelectedEntry(null)
            }}
          >
            Cards
          </button>

          <button
            className={`libraryPage__tab ${tab === 'monsters' ? 'is-active' : ''}`}
            onClick={() => {
              setTab('monsters')
              setSelectedEntry(null)
            }}
          >
            Monsters
          </button>
        </div>

        <input
          className="libraryPage__search"
          type="text"
          placeholder={`Search ${tab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="libraryPage__content">
        <div className="libraryPage__list">
          {loading && <div className="libraryPage__empty">Loading...</div>}

          {!loading && visibleList.length === 0 && (
            <div className="libraryPage__empty">Nothing found.</div>
          )}

          {!loading && tab === 'cards' && visibleList.map((card, idx) => (
            <button
              key={card.key || card.id || idx}
              className={`libraryEntry ${selectedEntry?.key === card.key ? 'is-selected' : ''}`}
              onClick={() => setSelectedEntry(card)}
            >
              <img
                className="libraryEntry__icon"
                src={card.image}
                alt={card.name || card.id}
              />

              <div className="libraryEntry__info">
                <div className="libraryEntry__name">
                  {card.name || card.id || card.key}
                </div>

                <div className="libraryEntry__meta">
                  <span>{card.rarity || 'unknown'}</span>
                  <span>Cost: {card.energy_cost ?? '-'}</span>
                  <span>{card.rewardable ? 'Rewardable' : 'Non-reward'}</span>
                </div>

                <div className="libraryEntry__desc">
                  {card.description || 'No description.'}
                </div>
              </div>
            </button>
          ))}

          {!loading && tab === 'monsters' && visibleList.map((enemy, idx) => (
            <button
              key={enemy.key || enemy.id || idx}
              className={`libraryEntry ${selectedEntry?.key === enemy.key ? 'is-selected' : ''}`}
              onClick={() => setSelectedEntry(enemy)}
            >
              <img
                className="libraryEntry__icon"
                src={enemy.image}
                alt={enemy.name || enemy.id}
              />

              <div className="libraryEntry__info">
                <div className="libraryEntry__name">
                  {enemy.name || enemy.id || enemy.key}
                </div>

                <div className="libraryEntry__meta">
                  <span>HP: {enemy.hp ?? '-'}</span>
                  <span>
                    {enemy.pattern_type ? `Pattern: ${enemy.pattern_type}` : 'Patterned'}
                  </span>
                </div>

                <div className="libraryEntry__desc">
                  {enemy.pattern
                    ? `Intent count: ${enemy.pattern.length}`
                    : 'No pattern info.'}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="libraryPage__detail">
          {!selectedEntry && (
            <div className="libraryDetail__placeholder">
              Select a {tab === 'cards' ? 'card' : 'monster'} to inspect.
            </div>
          )}

          {selectedEntry && tab === 'cards' && (
            <div className="libraryDetail">
              <h2>{selectedEntry.name || selectedEntry.id || selectedEntry.key}</h2>

              <img
                className="libraryDetail__image"
                src={selectedEntry.image}
                alt={selectedEntry.name || selectedEntry.id}
              />

              <div className="libraryDetail__badges">
                <span>{selectedEntry.rarity || 'unknown'}</span>
                <span>Cost: {selectedEntry.energy_cost ?? '-'}</span>
                <span>{selectedEntry.targets} target(s)</span>
              </div>

              <div className="libraryDetail__section">
                <h3>Description</h3>
                <p>{selectedEntry.description || 'No description.'}</p>
              </div>

              <div className="libraryDetail__section">
                <h3>Effects</h3>
                {selectedEntry.effects?.length ? (
                  <ul className="libraryDetail__list">
                    {selectedEntry.effects.map((effect, index) => (
                      <li key={index}>
                        <strong>{effect.type}</strong>
                        {effect.target ? ` • target: ${effect.target}` : ''}
                        {effect.stack_name ? ` • stack: ${effect.stack_name}` : ''}
                        {effect.value !== undefined ? ` • value: ${JSON.stringify(effect.value)}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No effects.</p>
                )}
              </div>
            </div>
          )}

          {selectedEntry && tab === 'monsters' && (
            <div className="libraryDetail">
              <h2>{selectedEntry.name || selectedEntry.id || selectedEntry.key}</h2>

              <img
                className="libraryDetail__image"
                src={selectedEntry.image}
                alt={selectedEntry.name || selectedEntry.id}
              />

              <div className="libraryDetail__badges">
                <span>HP: {selectedEntry.hp ?? '-'}</span>
                <span>
                  {selectedEntry.pattern_type ? `Pattern: ${selectedEntry.pattern_type}` : 'Patterned'}
                </span>
              </div>

              <div className="libraryDetail__section">
                <h3>Pattern</h3>
                {selectedEntry.pattern ? (
                  <pre className="libraryDetail__pattern">
                    {JSON.stringify(selectedEntry.pattern, null, 2)}
                  </pre>
                ) : (
                  <p>No pattern data.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
