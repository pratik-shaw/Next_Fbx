/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useRef, useEffect, Suspense, useState, ReactNode, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stats, Stars, Trail, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Model from './Model';
import Fighter from './Fighter';

// Type definition for Fighter positions
interface FighterPosition {
  position: [number, number, number];
  rotation: [number, number, number];
  id: string;
}

// Define Fighter particle position interface
interface ParticlePosition {
  position: [number, number, number];
  scale: number;
  index: number;
}

// Define Fighter data interface
interface FighterData {
  id: string;
  initialPosition: [number, number, number];
  initialRotation: [number, number, number];
  offsetFactor: number;
  engineOffsetX: number;
  engineOffsetZ: number;
  particlePositions: ParticlePosition[];
}

// Type definition for CameraRotation props
interface CameraRotationProps {
  speed?: number;
}

// Performance optimization - reusable geometries and materials
const createReusableGeometries = () => {
  const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
  const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  return { sphereGeometry, particleGeometry };
};

const createReusableMaterials = () => {
  const nebulaMaterials = [
    new THREE.MeshBasicMaterial({ color: "#150a30", transparent: true, opacity: 0.4 }),
    new THREE.MeshBasicMaterial({ color: "#4a1060", transparent: true, opacity: 0.25 }),
    new THREE.MeshBasicMaterial({ color: "#0a2050", transparent: true, opacity: 0.3 }),
  ];
  
  const particleMaterial = new THREE.MeshBasicMaterial({ 
    color: "#ffffff", 
    transparent: true, 
    opacity: 0.2 
  });
  
  const engineParticleMaterials = [
    new THREE.MeshBasicMaterial({ color: "#4af7ff", transparent: true, opacity: 0.9 }),
    new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9 })
  ];
  
  return { nebulaMaterials, particleMaterial, engineParticleMaterials };
};

// Space environment with stars and nebula - optimized
const SpaceEnvironment = () => {
  // Use reusable geometries and materials
  const { sphereGeometry } = useMemo(() => createReusableGeometries(), []);
  const { nebulaMaterials, particleMaterial } = useMemo(() => createReusableMaterials(), []);
  
  // Animate nebula movement - optimized with useRef
  const nebulasRef = useRef<THREE.Group>(null);
  
  // Pre-calculate dust positions
  const dustPositions = useMemo(() => {
    return Array.from({ length: 30 }).map(() => [
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ] as [number, number, number]);
  }, []);
  
  const dustSizes = useMemo(() => {
    return Array.from({ length: 30 }).map(() => Math.random() * 0.08 + 0.03);
  }, []);
  
  // Use instanced meshes for dust particles for better performance
  const dustInstancedMeshRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (dustInstancedMeshRef.current) {
      const tempMatrix = new THREE.Matrix4();
      dustPositions.forEach((position, i) => {
        const scale = dustSizes[i];
        tempMatrix.makeScale(scale, scale, scale);
        tempMatrix.setPosition(position[0], position[1], position[2]);
        dustInstancedMeshRef.current?.setMatrixAt(i, tempMatrix);
      });
      dustInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dustPositions, dustSizes]);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.05;
    
    if (nebulasRef.current) {
      // Update all nebulas in one go for better performance
      const children = nebulasRef.current.children;
      
      if (children[0]) {
        children[0].rotation.y = t * 0.2;
        children[0].position.x = Math.sin(t * 0.1) * 5;
      }
      
      if (children[1]) {
        children[1].rotation.y = -t * 0.15;
        children[1].position.z = Math.cos(t * 0.08) * 3;
      }
      
      if (children[2]) {
        children[2].rotation.z = t * 0.1;
        children[2].position.y = Math.sin(t * 0.12) * 2;
      }
    }
  });
  
  return (
    <>
      {/* Deep space stars with customized look - reduced count for performance */}
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} // Reduced from 5000
        factor={4} 
        saturation={0.6}
        fade
        speed={0.5}
      />
      
      {/* Group all nebulas for more efficient updating */}
      <group ref={nebulasRef}>
        {/* Distant nebula effect - reduced geometry complexity */}
        <mesh position={[0, 0, -80]} rotation={[0, Math.PI / 3, 0]}>
          <sphereGeometry args={[70, 32, 32]} /> {/* Changed from primitive to direct geometry */}
          <meshBasicMaterial color="#150a30" transparent opacity={0.4} /> {/* Changed from primitive to direct material */}
        </mesh>
        
        {/* Colorful nebula accent - reduced geometry complexity */}
        <mesh position={[-50, 20, -60]} rotation={[0, Math.PI / 4, 0]}>
          <sphereGeometry args={[30, 24, 24]} /> {/* Changed from primitive to direct geometry */}
          <meshBasicMaterial color="#4a1060" transparent opacity={0.25} /> {/* Changed from primitive to direct material */}
        </mesh>
        
        {/* Blue nebula accent - reduced geometry complexity */}
        <mesh position={[40, -10, -70]} rotation={[0, -Math.PI / 5, 0]}>
          <sphereGeometry args={[25, 24, 24]} /> {/* Changed from primitive to direct geometry */}
          <meshBasicMaterial color="#0a2050" transparent opacity={0.3} /> {/* Changed from primitive to direct material */}
        </mesh>
      </group>
      
      {/* Use instanced mesh for dust particles - MAJOR performance improvement */}
      <instancedMesh 
        ref={dustInstancedMeshRef} 
        args={[undefined, undefined, 30]} // Reduced from 60
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} /> {/* Changed from primitive to direct material */}
      </instancedMesh>
    </>
  );
};

