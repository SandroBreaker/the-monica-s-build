/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect, useRef } from 'react';
import { AppState, SavedModel } from '../types';
import { Box, Bird, Cat, Rabbit, Users, Code2, Wand2, Hammer, FolderOpen, ChevronUp, FileJson, History, Play, Pause, Info, Wrench, Loader2, Smile, User, Umbrella, Zap } from 'lucide-react';

interface UIOverlayProps {
  voxelCount: number;
  appState: AppState;
  currentBaseModel: string;
  customBuilds: SavedModel[];
  customRebuilds: SavedModel[];
  isAutoRotate: boolean;
  isInfoVisible: boolean;
  isGenerating: boolean;
  manualProgress: number;
  onDismantle: () => void;
  // Relaxed type to 'string' to allow dynamic generators
  onRebuild: (type: any, manual?: boolean) => void;
  onManualRebuildClick: () => void;
  onNewScene: (type: any) => void;
  onSelectCustomBuild: (model: SavedModel) => void;
  onSelectCustomRebuild: (model: SavedModel) => void;
  onPromptCreate: () => void;
  onPromptMorph: () => void;
  onShowJson: () => void;
  onImportJson: () => void;
  onToggleRotation: () => void;
  onToggleInfo: () => void;
}

const LOADING_MESSAGES = [
    "Criando...",
    "Montando...",
    "Colorindo...",
    "Ajustando...",
];

