/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { LevelConfig } from '../types';
import { Play } from 'lucide-react';

interface LevelIntroModalProps {
    level: LevelConfig;
    onStart: () => void;
}

export const LevelIntroModal: React.FC<LevelIntroModalProps> = ({ level, onStart }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-300">
            <div className="bg-white border-4 border-black rounded-[2rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full p-8 flex flex-col items-center gap-6 text-center relative overflow-hidden">
                
                <div className="absolute top-0 left-0 w-full h-4 bg-yellow-400 border-b-4 border-black"></div>

                <div className="space-y-2 mt-4">
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nível {level.id}</h3>
                    <h1 className="text-5xl font-black text-red-600 uppercase italic tracking-tighter stroke-black drop-shadow-sm" style={{ textShadow: '2px 2px 0 #000' }}>
                        {level.name}
                    </h1>
                </div>

                <p className="text-xl font-bold text-slate-800 leading-relaxed">
                    "{level.description}"
                </p>

                <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-200 text-blue-800 text-sm font-bold w-full">
                    <p>🎯 <span className="uppercase">Missão:</span> Passe o mouse ou dedo sobre os blocos espalhados para reconstruir o personagem!</p>
                </div>

                <button
                    onClick={onStart}
                    className="group relative w-full bg-green-500 hover:bg-green-400 text-white py-4 rounded-xl font-black text-2xl uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-2 active:translate-x-2 transition-all flex items-center justify-center gap-3"
                >
                    <span>Resgatar!</span>
                    <Play fill="currentColor" size={24} />
                </button>
            </div>
        </div>
    );
};