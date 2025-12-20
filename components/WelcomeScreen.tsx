/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';

interface WelcomeScreenProps {
  visible: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible }) => {
  return (
    <div className={`
        absolute top-24 left-0 w-full pointer-events-none flex justify-center z-10 select-none
        transition-all duration-500 ease-out transform font-sans
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}
    `}>
      <div className="text-center flex flex-col items-center gap-4 bg-white/90 backdrop-blur-md p-8 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
        <div>
            <h1 className="text-5xl font-black text-red-600 uppercase tracking-wide mb-2 drop-shadow-sm stroke-black" style={{ textShadow: '2px 2px 0 #000' }}>
                Turma dos Blocos
            </h1>
            <div className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] bg-yellow-300 inline-block px-3 py-1 rounded-full border-2 border-black">
                Powered by Gemini 3
            </div>
        </div>
        
        <div className="space-y-2 mt-4">
            <p className="text-xl font-black text-slate-800 italic">Construa modelos incríveis</p>
            <p className="text-xl font-black text-slate-800 italic">Derrube tudo e remonte</p>
            <p className="text-xl font-black text-slate-800 italic">Divirta-se com a turma!</p>
        </div>
      </div>
    </div>
  );
};