export const UIOverlay: React.FC<UIOverlayProps> = ({
  voxelCount,
  appState,
  currentBaseModel,
  customBuilds,
  customRebuilds,
  isAutoRotate,
  isInfoVisible,
  isGenerating,
  manualProgress,
  onDismantle,
  onRebuild,
  onManualRebuildClick,
  onNewScene,
  onSelectCustomBuild,
  onSelectCustomRebuild,
  onPromptCreate,
  onPromptMorph,
  onShowJson,
  onImportJson,
  onToggleRotation,
  onToggleInfo
}) => {
  const isStable = appState === AppState.STABLE;
  const isDismantling = appState === AppState.DISMANTLING;
  const isManual = appState === AppState.MANUAL_REBUILDING;
  
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    if (isGenerating) {
        const interval = setInterval(() => {
            setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    } else {
        setLoadingMsgIndex(0);
    }
  }, [isGenerating]);
  
  const isEagle = currentBaseModel === 'Eagle';

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none overflow-hidden">
      
      {/* --- Comic Background Effect (Dots) --- */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '20px 20px'
      }}/>

      {/* --- Top Bar (Stats & Tools) --- */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        
        {/* Global Scene Controls */}
        <div className="pointer-events-auto flex flex-col gap-3">
            <DropdownMenu 
                icon={<FolderOpen size={24} strokeWidth={3} />}
                label="Personagens"
                color="blue"
            >
                <div className="px-2 py-1 text-xs font-black text-slate-400 uppercase tracking-wider">TURMA DA MÔNICA</div>
                <DropdownItem onClick={() => onNewScene('Monica')} icon={<Smile size={20}/>} label="Mônica" color="red" />
                <DropdownItem onClick={() => onNewScene('Cebolinha')} icon={<User size={20}/>} label="Cebolinha" color="green" />
                <DropdownItem onClick={() => onNewScene('Magali')} icon={<Smile size={20}/>} label="Magali" color="yellow" />
                <DropdownItem onClick={() => onNewScene('Cascao')} icon={<Umbrella size={20}/>} label="Cascão" color="orange" />
                
                <div className="h-0.5 bg-black my-2" />
                
                <div className="px-2 py-1 text-xs font-black text-slate-400 uppercase tracking-wider">EXTRAS</div>
                <DropdownItem onClick={() => onNewScene('Eagle')} icon={<Bird size={20}/>} label="Águia" />
                <DropdownItem onClick={onPromptCreate} icon={<Wand2 size={20}/>} label="Criar Novo (IA)" highlight />
                
                {customBuilds.length > 0 && (
                    <>
                         <div className="h-0.5 bg-black my-2" />
                        <div className="px-2 py-1 text-xs font-black text-slate-400 uppercase tracking-wider">SALVOS</div>
                        {customBuilds.map((model, idx) => (
                            <DropdownItem 
                                key={`build-${idx}`} 
                                onClick={() => onSelectCustomBuild(model)} 
                                icon={<History size={20}/>} 
                                label={model.name} 
                                truncate
                            />
                        ))}
                    </>
                )}
            </DropdownMenu>

            <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl border-4 border-black text-slate-800 font-black w-fit mt-1 transform -rotate-1">
                <div className="bg-yellow-300 p-1.5 rounded-lg border-2 border-black">
                    <Box size={20} strokeWidth={3} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] uppercase tracking-wider opacity-60">Blocos</span>
                    <span className="text-xl font-black font-mono">{voxelCount}</span>
                </div>
            </div>
        </div>

        {/* Utilities */}
        <div className="pointer-events-auto flex gap-3">
            <TactileButton
                onClick={onToggleInfo}
                color={isInfoVisible ? 'yellow' : 'white'}
                icon={<Info size={24} strokeWidth={3} />}
                label=""
                compact
            />
            <TactileButton
                onClick={onToggleRotation}
                color={isAutoRotate ? 'blue' : 'white'}
                icon={isAutoRotate ? <Pause size={24} strokeWidth={3} /> : <Play size={24} strokeWidth={3} />}
                label=""
                compact
            />
            <TactileButton
                onClick={onShowJson}
                color="white"
                icon={<Code2 size={24} strokeWidth={3} />}
                label=""
                compact
            />
        </div>
      </div>

      {/* --- Loading Indicator --- */}
      {isGenerating && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
              <div className="bg-white border-4 border-black px-8 py-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 min-w-[300px] transform -rotate-2">
                  <div className="relative">
                      <Loader2 size={64} className="text-blue-500 animate-spin" strokeWidth={3} />
                  </div>
                  <div className="text-center">
                      <h3 className="text-2xl font-black text-black uppercase">Gemini Criando...</h3>
                      <p className="text-slate-600 font-bold text-lg mt-2">
                          {LOADING_MESSAGES[loadingMsgIndex]}
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* --- Manual Rebuild Game UI --- */}
      {isManual && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 z-40 bg-black/10 backdrop-blur-[2px]">
              
              <div className="mb-6 w-full max-w-md px-8 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
                  <div className="relative w-full h-12 bg-white border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                       <div 
                        className="h-full bg-green-500 transition-all duration-150 ease-out border-r-4 border-black"
                        style={{ width: `${manualProgress}%` }}
                       />
                       <div className="absolute inset-0 flex items-center justify-center font-black text-xl italic tracking-widest text-black mix-blend-multiply">
                           {manualProgress}%
                       </div>
                  </div>
              </div>

              <button
                onClick={onManualRebuildClick}
                className="pointer-events-auto active:scale-95 transition-transform duration-75 group"
              >
                  <div className="bg-red-500 border-b-[8px] border-r-[8px] border-black rounded-full w-48 h-48 flex flex-col items-center justify-center shadow-xl active:translate-y-2 active:border-b-0 active:border-r-0">
                      <Hammer size={64} strokeWidth={3} className="text-white mb-2 animate-bounce" />
                      <span className="text-3xl font-black text-white uppercase italic tracking-widest border-text">CLIQUE!</span>
                  </div>
              </button>
              
              <div className="mt-4 text-white font-black text-2xl shadow-black drop-shadow-md stroke-black animate-pulse">
                  CONSERTE O MODELO!
              </div>
          </div>
      )}

      {/* --- Bottom Control Center --- */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center items-end pointer-events-none z-30">
        
        <div className="pointer-events-auto transition-all duration-500 ease-in-out transform">
            
            {/* STATE 1: STABLE -> DISMANTLE */}
            {isStable && (
                 <div className="animate-in slide-in-from-bottom-10 fade-in duration-300 hover:scale-105 transition-transform">
                     <BigComicButton 
                        onClick={onDismantle} 
                        icon={<Hammer size={48} strokeWidth={3} />} 
                        label="QUEBRAR!" 
                        color="red" 
                     />
                 </div>
            )}

            {/* STATE 2: DISMANTLED -> REBUILD OPTIONS */}
            {isDismantling && !isGenerating && (
                <div className="flex items-end gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 px-4">
                     
                     {/* Option 1: Magic Rebuild (Auto) */}
                     <DropdownMenu 
                        icon={<Wand2 size={32} strokeWidth={3} />}
                        label="MÁGICA"
                        color="green"
                        direction="up"
                        big
                     >
                        <div className="px-2 py-1 text-xs font-black text-slate-400 uppercase tracking-wider">RECONSTRUIR</div>
                        
                        <DropdownItem onClick={() => onRebuild(currentBaseModel)} icon={<History size={20}/>} label="Restaurar" highlight />
                        
                        <div className="h-0.5 bg-black my-2" />
                        <div className="px-2 py-1 text-xs font-black text-slate-400 uppercase tracking-wider">TRANSFORMAR</div>

                        <DropdownItem onClick={() => onRebuild('Monica')} icon={<Smile size={20}/>} label="Mônica" />
                        <DropdownItem onClick={() => onRebuild('Cebolinha')} icon={<User size={20}/>} label="Cebolinha" />
                        <DropdownItem onClick={() => onRebuild('Magali')} icon={<Smile size={20}/>} label="Magali" />
                        <DropdownItem onClick={() => onRebuild('Cascao')} icon={<Umbrella size={20}/>} label="Cascão" />

                        <div className="h-0.5 bg-black my-2" />
                        <DropdownItem onClick={onPromptMorph} icon={<Wand2 size={20}/>} label="IA Gemini" highlight />
                     </DropdownMenu>

                    {/* Option 2: Manual Challenge */}
                    <button 
                        onClick={() => onRebuild(currentBaseModel, true)} // True enables manual mode
                        className="group relative flex flex-col items-center justify-center w-36 h-36 rounded-3xl bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all duration-150 transform rotate-2"
                    >
                        <div className="mb-2 bg-white p-3 rounded-full border-2 border-black">
                            <Wrench size={32} strokeWidth={3} className="text-black" />
                        </div>
                        <div className="text-xl font-black tracking-wider uppercase italic">DESAFIO</div>
                    </button>

                </div>
            )}
        </div>
      </div>

    </div>
  );
};

