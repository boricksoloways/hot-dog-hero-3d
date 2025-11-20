/// <reference lib="dom" />
import React, { useState, useRef, useEffect } from 'react';
import { useBox, useCylinder } from '@react-three/cannon';
import { IngredientType, INGREDIENT_COLORS } from '../types';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IngredientProps {
  id: string;
  type: IngredientType;
  initialPosition: [number, number, number];
  initialVelocity: [number, number, number];
  onRemove: (id: string) => void;
  onLandOnPlate: (type: IngredientType) => boolean;
}

export const Ingredient: React.FC<IngredientProps> = ({ 
    id, type, initialPosition, initialVelocity, onRemove, onLandOnPlate 
}) => {
    const [isDead, setIsDead] = useState(false);
    const cooldown = useRef(0); // Debounce plate checks

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

    // Cleanup timer (15 seconds)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsDead(true);
            onRemove(id);
        }, 15000);
        return () => clearTimeout(timer);
    }, [id, onRemove]);

    useFrame((_, delta) => {
        if (!ref.current || isDead) return;
        
        if (cooldown.current > 0) cooldown.current -= delta;

        const pos = ref.current.position;
        
        // Fall off map cleanup
        if (pos.y < -10) {
            setIsDead(true);
            onRemove(id);
            return;
        }

        // Plate Interaction Zone
        // Using a slightly larger radius for better feel
        const platePos = new THREE.Vector3(0, 1.0, -10);
        // Ignore height difference if above plate, focusing on X/Z plane primarily for detection
        // but let's do simple 3D distance for now
        const dist = pos.distanceTo(platePos);
        
        if (dist < 2.0 && cooldown.current <= 0) {
            // Attempt to plate it
            const accepted = onLandOnPlate(type);
            
            if (accepted) {
                setIsDead(true);
                onRemove(id);
            } else {
                // REJECTED! Eject the item so it doesn't get stuck.
                // Apply a random upward/outward force
                const angle = Math.random() * Math.PI * 2;
                const force = 10;
                api.velocity.set(
                    Math.sin(angle) * force, 
                    10, // Upward pop
                    Math.cos(angle) * force
                );
                api.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
                
                // Set cooldown so we don't spam the rejection message/force
                cooldown.current = 1.0;
            }
        }
    });

    return (
        // userData interactable: true with ID allows picking this specific item up
        <group ref={ref as any} userData={{ interactable: true, type, id }}>
            {isBun ? (
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.7, 0.3, 0.4]} />
                    <meshStandardMaterial color={INGREDIENT_COLORS[type]} roughness={0.8} />
                    {/* Detail: Split in bun */}
                    <mesh position={[0, 0.1, 0]} scale={[0.9, 0.1, 0.8]}>
                        <boxGeometry args={[0.7, 0.1, 0.1]} />
                        <meshStandardMaterial color="#D4B483" />
                    </mesh>
                </mesh>
            ) : (
                <mesh castShadow receiveShadow rotation={[Math.PI/2, 0, 0]}>
                    <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
                    <meshStandardMaterial color={INGREDIENT_COLORS[type]} roughness={0.3} metalness={0.1} />
                </mesh>
            )}
        </group>
    );
};