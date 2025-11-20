import React from 'react';
import { usePlane, useBox } from '@react-three/cannon';
import { Text } from '@react-three/drei';
import { IngredientType, INGREDIENT_COLORS } from '../types';

const Floor = () => {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], material: { friction: 0.1 } }));
  return (
    <group>
        <mesh ref={ref as any} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <gridHelper args={[50, 50, 0x444444, 0x222222]} position={[0, 0.01, 0]} />
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
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            {[[-1.8, -1.3], [1.8, -1.3], [-1.8, 1.3], [1.8, 1.3]].map((offset, i) => (
                 <mesh key={i} position={[position[0] + offset[0], 0.4, position[2] + offset[1]]} castShadow>
                    <boxGeometry args={[0.2, 0.8, 0.2]} />
                    <meshStandardMaterial color="#3E2723" />
                </mesh>
            ))}
        </group>
    );
};

const Spawner = ({ position, type }: { position: [number, number, number], type: IngredientType }) => {
    // Physics body (Crate)
    const [ref] = useBox(() => ({ type: 'Static', position: [position[0], position[1] + 1.6, position[2]], args: [1.8, 1.2, 1.8] }));
    const isBun = type === IngredientType.BUN;

    return (
        <group 
            ref={ref as any} 
            userData={{ interactable: true, type }}
        >
            {/* Visual Crate */}
            <mesh castShadow>
                <boxGeometry args={[1.8, 1.2, 1.8]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>
            
            {/* Inner dark area */}
            <mesh position={[0, 0.61, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[1.6, 1.6]} />
                <meshStandardMaterial color="#3E2723" />
            </mesh>

            {/* Floating Icon */}
            <group position={[0, 1.0, 0]}>
                {isBun ? (
                   <mesh rotation={[0, 0, Math.PI/4]}>
                       <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
                       <meshStandardMaterial color={INGREDIENT_COLORS[type]} />
                   </mesh>
                ) : (
                    <mesh rotation={[0, 0, Math.PI/4]}>
                        <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
                        <meshStandardMaterial color={INGREDIENT_COLORS[type]} />
                    </mesh>
                )}
            </group>

            {/* HITBOX FIX: Massive invisible box that extends towards player and slightly up */}
            <mesh position={[0, 1.0, 1.0]}>
                <boxGeometry args={[3.5, 4.5, 3.5]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <Text 
                position={[0, 1.8, 0]} 
                fontSize={0.5} 
                color="white"
                anchorX="center" 
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#000"
            >
                {type}
            </Text>
        </group>
    )
};

const AssemblyPlate = ({ position, addScore }: { position: [number, number, number], addScore: () => void }) => {
    const plateY = position[1] + 1.0; 
    return (
        <group>
            <mesh position={[position[0], plateY + 0.05, position[2]]} receiveShadow>
                <cylinderGeometry args={[1.4, 1.0, 0.1, 32]} />
                <meshStandardMaterial color="#ECEFF1" roughness={0.2} />
            </mesh>
            <mesh position={[position[0], plateY, position[2]]} receiveShadow>
                <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
                <meshStandardMaterial color="#CFD8DC" />
            </mesh>
             <Text 
                position={[position[0], plateY + 2.0, position[2]]} 
                fontSize={0.5} 
                color="#4ADE80"
                anchorX="center" 
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor="#000"
            >
                THROW HERE!
            </Text>
        </group>
    );
}

export const World = ({ addScore }: { addScore: () => void }) => {
  return (
    <>
      <Floor />
      
      <Table position={[-5, 0, -4]} />
      <Spawner position={[-5, 0, -4]} type={IngredientType.BUN} />

      <Table position={[5, 0, -4]} />
      <Spawner position={[5, 0, -4]} type={IngredientType.SAUSAGE} />

      <Table position={[0, 0, -10]} color="#263238" />
      <AssemblyPlate position={[0, 0, -10]} addScore={addScore} />
    </>
  );
};