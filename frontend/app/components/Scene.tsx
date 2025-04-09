/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import * as THREE from 'three';
import Model from './Model';

// Camera controller component that handles the rotation
const CameraRotation = ({ speed = 2 }) => {
  const { camera } = useThree();
  const orbitControlsRef = useRef<any>(null);
  
  // Set up initial position
  useEffect(() => {
    camera.position.set(5, 2, 7);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  // Animate camera rotation on each frame
  useFrame(({ clock }) => {
    if (orbitControlsRef.current) {
      // Disable controls during automatic rotation
      orbitControlsRef.current.enabled = false;
      
      const angle = clock.getElapsedTime() * speed;
      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
      
      // Update camera position to rotate around the model
      camera.position.x = Math.sin(angle) * radius;
      camera.position.z = Math.cos(angle) * radius;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <OrbitControls 
      ref={orbitControlsRef}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.2}
      enablePan={false}
      enableZoom={true}
      minDistance={2}
      maxDistance={12}
    />
  );
};

const SceneLighting = () => {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const fillLightRef = useRef<THREE.DirectionalLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const backCyanLightRef = useRef<THREE.SpotLight>(null);
  const oppositeCyanLightRef = useRef<THREE.SpotLight>(null);
  
  return (
    <>
      {/* Moderate ambient light */}
      <ambientLight intensity={0.25} />
      
      {/* Dimmed sun light - still revealing details but less harsh */}
      <directionalLight
        position={[10, 15, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color="#fff"
        ref={sunLightRef}
      />
      
      {/* Original cyan key light */}
      <spotLight
        position={[5, 4, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={2}
        castShadow
        shadow-bias={-0.0001}
        color="#4CECFF"
        distance={25}
        ref={spotLightRef}
      />
      
      {/* NEW: Opposite cyan light */}
      <spotLight
        position={[-5, 4, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={1.8}
        castShadow
        shadow-bias={-0.0001}
        color="#4CECFF"
        distance={25}
        ref={oppositeCyanLightRef}
      />
      
      {/* NEW: Back side cyan light */}
      <spotLight
        position={[0, 4, -5]}
        angle={0.6}
        penumbra={0.8}
        intensity={1.8}
        castShadow
        shadow-bias={-0.0001}
        color="#4CECFF"
        distance={25}
        ref={backCyanLightRef}
      />
      
      {/* Fill light - from opposite side */}
      <directionalLight
        position={[-8, 3, 5]}
        intensity={0.6}
        color="#75ffee"
        ref={fillLightRef}
      />
      
      {/* Rim/back light for edge definition */}
      <spotLight
        position={[0, 5, -8]}
        angle={0.5}
        penumbra={1}
        intensity={1.2}
        color="#dbfffd"
        castShadow={false}
      />
      
      {/* Ground bounce light */}
      <pointLight 
        position={[0, 0.2, 0]}
        intensity={0.3}
        color="#2a636b"
        distance={8}
      />
      
      {/* Subtle hemisphere light */}
      <hemisphereLight 
        color="#b4d2ff" 
        groundColor="#102138" 
        intensity={0.4} 
      />
    </>
  );
};

const Scene = () => {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#101820' }}>
      <Canvas
        shadows
        camera={{ position: [5, 5, 7], fov: 35 }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3
        }}
      >
        {/* Back to previous background color */}
        <color attach="background" args={['#101820']} />
        {/* Original fog settings */}
        <fog attach="fog" args={['#101820', 12, 35]} />
        
        <SceneLighting />
        
        {/* Floor to receive shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#161e26" roughness={0.8} metalness={0.2} />
        </mesh>
        
        <Model />
        
        {/* Replace standard OrbitControls with our rotating camera controller */}
        <CameraRotation speed={0.1} />
        
        <Stats />
      </Canvas>
    </div>
  );
};

export default Scene;