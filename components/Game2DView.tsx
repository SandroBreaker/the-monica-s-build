
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { Game2DEngine, InputKeys } from '../services/Game2DEngine';
import { Trophy, Heart, ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, ChevronUp, Sword } from 'lucide-react';

interface Game2DViewProps {
    onBack: () => void;
}

export const Game2DView: React.FC<Game2DViewProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Game2DEngine | null>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameState, setGameState] = useState<'playing' | 'win' | 'gameover'>('playing');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        if (!canvasRef.current) return;

        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        const engine = new Game2DEngine(canvasRef.current, {
            onScore: (s) => setScore(s),
            onLives: (l) => setLives(l),
            onWin: () => setGameState('win'),
            onGameOver: () => setGameState('gameover')
        });

        engineRef.current = engine;

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', checkMobile);
            engine.cleanup();
        };
    }, []);

    const handleRestart = () => {
        setGameState('playing');
        window.location.reload(); 
    };

    const triggerInput = (key: keyof InputKeys, val: boolean) => {
        if (engineRef.current) {
            engineRef.current.input.keys[key] = val;
        }
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden touch-none">
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* HUD */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-10">
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={onBack}
                        className="pointer-events-auto bg-white border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 font-black uppercase text-xs flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <div className="bg-white/90 border-4 border-black px-6 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                        <span className="text-2xl">🍉</span>
                        <span className="text-2xl font-black">{score}</span>
                    </div>
                </div>

                <div className="bg-white/90 border-4 border-black px-6 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Heart 
                            key={i} 
                            size={28} 
                            fill={i < lives ? "#ef4444" : "none"} 
                            className={i < lives ? "text-red-500" : "text-slate-300"} 
                            strokeWidth={3} 
                        />
                    ))}
                </div>
            </div>

            {/* Mobile Touch Controls */}
            {isMobile && gameState === 'playing' && (
                <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-between items-end z-20 pointer-events-none">
                    {/* D-Pad (Left/Right) */}
                    <div className="flex gap-4 pointer-events-auto">
                        <TouchButton 
                            icon={<ChevronLeft size={40} strokeWidth={4} />} 
                            onStart={() => triggerInput('left', true)} 
                            onEnd={() => triggerInput('left', false)}
                            color="blue"
                        />
                        <TouchButton 
                            icon={<ChevronRight size={40} strokeWidth={4} />} 
                            onStart={() => triggerInput('right', true)} 
                            onEnd={() => triggerInput('right', false)}
                            color="blue"
                        />
                    </div>

                    {/* Action Pad (Jump/Attack) */}
                    <div className="flex flex-col gap-4 items-center pointer-events-auto">
                        <TouchButton 
                            icon={<ChevronUp size={40} strokeWidth={4} />} 
                            onStart={() => triggerInput('up', true)} 
                            onEnd={() => triggerInput('up', false)}
                            color="green"
                            large
                        />
                        <TouchButton 
                            icon={<Sword size={32} strokeWidth={4} />} 
                            onStart={() => triggerInput('attack', true)} 
                            onEnd={() => triggerInput('attack', false)}
                            color="red"
                            large
                        />
                    </div>
                </div>
            )}

            {/* Modals */}
            {gameState !== 'playing' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white border-8 border-black p-10 rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full text-center flex flex-col gap-6 transform rotate-1">
                        {gameState === 'win' ? (
                            <>
                                <Trophy size={80} className="text-yellow-500 mx-auto" strokeWidth={3} />
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Vitória!</h2>
                                <p className="font-bold text-slate-600 text-lg">Você recuperou o Limoeiro!</p>
                            </>
                        ) : (
                            <>
                                <div className="text-7xl mx-auto">💀</div>
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Fim de Jogo</h2>
                                <p className="font-bold text-slate-600 text-lg">Os meninos ganharam essa...</p>
                            </>
                        )}
                        
                        <div className="bg-slate-100 p-4 rounded-2xl border-2 border-black">
                            <div className="text-xs font-black uppercase text-slate-400">Pontuação</div>
                            <div className="text-3xl font-black text-black">🍉 {score}</div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleRestart}
                                className="w-full bg-green-500 hover:bg-green-400 text-white py-4 rounded-2xl font-black text-xl uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={24} /> Jogar de Novo
                            </button>
                            <button 
                                onClick={onBack}
                                className="w-full bg-white hover:bg-slate-50 text-black py-4 rounded-2xl font-black text-xl uppercase border-4 border-black"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface TouchButtonProps {
    icon: React.ReactNode;
    onStart: () => void;
    onEnd: () => void;
    color: 'blue' | 'red' | 'green';
    large?: boolean;
}

const TouchButton: React.FC<TouchButtonProps> = ({ icon, onStart, onEnd, color, large }) => {
    const colorClasses = {
        blue: 'bg-blue-500 active:bg-blue-400',
        red: 'bg-red-600 active:bg-red-500',
        green: 'bg-green-500 active:bg-green-400'
    };

    return (
        <button
            onTouchStart={(e) => { e.preventDefault(); onStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); onEnd(); }}
            onMouseDown={(e) => { e.preventDefault(); onStart(); }}
            onMouseUp={(e) => { e.preventDefault(); onEnd(); }}
            onMouseLeave={(e) => { e.preventDefault(); onEnd(); }}
            className={`
                flex items-center justify-center rounded-2xl border-4 border-black 
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1
                transition-transform active:scale-95 text-white
                ${large ? 'w-24 h-24' : 'w-20 h-20'}
                ${colorClasses[color]}
            `}
        >
            {icon}
        </button>
    );
};
