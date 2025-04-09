"use client"
import React, { useEffect, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Material } from 'three';
import * as THREE from 'three';
// Import FBXLoader from three-stdlib instead
import { FBXLoader } from 'three-stdlib';
import { useLoader } from '@react-three/fiber';

const Model: React.FC = () => {
  // We'll use a ref to store the loaded model
  const modelRef = useRef<Group>(null);
  
  // Use the FBXLoader to load the FBX file
  const fbx = useLoader(FBXLoader, '/models/VSDI.fbx');
  
  useEffect(() => {
    if (fbx) {
      // Adjust scale if needed
      fbx.scale.set(0.0001, 0.0001, 0.0001);
      
      // Center the model
      fbx.traverse((child: THREE.Object3D) => {
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
    }
  }, [fbx]);
  
  // Optional: Add animations or transformations here
  useFrame((state) => {
    if (modelRef.current) {
      // Example: gentle floating animation
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  return <primitive ref={modelRef} object={fbx} position={[0, 0, 0]} />;
};

// A wrapper component that handles loading state with Suspense
const ModelWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <Model />
    </Suspense>
  );
};

export default ModelWithSuspense;