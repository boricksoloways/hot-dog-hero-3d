/// <reference lib="dom" />
import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { IngredientType } from '../types';

interface PlayerProps {
  heldItem: IngredientType | null;
  pickUpItem: (type: IngredientType, id?: string) => void;
  throwItem: (pos: [number, number, number], vel: [number, number, number]) => void;
  setHovering: (hover: boolean) => void;
  setIsLocked: (locked: boolean) => void;
}

const SPEED = 6;
const JUMP_FORCE = 6;
const THROW_FORCE = 18;
const INTERACTION_DISTANCE = 20; 

interface InteractableData {
    type: IngredientType;
    id?: string; // Only present for dynamic items
    isSpawner?: boolean;
}

// Helper to find interactable ancestor
function getInteractableObject(object: THREE.Object3D): InteractableData | null {
  let curr: THREE.Object3D | null = object;
  while (curr) {
    if (curr.userData && curr.userData.interactable) {
      return { 
          type: curr.userData.type,
          id: curr.userData.id,
          isSpawner: curr.userData.isSpawner
      };
    }
    curr = curr.parent;
  }
  return null;
}

export const Player: React.FC<PlayerProps> = ({ heldItem, pickUpItem, throwItem, setHovering, setIsLocked }) => {
  const { camera, raycaster, scene } = useThree();
  
  // This Ref holds the object currently under the crosshair/mouse.
  const focusedItemRef = useRef<InteractableData | null>(null);
  
  // Physics Body
  const [ref, api] = useSphere(() => ({ 
    mass: 60, 
    type: 'Dynamic', 
    position: [0, 2, 10], 
    args: [0.6], 
    fixedRotation: true,
    linearDamping: 0.95, 
    material: { friction: 0.0, restitution: 0 } 
  }));
  
  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

  const pos = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);

  const [, getKeys] = useKeyboardControls();

  useFrame((state) => {
    if (!ref.current) return;

    // 1. Camera Sync
    camera.position.copy(new THREE.Vector3(pos.current[0], pos.current[1] + 1.7, pos.current[2]));

    // 2. Movement Logic
    const { forward, backward, left, right, jump } = getKeys();
    
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();
    
    const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x);

    const moveDir = new THREE.Vector3();
    if (forward) moveDir.add(camDir);
    if (backward) moveDir.sub(camDir);
    if (right) moveDir.add(camRight);
    if (left) moveDir.sub(camRight);

    moveDir.normalize().multiplyScalar(SPEED);

    api.velocity.set(moveDir.x, velocity.current[1], moveDir.z);

    if (jump && Math.abs(velocity.current[1]) < 0.1) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2]);
    }

    // 3. Hybrid Raycasting
    if (!heldItem) {
        const isLocked = document.pointerLockElement !== null;
        const rayOrigin = isLocked ? new THREE.Vector2(0, 0) : state.pointer;

        raycaster.setFromCamera(rayOrigin, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        const validHit = intersects.find(hit => {
             if (hit.distance > INTERACTION_DISTANCE) return false;
             return getInteractableObject(hit.object) !== null;
        });

        if (validHit) {
            const data = getInteractableObject(validHit.object);
            focusedItemRef.current = data;
            setHovering(true);
        } else {
            focusedItemRef.current = null;
            setHovering(false);
        }
    } else {
        focusedItemRef.current = null;
        setHovering(false);
    }
  });

  // Interaction Click Handler
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; 

      if (heldItem) {
        // Throw Logic
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const spawnPos = camera.position.clone().add(direction.clone().multiplyScalar(1.2)); 
        const spawnVel = [
            direction.x * THROW_FORCE,
            direction.y * THROW_FORCE + 4,
            direction.z * THROW_FORCE
        ] as [number, number, number];
        throwItem([spawnPos.x, spawnPos.y, spawnPos.z], spawnVel);

      } else {
        // Pickup Logic
        if (focusedItemRef.current) {
            // If it's a Spawner, id is undefined (creates infinite copies)
            // If it's an Item on ground, id is present (removes it from world)
            pickUpItem(focusedItemRef.current.type, focusedItemRef.current.id);
        }
      }
    };
    
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [heldItem, camera, pickUpItem, throwItem]);

  return (
    <>
      <PointerLockControls 
        onLock={() => setIsLocked(true)} 
        onUnlock={() => setIsLocked(false)}
      />
      <mesh ref={ref as any} />
    </>
  );
};