// Motion trail props interface
interface MotionTrailProps {
  children: ReactNode;
  width?: number;
  length?: number;
  color?: string;
  attenuation?: (width: number) => number;
}

// Camera controller component
const CameraRotation = ({ speed = 0.05 }: CameraRotationProps) => {
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

// Motion trails component
const MotionTrail = ({ 
  children, 
  width = 2, 
  length = 20, 
  color = "#00ffff", 
  attenuation 
}: MotionTrailProps) => {
  // Convert the attenuation value to a function as required by Trail component
  const attenuationFn = useCallback((width: number) => attenuation ? attenuation(width) : 4, [attenuation]);
  
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

// Type definition for EnginePulseLight props
interface EnginePulseLightProps {
  position: [number, number, number];
  color: string;
  baseIntensity: number;
  pulseIntensity?: number;
  pulseSpeed?: number;
  distance: number;
  time: number;
}

// Engine glow component for performance - reduce duplicate code
const EnginePulseLight = ({ 
  position, 
  color, 
  baseIntensity, 
  pulseIntensity = 0, 
  pulseSpeed = 1, 
  distance,
  time
}: EnginePulseLightProps) => {
  const intensity = pulseIntensity > 0 
    ? baseIntensity + Math.sin(time * pulseSpeed) * pulseIntensity 
    : baseIntensity;
  
  return (
    <pointLight 
      position={position} 
      color={color}
      intensity={intensity}
      distance={distance}
    />
  );
};

// Type definition for FighterWithEffects props
interface FighterWithEffectsProps {
  fighter: FighterData;
  time: React.MutableRefObject<number>;
  engineParticleMaterials: THREE.MeshBasicMaterial[];
  particleGeometry: THREE.SphereGeometry;
}

// Enhanced fighter component with engine glow - optimized
const FighterFormation = () => {
  // Use a ref to track time instead of state for better performance
  const timeRef = useRef(0);
  
  // Re-use materials and geometries
  const { particleGeometry } = useMemo(() => createReusableGeometries(), []);
  const { engineParticleMaterials } = useMemo(() => createReusableMaterials(), []);
  
  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime();
  });
  
  // Base positions for the fighters - memoized
  const baseFighterPositions = useMemo<FighterPosition[]>(() => [
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
  ], []);
  
  // Calculate dynamic positions - optimized with useMemo
  const fighters = useMemo(() => {
    return baseFighterPositions.map(fighter => {
      const { id, position, rotation } = fighter;
      
      // Direction vectors for forward movement simulation
      const forwardX = Math.sin(rotation[1]);
      const forwardZ = Math.cos(rotation[1]);
      
      // Direction for offset
      const offsetFactor = id === "Right Fighter" ? 1 : -1;
      
      // Engine offset calculation
      const engineOffsetX = forwardX * 1.5;
      const engineOffsetZ = forwardZ * 1.5;
      
      // Pre-calculate particle positions
      const particlePositions = [0.8, 1.6, 2.4].map((factor) => ({
        position: [
          position[0] - engineOffsetX * factor + (Math.random() - 0.5) * 0.2,
          position[1] + (Math.random() - 0.5) * 0.2,
          position[2] - engineOffsetZ * factor + (Math.random() - 0.5) * 0.2
        ] as [number, number, number],
        scale: 0.15 + Math.random() * 0.15,
        index: Math.floor(Math.random() * 2) // For alternating colors
      }));
      
      // Return a fighter component with its dynamic state
      return { 
        id, 
        initialPosition: position,
        initialRotation: rotation,
        offsetFactor,
        engineOffsetX,
        engineOffsetZ,
        particlePositions
      };
    });
  }, [baseFighterPositions]);
  
  // Render the fighters
  return (
    <>
      {fighters.map(fighter => (
        <FighterWithEffects 
          key={fighter.id}
          fighter={fighter}
          time={timeRef}
          engineParticleMaterials={engineParticleMaterials}
          particleGeometry={particleGeometry}
        />
      ))}
    </>
  );
};

