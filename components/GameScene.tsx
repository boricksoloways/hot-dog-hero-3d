import React from 'react';
import { World } from './World';
import { Player } from './Player';
import { Ingredient, useHotDogListener } from './GameObjects';
import { GameState, IngredientType } from '../types';

interface GameSceneProps {
  gameState: GameState;
  setHeldItem: (item: IngredientType | null) => void;
  throwItem: (pos: [number, number, number], vel: [number, number, number]) => void;
  removeIngredient: (id: string) => void;
  addScore: () => void;
  setHovering: (hover: boolean) => void;
  setIsLocked: (locked: boolean) => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  gameState, 
  setHeldItem, 
  throwItem, 
  removeIngredient, 
  addScore,
  setHovering,
  setIsLocked
}) => {
  
  useHotDogListener(() => {
    addScore();
  });

  return (
    <>
      <Player 
        heldItem={gameState.heldItem}
        setHeldItem={setHeldItem}
        throwItem={throwItem}
        setHovering={setHovering}
        setIsLocked={setIsLocked}
      />
      
      <World 
        addScore={addScore}
      />

      {gameState.activeIngredients.map((ing) => (
        <Ingredient
          key={ing.id}
          id={ing.id}
          type={ing.type}
          initialPosition={ing.position}
          initialVelocity={ing.velocity}
          onRemove={removeIngredient}
        />
      ))}
    </>
  );
};