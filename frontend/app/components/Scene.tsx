/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useRef, useEffect, Suspense, useState, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stats, Stars, Trail } from '@react-three/drei';
import * as THREE from 'three';
import Model from './Model';
import Fighter from './Fighter';

// Type definition for Fighter positions
interface FighterPosition {
  position: [number, number, number];
  rotation: [number, number, number];
  id: string;
}

// Space environment with stars and nebula
const SpaceEnvironment = () => {
  // Animate nebula movement
  const nebulaRef1 = useRef<THREE.Mesh>(null);
  const nebulaRef2 = useRef<THREE.Mesh>(null);
  const nebulaRef3 = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.05;
    
    if (nebulaRef1.current) {
      nebulaRef1.current.rotation.y = t * 0.2;
      nebulaRef1.current.position.x = Math.sin(t * 0.1) * 5;
    }
    
    if (nebulaRef2.current) {
      nebulaRef2.current.rotation.y = -t * 0.15;
      nebulaRef2.current.position.z = Math.cos(t * 0.08) * 3;
    }
    
    if (nebulaRef3.current) {
      nebulaRef3.current.rotation.z = t * 0.1;
      nebulaRef3.current.position.y = Math.sin(t * 0.12) * 2;
    }
  });
  
  return (
    <>
      {/* Deep space stars with customized look */}
      <Stars 
        radius={100} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0.6}
        fade
        speed={0.5}
      />
      
      {/* Distant nebula effect using a large sphere with custom shader */}
      <mesh position={[0, 0, -80]} rotation={[0, Math.PI / 3, 0]} ref={nebulaRef1}>
        <sphereGeometry args={[70, 64, 64]} />
        <meshBasicMaterial 
          color="#150a30" 
          transparent={true} 
          opacity={0.4} 
        />
      </mesh>
      
      {/* Colorful nebula accent */}
      <mesh position={[-50, 20, -60]} rotation={[0, Math.PI / 4, 0]} ref={nebulaRef2}>
        <sphereGeometry args={[30, 32, 32]} />
        <meshBasicMaterial 
          color="#4a1060" 
          transparent={true} 
          opacity={0.25} 
        />
      </mesh>
      
      {/* Blue nebula accent */}
      <mesh position={[40, -10, -70]} rotation={[0, -Math.PI / 5, 0]} ref={nebulaRef3}>
        <sphereGeometry args={[25, 32, 32]} />
        <meshBasicMaterial 
          color="#0a2050" 
          transparent={true} 
          opacity={0.3} 
        />
      </mesh>
      
      {/* Add floating dust particles to create sense of motion */}
      {Array.from({ length: 60 }).map((_, i) => {
        // Random positions in a large area around the scene
        const position: [number, number, number] = [
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        ];
        
        const size = Math.random() * 0.08 + 0.03;
        
        return (
          <mesh key={`dust-${i}`} position={position}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
          </mesh>
        );
      })}
    </>
  );
};

