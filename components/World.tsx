import React from 'react';
import { usePlane, useBox } from '@react-three/cannon';
import { Text, Float, useTexture } from '@react-three/drei';
import { IngredientType, INGREDIENT_COLORS, PlateState } from '../types';
import * as THREE from 'three';

const Floor = () => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], material: { friction: 0.1 } }));
  
  // Simple grid pattern
  return (
    <group>
        <mesh ref={ref as any} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#202020" roughness={0.8} />
        </mesh>
        <gridHelper args={[100, 50, 0x666666, 0x333333]} position={[0, 0.01, 0]} />
    </group>
  );
};

const Table = ({ position, color = "#8B4513" }: { position: [number, number, number], color?: string }) => {
    // Table surface at Y=1.0
    const [ref] = useBox(() => ({ type: 'Static', position: [position[0], position[1] + 0.9, position[2]], args: [4, 0.2, 3] }));
    
    return (
        <group>
            <mesh ref={ref as any} castShadow receiveShadow>
                <boxGeometry args={[4, 0.2, 3]} />
                <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
            {/* Checkered Cloth effect on top */}
            <mesh position={[position[0], position[1] + 1.01, position[2]]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                <planeGeometry args={[3.8, 2.8]} />
                <meshStandardMaterial color="white" />
            </mesh>
             {/* Legs */}
            {[[-1.8, -1.3], [1.8, -1.3], [-1.8, 1.3], [1.8, 1.3]].map((offset, i) => (
                 <mesh key={i} position={[position[0] + offset[0], 0.4, position[2] + offset[1]]} castShadow>
                    <boxGeometry args={[0.2, 0.9, 0.2]} />
                    <meshStandardMaterial color="#3E2723" />
                </mesh>
            ))}
        </group>
    );
};

const Spawner = ({ position, type, isNext }: { position: [number, number, number], type: IngredientType, isNext: boolean }) => {
    // Physics body (Crate)
    const [ref] = useBox(() => ({ type: 'Static', position: [position[0], position[1] + 1.6, position[2]], args: [1.8, 1.2, 1.8] }));
    const isBun = type === IngredientType.BUN;

    return (
        <group 
            ref={ref as any} 
            userData={{ interactable: true, type, isSpawner: true }}
        >
            {/* Highlight Indicator */}
            {isNext && (
                <Float speed={4} rotationIntensity={0} floatIntensity={0.5}>
                    <group position={[0, 2.2, 0]}>
                        <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
                            <coneGeometry args={[0.3, 0.6, 4]} />
                            <meshStandardMaterial color="#FCD34D" emissive="#FCD34D" emissiveIntensity={1} />
                        </mesh>
                    </group>
                </Float>
            )}

            {/* Light Glow if Active */}
            {isNext && <pointLight position={[0, 1, 0]} intensity={1.5} distance={4} color={INGREDIENT_COLORS[type]} decay={2} />}

            {/* Visual Crate */}
            <mesh castShadow>
                <boxGeometry args={[1.8, 1.2, 1.8]} />
                <meshStandardMaterial color="#795548" />
            </mesh>
            
            {/* Inner dark area */}
            <mesh position={[0, 0.61, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[1.6, 1.6]} />
                <meshStandardMaterial color="#3E2723" />
            </mesh>

            {/* Floating Icon */}
            <group position={[0, 0.9, 0]}>
                {isBun ? (
                   <mesh rotation={[0, 0, 0]}>
                       <boxGeometry args={[0.8, 0.4, 0.5]} />
                       <meshStandardMaterial 
                            color={INGREDIENT_COLORS[type]} 
                            emissive={isNext ? INGREDIENT_COLORS[type] : 'black'} 
                            emissiveIntensity={isNext ? 0.3 : 0}
                        />
                   </mesh>
                ) : (
                    <mesh rotation={[Math.PI/2, 0, Math.PI/4]}>
                        <capsuleGeometry args={[0.15, 0.8, 8, 16]} />
                         <meshStandardMaterial 
                            color={INGREDIENT_COLORS[type]} 
                            emissive={isNext ? INGREDIENT_COLORS[type] : 'black'} 
                            emissiveIntensity={isNext ? 0.3 : 0}
                        />
                    </mesh>
                )}
            </group>

            {/* Interaction Hitbox (Larger than visual) */}
            <mesh position={[0, 0.5, 1.0]}>
                <boxGeometry args={[2.5, 3.5, 2.5]} />
                <meshBasicMaterial visible={false} />
            </mesh>

            <Text 
                position={[0, 1.5, 1.0]} 
                fontSize={0.4} 
                color="white"
                anchorX="center" 
                anchorY="bottom"
                outlineWidth={0.04}
                outlineColor="#000"
            >
                {type}
            </Text>
        </group>
    )
};

interface AssemblyPlateProps {
    position: [number, number, number];
    plateState: PlateState;
    nextNeededIngredient: IngredientType | null;
    heldItem: IngredientType | null;
}

const AssemblyPlate = ({ position, plateState, nextNeededIngredient, heldItem }: AssemblyPlateProps) => {
    const plateY = position[1] + 1.0; 
    
    // Check if player is holding what we need
    const isHoldingCorrectItem = heldItem && heldItem === nextNeededIngredient;

    return (
        <group>
            {/* Zone Highlight */}
            {isHoldingCorrectItem && (
                <group position={[position[0], plateY + 1.5, position[2]]}>
                    <Float speed={5} floatIntensity={0.2}>
                         <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
                            <coneGeometry args={[0.4, 0.8, 4]} />
                            <meshStandardMaterial color="#4ADE80" emissive="#4ADE80" emissiveIntensity={1} />
                        </mesh>
                    </Float>
                    {/* Guide Beam */}
                    <mesh position={[0, -0.75, 0]}>
                         <cylinderGeometry args={[1.4, 1.4, 1.5, 32, 1, true]} />
                         <meshBasicMaterial color="#4ADE80" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
                    </mesh>
                </group>
            )}

            {/* The Plate */}
            <mesh position={[position[0], plateY + 0.05, position[2]]} receiveShadow>
                <cylinderGeometry args={[1.4, 1.0, 0.1, 32]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
            </mesh>
            {/* Plate Rim */}
            <mesh position={[position[0], plateY + 0.08, position[2]]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                <ringGeometry args={[1.3, 1.4, 32]} />
                <meshStandardMaterial color="#EEE" side={THREE.DoubleSide} />
            </mesh>

            {/* Static Plated Bun */}
            {plateState.hasBun && (
                <group position={[position[0], plateY + 0.3, position[2]]} rotation={[0, Math.PI/2, 0]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.8, 0.35, 2.0]} />
                        <meshStandardMaterial color={INGREDIENT_COLORS[IngredientType.BUN]} />
                    </mesh>
                    {/* Indent for sausage */}
                    <mesh position={[0, 0.18, 0]}>
                        <boxGeometry args={[0.4, 0.1, 2.0]} />
                        <meshStandardMaterial color="#C9A473" />
                    </mesh>
                </group>
            )}

            {/* Static Plated Sausage */}
            {plateState.hasSausage && (
                <mesh position={[position[0], plateY + 0.5, position[2]]} rotation={[Math.PI/2, 0, Math.PI/2]} castShadow>
                     <capsuleGeometry args={[0.18, 2.1, 8, 16]} />
                     <meshStandardMaterial color={INGREDIENT_COLORS[IngredientType.SAUSAGE]} />
                </mesh>
            )}
        </group>
    );
}

const FinishedHotDog = ({ position, index }: { position: [number, number, number], index: number }) => {
    // Add some random rotation for natural look
    const seed = index * 123.45;
    const rotationY = (seed % 0.5) - 0.25;

    return (
        <group position={[position[0], position[1], position[2]]} rotation={[0, Math.PI/2 + rotationY, 0]}>
            {/* Bun */}
            <mesh castShadow>
                <boxGeometry args={[0.8, 0.35, 2.0]} />
                <meshStandardMaterial color={INGREDIENT_COLORS[IngredientType.BUN]} />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
                <boxGeometry args={[0.4, 0.1, 2.0]} />
                <meshStandardMaterial color="#C9A473" />
            </mesh>
            {/* Sausage */}
            <mesh position={[0, 0.2, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
                <capsuleGeometry args={[0.18, 2.1, 8, 16]} />
                <meshStandardMaterial color={INGREDIENT_COLORS[IngredientType.SAUSAGE]} />
            </mesh>
        </group>
    );
};

const ServingTray = ({ position, completedCount }: { position: [number, number, number], completedCount: number }) => {
    const trayY = position[1] + 1.0;

    return (
        <group>
            {/* The Board */}
            <mesh position={[position[0], trayY, position[2]]} receiveShadow castShadow>
                <boxGeometry args={[3.5, 0.1, 5]} />
                <meshStandardMaterial color="#8D6E63" roughness={0.9} />
            </mesh>
            
            {/* Text */}
            <Text 
                position={[position[0], trayY + 0.1, position[2] + 2]} 
                fontSize={0.3} 
                color="white"
                rotation={[-Math.PI/2, 0, 0]}
                anchorX="center" 
                anchorY="middle"
            >
                FINISHED ORDERS
            </Text>

            {/* Render Completed Dogs */}
            {Array.from({ length: completedCount }).map((_, i) => {
                // Arrange in 2 columns
                const col = i % 2;
                const row = Math.floor(i / 2);
                const xOffset = col === 0 ? -0.8 : 0.8;
                const zOffset = -1.5 + (row * 1.2);
                
                return (
                    <FinishedHotDog 
                        key={i} 
                        index={i}
                        position={[position[0] + xOffset, trayY + 0.2, position[2] + zOffset]} 
                    />
                );
            })}
        </group>
    );
};

interface WorldProps {
    plateState: PlateState;
    nextNeededIngredient: IngredientType | null;
    heldItem: IngredientType | null;
    completedCount: number;
}

export const World = ({ plateState, nextNeededIngredient, heldItem, completedCount }: WorldProps) => {
  return (
    <>
      <Floor />
      
      {/* Bun Station */}
      <Table position={[-5, 0, -4]} color="#5D4037" />
      <Spawner 
        position={[-5, 0, -4]} 
        type={IngredientType.BUN} 
        isNext={nextNeededIngredient === IngredientType.BUN && heldItem !== IngredientType.BUN}
      />

      {/* Sausage Station */}
      <Table position={[5, 0, -4]} color="#5D4037" />
      <Spawner 
        position={[5, 0, -4]} 
        type={IngredientType.SAUSAGE} 
        isNext={nextNeededIngredient === IngredientType.SAUSAGE && heldItem !== IngredientType.SAUSAGE}
      />

      {/* Main Assembly Table */}
      <Table position={[0, 0, -10]} color="#37474F" />
      <AssemblyPlate 
        position={[0, 0, -10]} 
        plateState={plateState} 
        nextNeededIngredient={nextNeededIngredient}
        heldItem={heldItem}
      />

      {/* Serving Tray (To the right of assembly) */}
      <Table position={[4, 0, -10]} color="#5D4037" />
      <ServingTray 
         position={[4, 0, -10]} 
         completedCount={completedCount}
      />
      
      {/* Instructions on Wall */}
      <Text 
        position={[0, 5, -15]} 
        fontSize={1.5} 
        color="white"
        anchorX="center" 
        anchorY="middle"
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
      >
        HOT DOG HERO
      </Text>
    </>
  );
};