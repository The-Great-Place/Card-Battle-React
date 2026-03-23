export function BattleHeader({ turn }) {
  return (
    <div className='top-bar'>
      <div className='turn-indicator'> Turn {turn} </div>
      <div className='top-right-placeholder'>
        <button className='clickable setting'>Setting</button>
      </div>
    </div>
  );
}
