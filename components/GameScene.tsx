import React from 'react';
import { World } from './World';
import { Player } from './Player';
import { Ingredient } from './GameObjects';
import { GameState, IngredientType } from '../types';

interface GameSceneProps {
  gameState: GameState;
  pickUpItem: (type: IngredientType, id?: string) => void;
  throwItem: (pos: [number, number, number], vel: [number, number, number]) => void;
  removeIngredient: (id: string) => void;
  handleLandOnPlate: (type: IngredientType) => boolean;
  setHovering: (hover: boolean) => void;
  setIsLocked: (locked: boolean) => void;
  nextNeededIngredient: IngredientType | null;
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  gameState, 
  pickUpItem, 
  throwItem, 
  removeIngredient, 
  handleLandOnPlate,
  setHovering,
  setIsLocked,
  nextNeededIngredient
}) => {
  
  return (
    <>
      <Player 
        heldItem={gameState.heldItem}
        pickUpItem={pickUpItem}
        throwItem={throwItem}
        setHovering={setHovering}
        setIsLocked={setIsLocked}
      />
      
      <World 
        plateState={gameState.plate}
        nextNeededIngredient={nextNeededIngredient}
        heldItem={gameState.heldItem}
        completedCount={gameState.completedCount}
      />

      {gameState.activeIngredients.map((ing) => (
        <Ingredient
          key={ing.id}
          id={ing.id}
          type={ing.type}
          initialPosition={ing.position}
          initialVelocity={ing.velocity}
          onRemove={removeIngredient}
          onLandOnPlate={handleLandOnPlate}
        />
      ))}
    </>
  );
};