// Camera controller component that handles the rotation
const CameraRotation = ({ speed = 2 }) => {
  const { camera } = useThree();
  const orbitControlsRef = useRef<any>(null);
  
  // Set up initial position
  useEffect(() => {
    camera.position.set(100, 100, 10);
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
      maxDistance={20}
    />
  );
};

// Motion trails for the fighters to create sense of movement
interface MotionTrailProps {
  children: ReactNode;
  width?: number;
  length?: number;
  color?: string;
  attenuation?: number;
}

const MotionTrail: React.FC<MotionTrailProps> = ({ children, width = 2, length = 20, color = "#00ffff", attenuation = 4 }) => {
  // Convert the attenuation value to a function as required by Trail component
  const attenuationFn = (width: number) => attenuation;
  
  return (
    <Trail
      width={width}
      length={length}
      color={color}
      attenuation={attenuationFn}
      stride={0}
    >
      {children}
    </Trail>
  );
};

// Enhanced fighter component with engine glow and dynamic positioning
const FighterFormation = () => {
  // Dynamic fighter movement
  const [time, setTime] = useState(0);
  
  useFrame(({ clock }) => {
    setTime(clock.getElapsedTime());
  });
  
  // Base positions for the fighters
  const baseFighterPositions: FighterPosition[] = [
    { 
      id: "Right Fighter",
      position: [6, 2, 0], 
      rotation: [0, -1.8, 0] 
    },
    { 
      id: "Left Fighter",
      position: [-6, 2, 0], 
      rotation: [0, -1.4, 0] 
    }
  ];
  
  // Calculate dynamic positions with REDUCED movement amplitude
  const fighters = baseFighterPositions.map(fighter => {
    const { id, position, rotation } = fighter;
    
    // Direction vectors for forward movement simulation
    const forwardX = Math.sin(rotation[1]);
    const forwardZ = Math.cos(rotation[1]);
    
    // Add more pronounced movement based on time
    const offsetFactor = id === "Right Fighter" ? 1 : -1;
    
    // ADJUSTED: Reduced movement amplitude for more stable flight pattern
    const dynamicPosition: [number, number, number] = [
      position[0] + Math.sin(time * 0.5) * 0.3 * offsetFactor + Math.sin(time * 0.1) * 0.15,
      position[1] + Math.sin(time * 0.4) * 0.2 + Math.cos(time * 0.2) * 0.1,
      position[2] + Math.cos(time * 0.3) * 0.25 * offsetFactor + Math.sin(time * 0.2) * 0.2
    ];
    
    // ADJUSTED: Reduced rotation amplitude for less erratic banking
    const dynamicRotation: [number, number, number] = [
      rotation[0] + Math.sin(time * 0.4) * 0.05 * offsetFactor, // Roll - reduced
      rotation[1] + Math.sin(time * 0.2) * 0.02, // Yaw - reduced
      rotation[2] + Math.sin(time * 0.3) * 0.04 * offsetFactor // Pitch - reduced
    ];
    
    // Create the engine position offsets based on rotation
    const engineOffsetX = forwardX * 1.5;
    const engineOffsetZ = forwardZ * 1.5;
    
    return (
      <group key={id}>
        {/* Enhanced: Stronger motion trail for better visibility */}
        <MotionTrail width={2.0} length={18} color={id === "Right Fighter" ? "#00f0ff" : "#4CE0FF"}>
          <Fighter 
            position={dynamicPosition}
            rotation={dynamicRotation}
          />
        </MotionTrail>

        {/* ENHANCED: Stronger fighter body glow */}
        <pointLight 
          position={dynamicPosition} 
          color="#00e8ff"
          intensity={8}  /* Increased from 4.5 */
          distance={10}  /* Increased from 6 */
        />
        
        {/* ENHANCED: Stronger fighter rim light */}
        <spotLight
          position={[
            dynamicPosition[0] - 5 * offsetFactor,
            dynamicPosition[1] + 3,
            dynamicPosition[2]
          ]}
          angle={0.7}  /* Increased from 0.6 */
          penumbra={0.8}
          intensity={9}  /* Increased from 6 */
          color="#ff9d4d"
          distance={12}  /* Increased from 10 */
          target-position={dynamicPosition}
        />
        
        {/* NEW: Additional contour light for better silhouette visibility */}
        <spotLight
          position={[
            dynamicPosition[0],
            dynamicPosition[1] + 4,
            dynamicPosition[2] - 5
          ]}
          angle={0.4}
          penumbra={0.6}
          intensity={6}
          color="#ffffff"
          distance={12}
          target-position={dynamicPosition}
        />
        
        {/* ENHANCED: Stronger fill light */}
        <spotLight
          position={[
            dynamicPosition[0] + 5 * offsetFactor,
            dynamicPosition[1] + 2,
            dynamicPosition[2]
          ]}
          angle={0.5}
          penumbra={0.7}
          intensity={8}  /* Increased from 5 */
          color="#ffa542"
          distance={12}  /* Increased from 10 */
          target-position={dynamicPosition}
        />
        
        {/* ENHANCED: Stronger top cyan spotlight */}
        <spotLight
          position={[
            dynamicPosition[0],
            dynamicPosition[1] + 3,
            dynamicPosition[2]
          ]}
          angle={0.6}
          penumbra={0.8}
          intensity={9}  /* Increased from 6 */
          color="#4CE0FF"
          distance={12}  /* Increased from 10 */
          target-position={dynamicPosition}
        />
        
        {/* ENHANCED: Stronger engine glow effect */}
        <pointLight 
          position={[
            dynamicPosition[0] - engineOffsetX,
            dynamicPosition[1],
            dynamicPosition[2] - engineOffsetZ
          ]} 
          color="#00caff"
          intensity={10}  /* Increased from 6 */
          distance={8}  /* Increased from 5 */
        />
        
        {/* ENHANCED: Stronger engine pulse effect */}
        <pointLight 
          position={[
            dynamicPosition[0] - engineOffsetX * 1.1,
            dynamicPosition[1],
            dynamicPosition[2] - engineOffsetZ * 1.1
          ]} 
          color="#aef4ff"
          intensity={5 + Math.sin(time * 8) * 1.2}  /* Increased from 3 + sin * 0.8 */
          distance={6}  /* Increased from 4 */
        />
        
        {/* ENHANCED: Stronger secondary engine glow */}
        <pointLight 
          position={[
            dynamicPosition[0] - engineOffsetX * 1.2,
            dynamicPosition[1],
            dynamicPosition[2] - engineOffsetZ * 1.2
          ]} 
          color="#ffffff"
          intensity={4 + Math.sin(time * 12) * 1.0}  /* Increased from 2 + sin * 0.6 */
          distance={5}  /* Increased from 3 */
        />
        
        {/* ENHANCED: Stronger volumetric engine trail */}
        {[0.2, 0.6, 1.0, 1.4].map((factor, index) => (
          <pointLight 
            key={`glow-${id}-${index}`}
            position={[
              dynamicPosition[0] - engineOffsetX * factor,
              dynamicPosition[1],
              dynamicPosition[2] - engineOffsetZ * factor
            ]} 
            color={index % 2 === 0 ? "#00ffff" : "#80ffff"}
            intensity={4.0 - factor * 1.2}  /* Increased from 2.5 - factor * 1.2 */
            distance={5 - factor}  /* Increased from 3 - factor */
          />
        ))}
        
        {/* NEW: Additional highlight light to make the fighter model more visible */}
        <spotLight 
          position={[
            dynamicPosition[0] + 2 * offsetFactor,
            dynamicPosition[1] + 5,
            dynamicPosition[2] + 2
          ]}
          angle={0.4}
          penumbra={0.7}
          intensity={7}
          color="#ffffff"
          distance={12}
          target-position={dynamicPosition}
        />
        
        {/* Add small particle effects for engine exhaust - optimized count */}
        {[0.8, 1.6, 2.4].map((factor, index) => (
          <mesh 
            key={`particle-${id}-${index}`}
            position={[
              dynamicPosition[0] - engineOffsetX * factor + (Math.random() - 0.5) * 0.2,
              dynamicPosition[1] + (Math.random() - 0.5) * 0.2,
              dynamicPosition[2] - engineOffsetZ * factor + (Math.random() - 0.5) * 0.2
            ]}
            scale={0.15 + Math.random() * 0.15}  /* Increased from 0.1 + random * 0.1 */
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial 
              color={index % 2 === 0 ? "#4af7ff" : "#ffffff"} 
              transparent={true} 
              opacity={0.9 - factor * 0.25}  /* Increased from 0.7 - factor * 0.25 */
            />
          </mesh>
        ))}
      </group>
    );
  });
  
  return <>{fighters}</>;
};

const SceneLighting = () => {
  // Enhanced lighting with cinematic mood
  const mainLightRef = useRef<THREE.DirectionalLight>(null);
  const accentLightRef = useRef<THREE.SpotLight>(null);
  
  // Animate lights for cinematic effect
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (mainLightRef.current) {
      // Subtle intensity pulsing for main light
      mainLightRef.current.intensity = 2.2 + Math.sin(time * 0.3) * 0.2;  /* Increased from 1.6 + sin * 0.15 */
    }
    
    if (accentLightRef.current) {
      // Subtle color shift for accent lights
      const hue = (time * 0.05) % 1;
      accentLightRef.current.color.setHSL(hue, 0.7, 0.5);
    }
  });
  
  return (
    <>
      {/* ENHANCED: Stronger ambient light for better base illumination */}
      <ambientLight intensity={0.25} />  {/* Increased from 0.12 */}
      
      {/* ENHANCED: Stronger main fill light */}
      <directionalLight
        position={[15, 10, 15]}
        intensity={1.8}  /* Increased from 1.2 */
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color="#e8e0d6"
        ref={mainLightRef}
      />
      
      {/* ENHANCED: Stronger rim light for dramatic silhouette effect */}
      <spotLight
        position={[-8, 6, -8]}
        angle={0.5}
        penumbra={0.9}
        intensity={2.5}  /* Increased from 1.5 */
        castShadow
        shadow-bias={-0.0001}
        color="#4CD8FF"
        distance={40}  /* Increased from 30 */
        ref={accentLightRef}
      />
      
      {/* ENHANCED: Stronger accent lights for fighters */}
      <spotLight
        position={[7, 5, 1]}
        angle={0.5}
        penumbra={0.8}
        intensity={6}  /* Increased from 4 */
        castShadow
        shadow-bias={-0.0001}
        color="#4CE0FF"
        distance={30}  /* Increased from 25 */
      />
      
      <spotLight
        position={[-7, 5, 1]}
        angle={0.5}
        penumbra={0.8}
        intensity={6}  /* Increased from 4 */
        castShadow
        shadow-bias={-0.0001}
        color="#4CE0FF"
        distance={30}  /* Increased from 25 */
      />
      
      {/* ENHANCED: Stronger front accent light */}
      <spotLight
        position={[0, 4, 8]}
        angle={0.6}
        penumbra={0.9}
        intensity={5}  /* Increased from 3 */
        castShadow
        shadow-bias={-0.0001}
        color="#4CD8FF"
        distance={30}  /* Increased from 25 */
      />
      
      {/* NEW: Additional key light from the front for better model definition */}
      <directionalLight
        position={[0, 3, 10]}
        intensity={1.5}
        color="#ffffff"
      />
      
      {/* Soft fill light from below */}
      <directionalLight
        position={[0, -5, 5]}
        intensity={0.5}  /* Increased from 0.3 */
        color="#101e60"
      />
      
      {/* ENHANCED: Stronger main ship center glow */}
      <pointLight 
        position={[0, 0.2, 0]}
        intensity={1.5}  /* Increased from 0.7 */
        color="#2a636b"
        distance={12}  /* Increased from 8 */
      />
      
      {/* NEW: Additional rim light for the main ship */}
      <pointLight 
        position={[0, 1, 0]}
        intensity={2.0}
        color="#4cd8ff"
        distance={10}
      />
      
      {/* NEW: Front light to highlight main ship details */}
      <spotLight
        position={[0, 2, 8]}
        angle={0.5}
        penumbra={0.8}
        intensity={3.5}
        color="#ffffff"
        distance={20}
      />
      
      {/* Distant light sources simulating stars */}
      <pointLight position={[30, 20, -40]} intensity={0.6} color="#5063ff" distance={120} />
      <pointLight position={[-40, -10, -30]} intensity={0.5} color="#ff5050" distance={120} />
      
      {/* ENHANCED: Stronger hemisphere light for general space illumination */}
      <hemisphereLight 
        color="#b4d2ff" 
        groundColor="#0a0a18" 
        intensity={0.4}  /* Increased from 0.25 */
      />
      
      {/* ENHANCED: Stronger backlighting to provide silhouette when camera is behind ship */}
      <spotLight 
        position={[-10, 8, -15]} 
        angle={0.6} 
        penumbra={0.8} 
        intensity={2.5}  /* Increased from 1.5 */
        color="#2c4080" 
        distance={40}  /* Increased from 30 */
      />
      
      {/* ENHANCED: Stronger rim light from back-right side */}
      <spotLight 
        position={[12, 6, -14]} 
        angle={0.5} 
        penumbra={0.9} 
        intensity={2.2}  /* Increased from 1.2 */
        color="#3060a0" 
        distance={35}  /* Increased from 25 */
      />
      
      {/* NEW: Additional overhead key light for better visibility */}
      <spotLight
        position={[0, 15, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={2.0}
        color="#ffffff"
        distance={30}
      />
      
      {/* NEW: Front-side fill lights for extra model definition */}
      <spotLight
        position={[12, 2, 8]}
        angle={0.4}
        penumbra={0.7}
        intensity={1.8}
        color="#d0e8ff"
        distance={25}
      />
      
      <spotLight
        position={[-12, 2, 8]}
        angle={0.4}
        penumbra={0.7}
        intensity={1.8}
        color="#d0e8ff"
        distance={25}
      />
    </>
  );
};

// Main spaceship with subtle movement and enhanced visibility
const MainShipMovement = () => {
  const modelRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (modelRef.current) {
      // Subtle hovering effect
      modelRef.current.position.y = Math.sin(time * 0.3) * 0.2;
      // Subtle rotation
      modelRef.current.rotation.y = Math.sin(time * 0.1) * 0.05;
      modelRef.current.rotation.x = Math.sin(time * 0.15) * 0.02;
      modelRef.current.rotation.z = Math.sin(time * 0.12) * 0.01;
    }
  });
  
  return (
    <group ref={modelRef}>
      {/* ENHANCED: Stronger central glow for the ship */}
      <pointLight
        position={[0, 0, 0]}
        intensity={1.5}  /* Increased from 0.6 */
        color="#3080a0"
        distance={10}  /* Increased from 6 */
      />
      
      {/* NEW: Additional light sources to highlight ship details */}
      <pointLight
        position={[0, 1, 0]}
        intensity={2.0}
        color="#60c0ff"
        distance={8}
      />
      
      {/* NEW: Rim lighting for edges */}
      <spotLight
        position={[6, 4, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={3.0}
        color="#ffffff"
        distance={15}
      />
      
      <spotLight
        position={[-6, 4, 0]}
        angle={0.6}
        penumbra={0.8}
        intensity={3.0}
        color="#ffffff"
        distance={15}
      />
      
      {/* NEW: Front light to reveal details */}
      <spotLight
        position={[0, 1, 5]}
        angle={0.5}
        penumbra={0.7}
        intensity={2.5}
        color="#d0e8ff"
        distance={12}
      />
      
      {/* Main ship model */}
      <Model />
    </group>
  );
};

const Scene = () => {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000000' }}>
      <Canvas
        shadows
        camera={{ position: [5, 5, 7], fov: 35 }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3  /* Slightly increased from 1.2 for better visibility */
        }}
      >
        {/* Deep space background - slightly lighter for better contrast */}
        <color attach="background" args={['#05050f']} />  {/* Changed from #030309 */}
        
        {/* Cosmic fog for depth perception - slightly reduced density for better visibility */}
        <fog attach="fog" args={['#070720', 30, 150]} />  {/* Modified from [25, 120] */}
        
        {/* Stars and nebula environment */}
        <SpaceEnvironment />
        
        {/* Improved balanced lighting setup */}
        <SceneLighting />
        
        {/* Original model - main spaceship with subtle movement */}
        <Suspense fallback={null}>
          <MainShipMovement />
        </Suspense>
        
        {/* Enhanced fighters with dynamic movement and engine effects */}
        <Suspense fallback={null}>
          <FighterFormation />
        </Suspense>
        
        {/* Camera rotation for cinematic movement */}
        <CameraRotation speed={0.05} />
        
        <Stats />
      </Canvas>
    </div>
  );
};

export default Scene;