
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { UIOverlay } from './components/UIOverlay';
import { JsonModal } from './components/JsonModal';
import { PromptModal } from './components/PromptModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MainMenu } from './components/MainMenu';
import { LevelIntroModal } from './components/LevelIntroModal';
import { Generators } from './utils/voxelGenerators';
import { GAME_LEVELS } from './utils/levels';
import { AppState, VoxelData, SavedModel, GameMode } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  // Game State
  const [gameMode, setGameMode] = useState<GameMode>('MENU');
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [voxelCount, setVoxelCount] = useState<number>(0);
  
  // Challenge Mode State
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [showLevelIntro, setShowLevelIntro] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);

  // Modals
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonModalMode, setJsonModalMode] = useState<'view' | 'import'>('view');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<'create' | 'morph'>('create');
  
  // UI Helpers
  const [showWelcome, setShowWelcome] = useState(false); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  // Data
  const [currentBaseModel, setCurrentBaseModel] = useState<string>('Monica');
  const [currentModelData, setCurrentModelData] = useState<VoxelData[]>([]);
  const [customBuilds, setCustomBuilds] = useState<SavedModel[]>([]);
  const [customRebuilds, setCustomRebuilds] = useState<SavedModel[]>([]);

  // Minigame States
  const [manualProgress, setManualProgress] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);

  useEffect(() => {
    // 3D engine is only needed for FREE or CHALLENGE modes
    if (gameMode === 'MENU') return;
    if (!containerRef.current) return;

    // Initialize Engine
    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => {
          setAppState(newState);
          if (newState === AppState.STABLE && gameMode === 'CHALLENGE' && engineRef.current) {
               setIsLevelComplete(true);
          }
      },
      (count) => {
          if (engineRef.current && (engineRef.current as any).state === AppState.COLLECTING) {
             setCollectedCount(count);
          } else {
             setVoxelCount(count);
          }
      }
    );
    engineRef.current = engine;

    const initialData = Generators.Monica();
    engine.loadInitialModel(initialData);
    setCurrentModelData(initialData);

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);
    
    const handleInputMove = (e: MouseEvent | TouchEvent) => {
        if (!engineRef.current) return;
        let clientX, clientY;
        if (window.TouchEvent && e instanceof TouchEvent) {
             if (e.touches.length > 0) {
                 clientX = e.touches[0].clientX;
                 clientY = e.touches[0].clientY;
             } else return;
        } else {
             clientX = (e as MouseEvent).clientX;
             clientY = (e as MouseEvent).clientY;
        }
        const x = (clientX / window.innerWidth) * 2 - 1;
        const y = -(clientY / window.innerHeight) * 2 + 1;
        engineRef.current.updateMouse(x, y);
    }

    window.addEventListener('mousemove', handleInputMove);
    window.addEventListener('touchmove', handleInputMove, { passive: false });
    window.addEventListener('touchstart', handleInputMove, { passive: false });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleInputMove);
      window.removeEventListener('touchmove', handleInputMove);
      window.removeEventListener('touchstart', handleInputMove);
      engine.cleanup();
      engineRef.current = null;
    };
  }, [gameMode]); 

  // --- Mode Switching Logic ---

  const handleSelectMode = (mode: GameMode) => {
      setGameMode(mode);
      if (mode === 'CHALLENGE') {
          setCurrentLevelIndex(0);
          setIsLevelComplete(false);
          prepareLevel(0);
      } else if (mode === 'FREE') {
          loadCharacter('Monica');
          setShowWelcome(true);
          setTimeout(() => setShowWelcome(false), 3000);
      }
  };

  const prepareLevel = (index: number) => {
      if (index >= GAME_LEVELS.length) {
          alert("VOCÊ SALVOU A TURMA TODA! FIM DE JOGO!");
          setGameMode('MENU');
          return;
      }
      const level = GAME_LEVELS[index];
      loadCharacter(level.characterKey);
      setIsLevelComplete(false);
      setShowLevelIntro(true);
  };

  const startCurrentLevelGame = () => {
      setShowLevelIntro(false);
      if (engineRef.current) {
          engineRef.current.dismantle();
          setTimeout(() => {
              if (engineRef.current) {
                  setCollectedCount(0);
                  engineRef.current.startCollectionGame(currentModelData);
              }
          }, 600);
      }
  }

  const handleNextLevel = () => {
      setCurrentLevelIndex(prev => prev + 1);
      prepareLevel(currentLevelIndex + 1);
  };

  const loadCharacter = (type: string) => {
      if (Generators[type as keyof typeof Generators] && engineRef.current) {
          const data = Generators[type as keyof typeof Generators]();
          engineRef.current.loadInitialModel(data);
          setCurrentModelData(data);
          setCurrentBaseModel(type);
      } else if (Generators[type as keyof typeof Generators]) {
          // If engine not ready yet, store data for the useEffect
          const data = Generators[type as keyof typeof Generators]();
          setCurrentModelData(data);
          setCurrentBaseModel(type);
      }
  }

  const handleDismantle = () => engineRef.current?.dismantle();
  const handleNewScene = (type: keyof typeof Generators) => loadCharacter(type);
  const handleSelectCustomBuild = (model: SavedModel) => {
      if (engineRef.current) {
          engineRef.current.loadInitialModel(model.data);
          setCurrentModelData(model.data);
          setCurrentBaseModel(model.name);
      }
  };

  const handleRebuild = (type: string, manualMode: boolean = false) => {
    let data: VoxelData[] | null = null;
    if (type === currentBaseModel && currentModelData.length > 0) data = currentModelData;
    else if (Generators[type as keyof typeof Generators]) data = Generators[type as keyof typeof Generators]();
    if (data && engineRef.current) {
      setManualProgress(0);
      engineRef.current.rebuild(data, manualMode);
    }
  };

  const handleStartMagnetGame = () => {
    if (currentModelData.length > 0 && engineRef.current) {
        setCollectedCount(0);
        engineRef.current.startCollectionGame(currentModelData);
    }
  }

  const handleManualProgressClick = () => {
      if (appState !== AppState.MANUAL_REBUILDING) return;
      const step = 4;
      const next = Math.min(100, manualProgress + step);
      setManualProgress(next);
      engineRef.current?.setManualProgress(next);
  };

  const handleShowJson = () => {
    if (engineRef.current) {
      setJsonData(engineRef.current.getJsonData());
      setJsonModalMode('view');
      setIsJsonModalOpen(true);
    }
  };

  const handleJsonImport = (jsonStr: string) => {
      try {
          const rawData = JSON.parse(jsonStr);
          const voxelData: VoxelData[] = rawData.map((v: any) => ({
              x: Number(v.x) || 0,
              y: Number(v.y) || 0,
              z: Number(v.z) || 0,
              color: typeof v.color === 'string' ? parseInt(v.color.replace('#',''), 16) : v.color
          }));
          if (engineRef.current) {
              engineRef.current.loadInitialModel(voxelData);
              setCurrentModelData(voxelData);
              setCurrentBaseModel('Importado');
          }
      } catch (e) { alert("Falha ao importar JSON"); }
  };

  const handlePromptSubmit = async (prompt: string) => {
    setIsGenerating(true);
    setIsPromptModalOpen(false);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-pro-preview';
        const response = await ai.models.generateContent({
            model,
            contents: `Gere um modelo de arte voxel 3D de: "${prompt}". Retorne APENAS um array JSON de objetos {x, y, z, color}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.INTEGER },
                            y: { type: Type.INTEGER },
                            z: { type: Type.INTEGER },
                            color: { type: Type.STRING }
                        },
                        required: ["x", "y", "z", "color"]
                    }
                }
            }
        });
        if (response.text) {
            const voxelData: VoxelData[] = JSON.parse(response.text).map((v: any) => ({
                x: v.x, y: v.y, z: v.z,
                color: parseInt(v.color.replace('#',''), 16)
            }));
            if (engineRef.current) {
                if (promptMode === 'create') {
                    engineRef.current.loadInitialModel(voxelData);
                    setCurrentModelData(voxelData);
                    setCustomBuilds(prev => [...prev, { name: prompt, data: voxelData }]);
                    setCurrentBaseModel(prompt);
                } else {
                    engineRef.current.rebuild(voxelData);
                }
            }
        }
    } catch (err) { alert("Erro na geração IA."); } finally { setIsGenerating(false); }
  };

  return (
    <div className="relative w-full h-full bg-[#87CEEB] overflow-hidden font-sans fixed inset-0 touch-none">
      
      {/* 3D Container */}
      {gameMode !== 'MENU' && (
          <div ref={containerRef} className="absolute inset-0 z-0 cursor-crosshair" />
      )}
      
      {/* Main Menu */}
      {gameMode === 'MENU' && (
          <MainMenu onSelectMode={handleSelectMode} />
      )}

      {/* Game UI */}
      {gameMode !== 'MENU' && (
          <UIOverlay 
            voxelCount={voxelCount}
            appState={appState}
            gameMode={gameMode}
            currentBaseModel={currentBaseModel}
            customBuilds={customBuilds}
            customRebuilds={customRebuilds.filter(r => r.baseModel === currentBaseModel)} 
            isAutoRotate={isAutoRotate}
            isGenerating={isGenerating}
            manualProgress={manualProgress}
            collectedCount={collectedCount}
            onDismantle={handleDismantle}
            onRebuild={handleRebuild}
            onManualRebuildClick={handleManualProgressClick}
            onStartMagnetGame={handleStartMagnetGame}
            onNewScene={handleNewScene}
            onSelectCustomBuild={handleSelectCustomBuild}
            onSelectCustomRebuild={(m) => engineRef.current?.rebuild(m.data)}
            onPromptCreate={() => {setPromptMode('create'); setIsPromptModalOpen(true);}}
            onPromptMorph={() => {setPromptMode('morph'); setIsPromptModalOpen(true);}}
            onShowJson={handleShowJson}
            onImportJson={() => {setJsonModalMode('import'); setIsJsonModalOpen(true);}}
            onToggleRotation={() => {setIsAutoRotate(!isAutoRotate); engineRef.current?.setAutoRotate(!isAutoRotate);}}
            onBackToMenu={() => setGameMode('MENU')}
            onNextLevel={handleNextLevel}
            isLevelComplete={isLevelComplete}
            currentLevel={GAME_LEVELS[currentLevelIndex]}
          />
      )}

      {gameMode === 'CHALLENGE' && showLevelIntro && (
          <LevelIntroModal level={GAME_LEVELS[currentLevelIndex]} onStart={startCurrentLevelGame} />
      )}

      <WelcomeScreen visible={showWelcome && gameMode === 'FREE'} />

      <JsonModal 
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        data={jsonData}
        isImport={jsonModalMode === 'import'}
        onImport={handleJsonImport}
      />

      <PromptModal
        isOpen={isPromptModalOpen}
        mode={promptMode}
        onClose={() => setIsPromptModalOpen(false)}
        onSubmit={handlePromptSubmit}
      />
    </div>
  );
};

export default App;
