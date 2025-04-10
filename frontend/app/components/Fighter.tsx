"use client"
import React, { useEffect, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Material, Object3D } from 'three';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';

// Define type for the FBX model
type FBXModel = Object3D & {
  scale: THREE.Vector3;
  rotation: THREE.Euler;
  traverse: (callback: (object: Object3D) => void) => void;
  clone: () => FBXModel;
};

// Interface for FighterModel props
interface FighterModelProps {
  fbx: FBXModel;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// Internal Fighter component that uses the loaded model
const FighterModel: React.FC<FighterModelProps> = ({ 
  fbx,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.000025
}) => {
  const modelRef = useRef<Group>(null);
  
  // Set up the model when it's loaded
  useEffect(() => {
    if (fbx && modelRef.current) {
      // Apply the clone to the ref so we can animate it
      const model = fbx.clone();
      
      // Scale the model
      model.scale.set(scale, scale, scale);
      
      // Apply material adjustments
      model.traverse((child: THREE.Object3D) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Apply material adjustments if needed
          if (child.material) {
            const material = child.material as Material & { metalness?: number; roughness?: number };
            if (typeof material.metalness !== 'undefined') {
              material.metalness = 0.5;
            }
            if (typeof material.roughness !== 'undefined') {
              material.roughness = 0.5;
            }
          }
        }
      });
      
      // Add the model to our ref
      modelRef.current.add(model);
    }
  }, [fbx, scale]);
  
  // Keep the subtle hovering animation
  useFrame((state) => {
    if (modelRef.current) {
      // Gentle hovering animation
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1;
    }
  });
  
  // Typescript expects specific tuple types for position and rotation
  const positionTuple: [number, number, number] = position;
  const rotationTuple: [number, number, number] = rotation;
  
  return (
    <group 
      ref={modelRef} 
      position={positionTuple} 
      rotation={rotationTuple}
    />
  );
};

// Interface for Fighter props
interface FighterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// Fighter loader component - this loads the FBX once and reuses it
const Fighter: React.FC<FighterProps> = ({ 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.000025
}) => {
  // Load the FBX model once and share it
  const fbx = useLoader(FBXLoader, '/models/source.fbx') as FBXModel;
  
  return (
    <FighterModel 
      fbx={fbx} 
      position={position} 
      rotation={rotation} 
      scale={scale}
    />
  );
};

// A wrapper component that handles loading state with Suspense
const FighterWithSuspense: React.FC<FighterProps> = ({ 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.000025
}) => {
  return (
    <Suspense fallback={null}>
      <Fighter position={position} rotation={rotation} scale={scale} />
    </Suspense>
  );
};

export default FighterWithSuspense;