// Separate component for fighter with effects - improves performance by reducing re-renders
const FighterWithEffects = ({ 
  fighter, 
  time,
  engineParticleMaterials,
  particleGeometry
}: FighterWithEffectsProps) => {
  const { 
    id, 
    initialPosition, 
    initialRotation, 
    offsetFactor,
    engineOffsetX,
    engineOffsetZ,
    particlePositions
  } = fighter;
  
  // Use ref for position and rotation to avoid recreating objects
  const positionRef = useRef<[number, number, number]>(initialPosition.slice() as [number, number, number]);
  const rotationRef = useRef<[number, number, number]>(initialRotation.slice() as [number, number, number]);
  
  // Update position and rotation on each frame
  useFrame(() => {
    const currentTime = time.current;
    
    // Calculate dynamic position
    positionRef.current[0] = initialPosition[0] + Math.sin(currentTime * 0.5) * 0.3 * offsetFactor + Math.sin(currentTime * 0.1) * 0.15;
    positionRef.current[1] = initialPosition[1] + Math.sin(currentTime * 0.4) * 0.2 + Math.cos(currentTime * 0.2) * 0.1;
    positionRef.current[2] = initialPosition[2] + Math.cos(currentTime * 0.3) * 0.25 * offsetFactor + Math.sin(currentTime * 0.2) * 0.2;
    
    // Calculate dynamic rotation
    rotationRef.current[0] = initialRotation[0] + Math.sin(currentTime * 0.4) * 0.05 * offsetFactor;
    rotationRef.current[1] = initialRotation[1] + Math.sin(currentTime * 0.2) * 0.02;
    rotationRef.current[2] = initialRotation[2] + Math.sin(currentTime * 0.3) * 0.04 * offsetFactor;
  });
  
  // Group all engine glow effects for performance
  const engineLights = useMemo(() => {
    // Setup factors for trail positions
    const trailFactors = [0.2, 0.6, 1.0, 1.4];
    
    return (
      <>
        {/* Primary engine glow */}
        <EnginePulseLight
          position={[
            initialPosition[0] - engineOffsetX,
            initialPosition[1],
            initialPosition[2] - engineOffsetZ
          ]}
          color="#00caff"
          baseIntensity={10}
          distance={8}
          time={time.current}
        />
        
        {/* Engine pulse effect */}
        <EnginePulseLight
          position={[
            initialPosition[0] - engineOffsetX * 1.1,
            initialPosition[1],
            initialPosition[2] - engineOffsetZ * 1.1
          ]}
          color="#aef4ff"
          baseIntensity={5}
          pulseIntensity={1.2}
          pulseSpeed={8}
          distance={6}
          time={time.current}
        />
        
        {/* Secondary engine glow */}
        <EnginePulseLight
          position={[
            initialPosition[0] - engineOffsetX * 1.2,
            initialPosition[1],
            initialPosition[2] - engineOffsetZ * 1.2
          ]}
          color="#ffffff"
          baseIntensity={4}
          pulseIntensity={1.0}
          pulseSpeed={12}
          distance={5}
          time={time.current}
        />
        
        {/* Volumetric engine trail - reduced number */}
        {trailFactors.map((factor, index) => (
          <EnginePulseLight
            key={`glow-${id}-${index}`}
            position={[
              initialPosition[0] - engineOffsetX * factor,
              initialPosition[1],
              initialPosition[2] - engineOffsetZ * factor
            ]}
            color={index % 2 === 0 ? "#00ffff" : "#80ffff"}
            baseIntensity={4.0 - factor * 1.2}
            distance={5 - factor}
            time={time.current}
          />
        ))}
      </>
    );
  }, [id, initialPosition, engineOffsetX, engineOffsetZ, time]);
  
  return (
    <group>
      {/* Motion trail for fighter */}
      <MotionTrail width={2.0} length={16} color={id === "Right Fighter" ? "#00f0ff" : "#4CE0FF"}>
        <Fighter 
          position={positionRef.current}
          rotation={rotationRef.current}
        />
      </MotionTrail>

      {/* Fighter body glow - reduced number of lights */}
      <pointLight 
        position={positionRef.current} 
        color="#00e8ff"
        intensity={8}
        distance={10}
      />
      
      {/* Fighter rim light */}
      <spotLight
        position={[
          positionRef.current[0] - 5 * offsetFactor,
          positionRef.current[1] + 3,
          positionRef.current[2]
        ]}
        angle={0.7}
        penumbra={0.8}
        intensity={9}
        color="#ff9d4d"
        distance={12}
        target-position={positionRef.current}
      />
      
      {/* Engine glow effects */}
      {engineLights}
      
      {/* Particle effects - use instanced mesh in production */}
      {particlePositions.map((particle, index) => (
        <mesh 
          key={`particle-${id}-${index}`}
          position={particle.position}
          scale={particle.scale}
        >
          <sphereGeometry args={[0.1, 8, 8]} /> {/* Using direct geometry instead of primitive */}
          <meshBasicMaterial 
            color={index % 2 === 0 ? "#4af7ff" : "#ffffff"} 
            transparent 
            opacity={0.9 - [0.8, 1.6, 2.4][index % 3] * 0.25} 
          />
        </mesh>
      ))}
    </group>
  );
};

