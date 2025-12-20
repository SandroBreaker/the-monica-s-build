
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Trophy, Users } from 'lucide-react';
import { GameMode } from '../types';

interface MainMenuProps {
    onSelectMode: (mode: GameMode) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectMode }) => {
    return (
        <div className="absolute inset-0 bg-[#87CEEB] flex flex-col items-center justify-center z-50 overflow-hidden font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                backgroundSize: '30px 30px'
            }}/>

            <div className="relative z-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="mb-12 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                    <h1 className="text-7xl font-black text-red-600 uppercase tracking-tighter drop-shadow-sm stroke-black" style={{ textShadow: '4px 4px 0 #000', WebkitTextStroke: '3px black' }}>
                        Turma dos<br/>Blocos
                    </h1>
                </div>

                <div className="flex flex-col gap-6 w-80 mx-auto">
                    <button
                        onClick={() => onSelectMode('CHALLENGE')}
                        className="group relative bg-yellow-400 hover:bg-yellow-300 border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white border-2 border-black rounded-full p-3 group-hover:scale-110 transition-transform">
                                <Trophy size={32} strokeWidth={3} className="text-yellow-500" />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-black text-black uppercase italic">Jogar</div>
                                <div className="text-xs font-bold text-black/60 uppercase tracking-wider">Modo Desafio 3D</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onSelectMode('FREE')}
                        className="group relative bg-white hover:bg-slate-50 border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 border-2 border-black rounded-full p-3 group-hover:scale-110 transition-transform">
                                <Users size={32} strokeWidth={3} className="text-blue-500" />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-black text-black uppercase italic">Modo Livre</div>
                                <div className="text-xs font-bold text-black/60 uppercase tracking-wider">Criação Ilimitada</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 text-center text-sm font-bold text-slate-700 opacity-60">
                Aventura no Limoeiro • Powered by Gemini 3
            </div>
        </div>
    );
}
