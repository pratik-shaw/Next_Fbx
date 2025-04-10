"use client"
import React, { useEffect, useRef, Suspense, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Material, Object3D, Vector3, Euler } from 'three';
import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';

// Define type for the FBX model
type FBXModel = Object3D & {
  scale: Vector3;
  rotation: Euler;
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
  const initialPositionY = position[1]; // Store the initial Y position
  
  // Create a memoized model clone to prevent recreation on re-renders
  const modelClone = useMemo(() => {
    const model = fbx.clone();
    
    // Scale the model
    model.scale.set(scale, scale, scale);
    
    // Apply material adjustments
    model.traverse((child: Object3D) => {
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
    
    return model;
  }, [fbx, scale]);
  
  // Set up the model only once
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.add(modelClone);
      
      // Save the current ref to avoid the stale closure issue in cleanup
      const currentRef = modelRef.current;
      
      // Cleanup function to remove the model when component unmounts
      return () => {
        if (currentRef) {
          currentRef.remove(modelClone);
        }
      };
    }
  }, [modelClone]);
  
  // Optimize animation by using a reference to track the last frame time
  const animationRef = useRef({
    time: 0,
    offset: position[0] // Use position[0] as an offset for variety
  });
  
  useFrame((state) => {
    if (modelRef.current) {
      // Calculate the hover effect more efficiently
      const hoverAmount = Math.sin(state.clock.elapsedTime * 0.5 + animationRef.current.offset) * 0.1;
      modelRef.current.position.y = initialPositionY + hoverAmount;
    }
  });
  
  return (
    <group 
      ref={modelRef} 
      position={position} 
      rotation={rotation}
    />
  );
};

// Interface for Fighter props
interface FighterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// Fighter loader component with memoized model loading
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
const FighterWithSuspense = React.memo(({ 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.000025
}: FighterProps) => {
  return (
    <Suspense fallback={null}>
      <Fighter 
        position={position as [number, number, number]} 
        rotation={rotation as [number, number, number]} 
        scale={scale} 
      />
    </Suspense>
  );
});

// Add display name to fix ESLint error
FighterWithSuspense.displayName = 'FighterWithSuspense';

export default FighterWithSuspense;