// Scene lighting with optimizations
const SceneLighting = () => {
  // Reduce number of lights for better performance
  const mainLightRef = useRef<THREE.DirectionalLight>(null);
  const accentLightRef = useRef<THREE.SpotLight>(null);
  
  // Precompute color for performance
  const accentColorHSL = new THREE.Color();
  
  // Animate lights but with reduced frequency
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (mainLightRef.current) {
      // Adjust intensity less frequently
      if (Math.round(time * 10) % 3 === 0) {
        mainLightRef.current.intensity = 2.2 + Math.sin(time * 0.3) * 0.2;
      }
    }
    
    if (accentLightRef.current) {
      // Update color less frequently
      if (Math.round(time * 10) % 5 === 0) {
        const hue = (time * 0.05) % 1;
        accentColorHSL.setHSL(hue, 0.7, 0.5);
        accentLightRef.current.color = accentColorHSL;
      }
    }
  });
  
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.25} />
      
      {/* Main fill light - with shadow optimization */}
      <directionalLight
        position={[15, 10, 15]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={1024} // Reduced from 2048
        shadow-mapSize-height={1024} // Reduced from 2048
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color="#e8e0d6"
        ref={mainLightRef}
      />
      
      {/* Rim light - essential for silhouette */}
      <spotLight
        position={[-8, 6, -8]}
        angle={0.5}
        penumbra={0.9}
        intensity={2.5}
        castShadow
        shadow-bias={-0.0001}
        color="#4CD8FF"
        distance={40}
        ref={accentLightRef}
      />
      
      {/* Reduced number of accent lights - keep only the most important ones */}
      <spotLight
        position={[0, 4, 8]}
        angle={0.6}
        penumbra={0.9}
        intensity={5}
        castShadow
        shadow-bias={-0.0001}
        color="#4CD8FF"
        distance={30}
      />
      
      {/* Key light for model definition */}
      <directionalLight
        position={[0, 3, 10]}
        intensity={1.5}
        color="#ffffff"
      />
      
      {/* Main ship center glow */}
      <pointLight 
        position={[0, 0.2, 0]}
        intensity={1.5}
        color="#2a636b"
        distance={12}
      />
      
      {/* Hemisphere light for general space illumination */}
      <hemisphereLight 
        color="#b4d2ff" 
        groundColor="#0a0a18" 
        intensity={0.4}
      />
    </>
  );
};

