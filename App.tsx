import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { GameScene } from './components/GameScene';
import { IngredientType, GameState } from './types';
import { Utensils, MousePointer2, CheckCircle2, Trophy, RotateCcw } from 'lucide-react';

const TARGET_HOTDOGS = 5;

export default function App() {
  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    heldItem: null,
    activeIngredients: [],
    plate: { hasBun: false, hasSausage: false },
    lastMessage: "Welcome! Make 5 Hot Dogs!",
    completedCount: 0,
    gameWon: false
  });

  // Interaction State
  const [isHovering, setIsHovering] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // --- Logic: What do we need next? ---
  const nextIngredient = !gameState.plate.hasBun 
    ? IngredientType.BUN 
    : (!gameState.plate.hasSausage ? IngredientType.SAUSAGE : null);

  const instructions = gameState.gameWon 
    ? "You are the Hot Dog Hero!" 
    : (nextIngredient 
      ? (gameState.heldItem === nextIngredient ? "Throw it on the plate!" : `Go pick up a ${nextIngredient}`)
      : "Hot Dog Complete!");

  // --- Actions ---
  const resetGame = () => {
    setGameState({
      score: 0,
      heldItem: null,
      activeIngredients: [],
      plate: { hasBun: false, hasSausage: false },
      lastMessage: "New Shift Started!",
      completedCount: 0,
      gameWon: false
    });
    // Request pointer lock again if user clicks visually
    const canvas = document.querySelector('canvas');
    canvas?.requestPointerLock();
  };

  const pickUpItem = useCallback((type: IngredientType, id?: string) => {
    setGameState(prev => {
      if (prev.gameWon) return prev;

      const newIngredients = id 
        ? prev.activeIngredients.filter(i => i.id !== id)
        : prev.activeIngredients;

      return { 
        ...prev, 
        heldItem: type,
        activeIngredients: newIngredients,
        lastMessage: `Picked up ${type}` 
      };
    });
  }, []);

  const throwItem = useCallback((position: [number, number, number], velocity: [number, number, number]) => {
    setGameState(prev => {
      if (!prev.heldItem || prev.gameWon) return prev;
      const newIng = {
        id: Math.random().toString(36).substr(2, 9),
        type: prev.heldItem,
        position,
        velocity
      };
      return {
        ...prev,
        heldItem: null,
        activeIngredients: [...prev.activeIngredients, newIng],
        lastMessage: "Yeet!"
      };
    });
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setGameState(prev => ({
      ...prev,
      activeIngredients: prev.activeIngredients.filter(i => i.id !== id)
    }));
  }, []);

  const handleLandOnPlate = useCallback((type: IngredientType) => {
    let success = false;
    
    setGameState(prev => {
      if (prev.gameWon) return prev;

      const { hasBun, hasSausage } = prev.plate;
      
      // 1. REJECT: Duplicate Bun
      if (type === IngredientType.BUN && hasBun) {
        return { ...prev, lastMessage: "Already have a Bun! Get the Sausage!" };
      }

      // 2. REJECT: Sausage before Bun
      if (type === IngredientType.SAUSAGE && !hasBun) {
         return { ...prev, lastMessage: "Need a Bun first!" };
      }

      // 3. ACCEPT: Bun
      if (type === IngredientType.BUN && !hasBun) {
        success = true;
        return {
          ...prev,
          plate: { ...prev.plate, hasBun: true },
          lastMessage: "Bun Plated! Now get the Sausage!"
        };
      }
      
      // 4. ACCEPT: Sausage (Completion)
      if (type === IngredientType.SAUSAGE && !hasSausage && hasBun) {
        success = true;
        const newCount = prev.completedCount + 1;
        const isWin = newCount >= TARGET_HOTDOGS;

        return {
          ...prev,
          score: prev.score + 100 + (isWin ? 500 : 0),
          plate: { hasBun: false, hasSausage: false },
          completedCount: newCount,
          gameWon: isWin,
          lastMessage: isWin ? "MISSION COMPLETE!" : `Hot Dog #${newCount} Done!`
        };
      }

      return prev;
    });
    
    return success;
  }, []);

  // Keyboard map
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'interact', keys: ['e', 'E'] }, 
  ];

  return (
    <div className="relative w-full h-full bg-gray-900 select-none font-sans">
      
      {/* WIN SCREEN OVERLAY */}
      {gameState.gameWon && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-yellow-400 p-10 rounded-3xl text-center shadow-2xl max-w-md transform animate-in fade-in zoom-in duration-300">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h2 className="text-5xl font-black text-white mb-2 uppercase italic transform -skew-x-12">Victory!</h2>
            <p className="text-gray-300 mb-8 text-lg">You served {TARGET_HOTDOGS} delicious hot dogs.</p>
            
            <div className="bg-black/50 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-400 uppercase font-bold tracking-widest">Final Score</p>
              <p className="text-4xl font-mono font-bold text-green-400">{gameState.score}</p>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 px-8 rounded-xl text-xl flex items-center justify-center gap-3 w-full transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-6 h-6" />
              Cook Again
            </button>
          </div>
        </div>
      )}

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
        
        {/* Top Header */}
        <div className="flex justify-between items-start">
          
          {/* Score Board */}
          <div className="bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white shadow-2xl flex flex-col gap-1 min-w-[200px]">
            <h1 className="text-xl font-bold text-yellow-400 flex items-center gap-2 uppercase tracking-wider">
              <Utensils className="w-5 h-5" /> Hot Dog Hero
            </h1>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-400 uppercase font-bold">Score</span>
              <span className="text-4xl font-mono font-bold text-white">{gameState.score}</span>
            </div>
            <div className="mt-2 bg-white/10 rounded-lg p-2 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300">PROGRESS</span>
                <span className="text-lg font-bold font-mono text-yellow-400">{gameState.completedCount} / {TARGET_HOTDOGS}</span>
            </div>
          </div>

          {/* Recipe / Objectives Card */}
          {!gameState.gameWon && (
            <div className="bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white shadow-2xl min-w-[280px]">
              <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
                <h2 className="text-sm uppercase tracking-wider text-gray-300 font-bold">Current Order</h2>
                <span className="text-xs text-yellow-400 font-mono">#{gameState.completedCount + 1}</span>
              </div>
              
              <div className="space-y-3">
                {/* Bun Step */}
                <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${gameState.plate.hasBun ? 'bg-green-500/20 border border-green-500/30' : (nextIngredient === IngredientType.BUN ? 'bg-yellow-500/10 border border-yellow-500/50 animate-pulse' : 'opacity-50')}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${gameState.plate.hasBun ? 'bg-green-500' : 'border-2 border-gray-500'}`}>
                      {gameState.plate.hasBun ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="text-xs font-bold">1</span>}
                    </div>
                    <span className="font-bold">Bun</span>
                  </div>
                  {gameState.heldItem === IngredientType.BUN && !gameState.plate.hasBun && <span className="text-xs text-yellow-300 bg-yellow-900/50 px-2 py-1 rounded">HOLDING</span>}
                </div>

                {/* Sausage Step */}
                <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${gameState.plate.hasSausage ? 'bg-green-500/20 border border-green-500/30' : (nextIngredient === IngredientType.SAUSAGE ? 'bg-yellow-500/10 border border-yellow-500/50 animate-pulse' : 'opacity-50')}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${gameState.plate.hasSausage ? 'bg-green-500' : 'border-2 border-gray-500'}`}>
                      {gameState.plate.hasSausage ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="text-xs font-bold">2</span>}
                    </div>
                    <span className="font-bold">Sausage</span>
                  </div>
                  {gameState.heldItem === IngredientType.SAUSAGE && !gameState.plate.hasSausage && <span className="text-xs text-yellow-300 bg-yellow-900/50 px-2 py-1 rounded">HOLDING</span>}
                </div>
              </div>

              <div className="mt-3 text-center bg-white/5 rounded p-2">
                <p className="text-sm font-bold text-blue-300">{instructions}</p>
              </div>
            </div>
          )}
        </div>

        {/* Central Notification (Big Events) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-center w-full px-10">
            <h2 key={gameState.lastMessage} className="text-3xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] stroke-black animate-bounce">
                {gameState.lastMessage}
            </h2>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          {/* Held Item Status */}
          <div className="bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white shadow-xl flex items-center gap-5">
            <div className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-all ${gameState.heldItem ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'border-gray-600 bg-gray-800/50'}`}>
              {gameState.heldItem === IngredientType.BUN && <div className="w-14 h-8 bg-yellow-300 rounded-full shadow-lg border border-yellow-600" />}
              {gameState.heldItem === IngredientType.SAUSAGE && <div className="w-14 h-4 bg-red-500 rounded-full shadow-lg rotate-45 border border-red-700" />}
              {!gameState.heldItem && <div className="text-gray-500 text-xs font-bold">EMPTY</div>}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Hands</p>
              <p className="text-xl font-bold leading-none tracking-tight">{gameState.heldItem || "Empty"}</p>
              <p className="text-[10px] text-gray-500 mt-1">{gameState.heldItem ? "Click to Throw" : "Click Item to Pickup"}</p>
            </div>
          </div>

          {/* Controls Hint */}
          <div className="bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white text-sm shadow-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <MousePointer2 className={`w-4 h-4 ${isLocked ? "text-green-400" : "text-red-400"}`} /> 
                <span className="font-medium">{isLocked ? "GAME ACTIVE" : "CLICK TO START"}</span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="opacity-60 text-xs space-y-1 font-mono">
                <p>[W,A,S,D] Move</p>
                <p>[Space] Jump</p>
                <p>[Left Click] Grab / Throw</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Crosshair */}
      {isLocked && (
        <>
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none transition-all duration-200 ease-out
              ${isHovering ? 'w-8 h-8 border-2 border-yellow-400 scale-125 bg-yellow-400/20' : 'w-2 h-2 bg-white/90 shadow-[0_0_4px_black]'}
              rounded-full flex items-center justify-center
            `} 
          >
             {isHovering && <div className="w-1 h-1 bg-yellow-400 rounded-full" />}
          </div>
          {isHovering && (
            <div className="absolute top-[53%] left-1/2 -translate-x-1/2 text-yellow-400 font-black text-[10px] tracking-[0.2em] drop-shadow-md z-50 pointer-events-none">
              GRAB
            </div>
          )}
        </>
      )}

      {/* 3D Scene */}
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows camera={{ fov: 80 }} dpr={[1, 2]}>
          <Sky sunPosition={[100, 20, 100]} turbidity={0.8} rayleigh={0.3} mieCoefficient={0.005} mieDirectionalG={0.8} />
          <ambientLight intensity={0.7} />
          <directionalLight 
            position={[20, 30, 10]} 
            castShadow 
            intensity={1.5} 
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          
          <Physics gravity={[0, -25, 0]}>
            <GameScene 
              gameState={gameState}
              pickUpItem={pickUpItem}
              throwItem={throwItem}
              removeIngredient={removeIngredient}
              handleLandOnPlate={handleLandOnPlate}
              setHovering={setIsHovering}
              setIsLocked={setIsLocked}
              nextNeededIngredient={nextIngredient}
            />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}