// --- Comic Style Components ---

interface TactileButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  color: 'white' | 'red' | 'blue' | 'green' | 'yellow';
  compact?: boolean;
}

const TactileButton: React.FC<TactileButtonProps> = ({ onClick, disabled, icon, label, color, compact }) => {
  const colorStyles = {
    white:   'bg-white text-black hover:bg-gray-100',
    red:    'bg-red-500 text-white hover:bg-red-400',
    blue:     'bg-blue-500 text-white hover:bg-blue-400',
    green: 'bg-green-500 text-white hover:bg-green-400',
    yellow:   'bg-yellow-400 text-black hover:bg-yellow-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex items-center justify-center gap-2 rounded-xl font-black text-sm transition-all duration-100
        border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1
        ${compact ? 'p-3' : 'px-6 py-3'}
        ${disabled 
          ? 'bg-slate-200 text-slate-400 border-slate-400 cursor-not-allowed shadow-none' 
          : `${colorStyles[color]}`}
      `}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </button>
  );
};

const BigComicButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string, color: 'red'}> = ({ onClick, icon, label, color }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center w-40 h-40 rounded-full bg-red-600 hover:bg-red-500 text-white border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-2 active:translate-y-2 transition-all duration-150 transform -rotate-3"
        >
            <div className="mb-2 animate-wiggle">{icon}</div>
            <div className="text-2xl font-black tracking-widest italic">{label}</div>
        </button>
    )
}

// --- Dropdown Components ---

interface DropdownProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    color: 'blue' | 'green';
    direction?: 'up' | 'down';
    big?: boolean;
}

const DropdownMenu: React.FC<DropdownProps> = ({ icon, label, children, color, direction = 'down', big }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const bgClass = color === 'blue' ? 'bg-blue-500 hover:bg-blue-400 text-white' : 'bg-green-500 hover:bg-green-400 text-white';

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl transition-all active:shadow-none active:translate-x-1 active:translate-y-1 border-4 border-black
                    ${bgClass}
                    ${big ? 'px-8 py-4 text-xl h-36 flex-col justify-center w-36 rotate-[-2deg]' : 'px-6 py-3 text-lg'}
                `}
            >
                {icon}
                <div className="flex items-center gap-1">
                    {label}
                    {!big && <ChevronUp size={20} strokeWidth={3} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${direction === 'down' ? 'rotate-180' : ''}`} />}
                </div>
            </button>

            {isOpen && (
                <div className={`
                    absolute left-0 ${direction === 'up' ? 'bottom-full mb-4' : 'top-full mt-4'} 
                    w-64 max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black p-3 flex flex-col gap-2 animate-in fade-in zoom-in duration-200 z-50
                `}>
                    {children}
                </div>
            )}
        </div>
    )
}

const DropdownItem: React.FC<{ onClick: () => void, icon: React.ReactNode, label: string, highlight?: boolean, truncate?: boolean, color?: string }> = ({ onClick, icon, label, highlight, truncate, color }) => {
    
    let colorClass = "text-slate-700 bg-white hover:bg-slate-100";
    if (highlight) colorClass = "text-white bg-blue-500 hover:bg-blue-600";
    if (color === 'red') colorClass = "text-white bg-red-500 hover:bg-red-600";
    if (color === 'green') colorClass = "text-white bg-green-500 hover:bg-green-600";
    if (color === 'yellow') colorClass = "text-black bg-yellow-400 hover:bg-yellow-300";
    if (color === 'orange') colorClass = "text-white bg-orange-500 hover:bg-orange-600";

    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-md font-black transition-transform active:scale-95 text-left border-2 border-transparent hover:border-black
                ${colorClass}
            `}
        >
            <div className="shrink-0 drop-shadow-sm">{icon}</div>
            <span className={truncate ? "truncate w-full" : ""}>{label}</span>
        </button>
    )
}