// Main spaceship with optimized movement
const MainShipMovement = () => {
  const modelRef = useRef<THREE.Group>(null);
  
  // Use instanced calculations for performance
  const timeValues = useRef({
    sinTime1: 0,
    sinTime2: 0,
    sinTime3: 0,
    sinTime4: 0
  });
  
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Calculate sin values only once per frame
    timeValues.current = {
      sinTime1: Math.sin(time * 0.3) * 0.2,
      sinTime2: Math.sin(time * 0.1) * 0.05,
      sinTime3: Math.sin(time * 0.15) * 0.02,
      sinTime4: Math.sin(time * 0.12) * 0.01
    };
    
    if (modelRef.current) {
      // Update position and rotation using precalculated values
      modelRef.current.position.y = timeValues.current.sinTime1;
      modelRef.current.rotation.y = timeValues.current.sinTime2;
      modelRef.current.rotation.x = timeValues.current.sinTime3;
      modelRef.current.rotation.z = timeValues.current.sinTime4;
    }
  });
  
  // Preload Model to avoid unnecessary re-renders
  useGLTF.preload('./Model');
  
  return (
    <group ref={modelRef}>
      {/* Reduced number of lights - keep only the essential ones */}
      <pointLight
        position={[0, 0, 0]}
        intensity={1.5}
        color="#3080a0"
        distance={10}
      />
      
      <pointLight
        position={[0, 1, 0]}
        intensity={2.0}
        color="#60c0ff"
        distance={8}
      />
      
      {/* Main ship model */}
      <Model />
    </group>
  );
};

// Main Scene component with performance optimizations
const Scene = () => {
  // Preload Fighter model
  useGLTF.preload('./Fighter');
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000000' }}>
      <Canvas
        shadows
        camera={{ position: [5, 5, 7], fov: 35 }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
          // Performance optimizations
          powerPreference: 'high-performance',
          precision: 'mediump', // Use medium precision for better performance
          depth: true,
          stencil: false, // Disable stencil buffer if not needed
          alpha: false // Disable alpha if not needed
        }}
        dpr={[1, 2]} // Limit DPR for performance
      >
        {/* Deep space background */}
        <color attach="background" args={['#05050f']} />
        
        {/* Reduced fog density for performance */}
        <fog attach="fog" args={['#070720', 40, 170]} />
        
        {/* Stars and nebula environment */}
        <SpaceEnvironment />
        
        {/* Improved lighting setup */}
        <SceneLighting />
        
        {/* Original model - main spaceship with subtle movement */}
        <Suspense fallback={null}>
          <MainShipMovement />
        </Suspense>
        
        {/* Enhanced fighters with dynamic movement */}
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