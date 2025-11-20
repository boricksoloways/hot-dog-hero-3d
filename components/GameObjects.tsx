import React, { useState } from 'react';
import { useBox, useCylinder } from '@react-three/cannon';
import { IngredientType, INGREDIENT_COLORS } from '../types';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const plateState = {
    hasBun: false,
    hasSausage: false,
    reset: () => {
        plateState.hasBun = false;
        plateState.hasSausage = false;
    }
};

interface IngredientProps {
  id: string;
  type: IngredientType;
  initialPosition: [number, number, number];
  initialVelocity: [number, number, number];
  onRemove: (id: string) => void;
}

export const Ingredient: React.FC<IngredientProps> = ({ 
    id, type, initialPosition, initialVelocity, onRemove 
}) => {
    const [isDead, setIsDead] = useState(false);

    const isBun = type === IngredientType.BUN;
    
    // Physics Body
    const [ref, api] = isBun 
        ? useBox(() => ({ 
            mass: 1, 
            position: initialPosition, 
            velocity: initialVelocity,
            args: [0.7, 0.3, 0.4], 
            rotation: [Math.random(), Math.random(), Math.random()],
          }))
        : useCylinder(() => ({
            mass: 0.8,
            position: initialPosition,
            velocity: initialVelocity,
            args: [0.1, 0.1, 0.6, 8], 
            rotation: [Math.PI/2, 0, 0],
            angularDamping: 0.1, 
          }));

    useFrame(() => {
        if (!ref.current || isDead) return;
        
        const pos = ref.current.position;
        
        if (pos.y < -10) {
            onRemove(id);
            return;
        }

        // Plate Check
        const platePos = new THREE.Vector3(0, 1.8, -10);
        const dist = pos.distanceTo(platePos);
        
        if (dist < 2.5) {
            api.velocity.set(0,0,0);
            api.angularVelocity.set(0,0,0);

            if (type === IngredientType.BUN && !plateState.hasBun) {
                plateState.hasBun = true;
            } else if (type === IngredientType.SAUSAGE && !plateState.hasSausage) {
                plateState.hasSausage = true;
            }

            if (plateState.hasBun && plateState.hasSausage) {
                window.dispatchEvent(new CustomEvent('hotdog-made'));
                plateState.reset();
                onRemove(id); 
            }
        }
    });

    return (
        // ADDED: userData interactable: true so you can pick these up off the floor
        <group ref={ref as any} userData={{ interactable: true, type }}>
            {isBun ? (
                <mesh castShadow receiveShadow>
                    <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
                    <meshStandardMaterial color={INGREDIENT_COLORS[type]} roughness={0.8} />
                    <group scale={[1, 0.7, 1]}>
                    </group>
                </mesh>
            ) : (
                <mesh castShadow receiveShadow>
                    <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
                    <meshStandardMaterial color={INGREDIENT_COLORS[type]} roughness={0.3} metalness={0.1} />
                </mesh>
            )}
        </group>
    );
};

export const useHotDogListener = (callback: () => void) => {
    React.useEffect(() => {
        const handler = () => callback();
        window.addEventListener('hotdog-made', handler);
        return () => window.removeEventListener('hotdog-made', handler);
    }, [callback]);
};