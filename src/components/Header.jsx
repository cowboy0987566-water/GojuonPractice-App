import React from 'react';
import { Home, ArrowLeft, Settings } from 'lucide-react';
import { DT } from './DT';

export const Header = ({ gameState, prevGameState, setGameState, tKey, settings }) => {
  return (
    <div className="bg-rose-500 pt-6 pb-5 px-5 text-white text-center relative flex-shrink-0 z-10">
      {gameState !== 'menu' && (
        <button
          onClick={() => {
            if (['settings', 'langPicker', 'table', 'calendar'].includes(gameState)) setGameState(prevGameState);
            else setGameState('menu');
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-rose-600 bg-rose-600/30 rounded-full transition-colors"
        >
          {gameState === 'playing' ? <Home size={22} /> : <ArrowLeft size={22} />}
        </button>
      )}

      {gameState === 'playing' && (
        <button
          onClick={() => { setGameState('settings'); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-rose-600 bg-rose-600/30 rounded-full transition-colors"
        >
          <Settings size={22} />
        </button>
      )}

      <h1 className="font-black tracking-wider flex flex-col items-center">
        <DT
          tKey={tKey}
          settings={settings}
          spanClass="text-2xl leading-none"
          jpClassName="text-[0.65rem] uppercase tracking-widest mt-1 opacity-90 font-medium"
        />
      </h1>

      {['stats', 'settings', 'langPicker', 'calendar', 'menu'].includes(gameState) && (
        <div className="text-rose-100 flex flex-col items-center mt-2 opacity-90">
          <DT
            tKey={
              gameState === 'stats' ? 'stSub' :
                gameState === 'settings' ? 'setSub' :
                  gameState === 'calendar' ? 'calSub' :
                    gameState === 'menu' ? 'sub' : 'sjD'
            }
            settings={settings}
            spanClass="text-xs font-medium leading-none"
            jpClassName="mt-1 text-[0.65rem]"
          />
        </div>
      )}
    </div>
  );
};
