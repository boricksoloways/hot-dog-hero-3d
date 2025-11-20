import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import { GameScene } from './components/GameScene';
import { IngredientType, GameState } from './types';
import { Utensils, Target, MousePointer2 } from 'lucide-react';

export default function App() {
  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    heldItem: null,
    activeIngredients: [],
    lastMessage: "Welcome! Make Hot Dogs!"
  });

  // Interaction State
  const [isHovering, setIsHovering] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // --- Actions ---
  const setHeldItem = useCallback((item: IngredientType | null) => {
    setGameState(prev => ({ 
      ...prev, 
      heldItem: item,
      lastMessage: item ? `Picked up ${item}` : prev.lastMessage 
    }));
  }, []);

  const addScore = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + 1,
      lastMessage: "HOT DOG ASSEMBLED! +100 Points"
    }));
  }, []);

  const throwItem = useCallback((position: [number, number, number], velocity: [number, number, number]) => {
    setGameState(prev => {
      if (!prev.heldItem) return prev;
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
    <div className="relative w-full h-full bg-gray-900 select-none">
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-xl">
            <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <Utensils className="w-6 h-6" /> Hot Dog Hero
            </h1>
            <p className="text-gray-300 mt-1">Score: <span className="text-3xl font-mono font-bold text-white">{gameState.score}</span></p>
          </div>

          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white w-64 text-center shadow-xl">
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Current Status</h2>
            <div key={gameState.lastMessage} className="text-xl font-bold text-blue-300 animate-pulse">
              {gameState.lastMessage}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all ${gameState.heldItem ? 'border-yellow-400 bg-yellow-400/20' : 'border-gray-600 bg-gray-800'}`}>
                {gameState.heldItem === IngredientType.BUN && <div className="w-10 h-6 bg-yellow-300 rounded-full shadow-lg" />}
                {gameState.heldItem === IngredientType.SAUSAGE && <div className="w-12 h-3 bg-red-500 rounded-full shadow-lg rotate-45" />}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Holding</p>
                <p className="text-lg font-bold">{gameState.heldItem || "Empty Handed"}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white text-sm shadow-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> <span>{isLocked ? "Left Click to Throw" : "Click Game to Lock"}</span></div>
              <div className="flex items-center gap-2"><Target className="w-4 h-4" /> <span>Aim at Tables / Plate</span></div>
              <div className="opacity-50 text-xs mt-2">WASD to Move • Space to Jump</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Crosshair - Only visible when Locked */}
      {isLocked && (
        <>
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none transition-all duration-100 ease-out
              ${isHovering ? 'w-8 h-8 border-2 border-green-400 bg-green-400/30' : 'w-2 h-2 bg-white border border-black'}
              rounded-full
            `} 
          />
          {isHovering && (
            <div className="absolute top-[53%] left-1/2 -translate-x-1/2 text-green-400 font-bold text-sm tracking-widest shadow-black drop-shadow-md z-50 pointer-events-none">
              GRAB
            </div>
          )}
        </>
      )}

      {/* 3D Scene */}
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows camera={{ fov: 80 }}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 15, 10]} castShadow intensity={0.8} />
          <pointLight position={[-10, 5, -5]} intensity={0.5} color="#ffd700" />
          
          <Physics gravity={[0, -20, 0]}>
            <GameScene 
              gameState={gameState}
              setHeldItem={setHeldItem}
              throwItem={throwItem}
              removeIngredient={removeIngredient}
              addScore={addScore}
              setHovering={setIsHovering}
              setIsLocked={setIsLocked}
            />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}