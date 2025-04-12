/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Define the camera waypoint interface
interface CameraWaypoint {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  name?: string;
}

interface ScrollableCameraControllerProps {
  waypoints: Array<{
    position: [number, number, number];
    lookAt: [number, number, number];
    name?: string;
  }>;
  scrollThreshold?: number;
  transitionDuration?: number;
  curve?: boolean;
  debug?: boolean;
  enabled?: boolean;
  onWaypointChange?: (index: number) => void;
}

const ScrollableCameraController: React.FC<ScrollableCameraControllerProps> = ({
  waypoints,
  scrollThreshold = 0.15,
  transitionDuration = 2000,
  curve = true,
  debug = false,
  enabled = true,
  onWaypointChange
}) => {
  const { camera } = useThree();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [transitioning, setTransitioning] = useState(false);
  const initialized = useRef(false);
  
  // Create THREE.Vector3 objects from waypoint arrays
  const formattedWaypoints = useRef<CameraWaypoint[]>(waypoints.map(wp => ({
    position: new THREE.Vector3(...wp.position),
    lookAt: new THREE.Vector3(...wp.lookAt),
    name: wp.name
  })));
  
  // Animation state
  const animation = useRef({
    startTime: 0,
    startPosition: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
    targetIndex: 0
  });
  
  // Scroll handler state
  const scrollState = useRef({
    accumulatedScroll: 0,
    cooldown: false,
    lastScrollTime: 0
  });
  
  // Debug objects
  const debugObjects = useRef<THREE.Mesh[]>([]);
  
  // Update the ref when state changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    if (onWaypointChange) {
      onWaypointChange(currentIndex);
    }
  }, [currentIndex, onWaypointChange]);
  
  // Handle wheel events
  const handleWheel = (event: WheelEvent) => {
    // Ignore events when transitioning or in cooldown
    if (!enabled || transitioning || scrollState.current.cooldown) return;
    
    event.preventDefault();
    
    const now = Date.now();
    const delta = event.deltaY;
    
    // Ignore very small wheel movements
    if (Math.abs(delta) < 5) return;
    
    // Determine scroll direction (positive = down, negative = up)
    const direction = delta > 0 ? 1 : -1;
    
    // Add to accumulated scroll
    scrollState.current.accumulatedScroll += Math.abs(delta) / 500;
    scrollState.current.lastScrollTime = now;
    
    // Only change waypoints if we've accumulated enough scroll
    if (scrollState.current.accumulatedScroll > scrollThreshold) {
      const currentIdx = currentIndexRef.current;
      let newIndex = currentIdx;
      
      if (direction > 0 && currentIdx < formattedWaypoints.current.length - 1) {
        // Scroll down - go to next waypoint
        newIndex = currentIdx + 1;
      } else if (direction < 0 && currentIdx > 0) {
        // Scroll up - go to previous waypoint
        newIndex = currentIdx - 1;
      }
      
      // Only transition if we're moving to a different waypoint
      if (newIndex !== currentIdx) {
        if (debug) {
          console.log(`Moving from waypoint ${currentIdx} to ${newIndex}`);
        }
        
        startTransition(currentIdx, newIndex);
        
        // Reset accumulated scroll and set cooldown
        scrollState.current.accumulatedScroll = 0;
        scrollState.current.cooldown = true;
        
        // Release cooldown after transition finishes
        setTimeout(() => {
          scrollState.current.cooldown = false;
        }, transitionDuration + 100);
      } else {
        // Reset accumulated scroll if we can't move in this direction
        scrollState.current.accumulatedScroll = 0;
      }
    }
    
    // Auto-reset accumulated scroll after a delay with no scrolling
    setTimeout(() => {
      if (Date.now() - scrollState.current.lastScrollTime > 200) {
        scrollState.current.accumulatedScroll = 0;
      }
    }, 200);
  };
  
  // Initialize camera and event listeners
  useEffect(() => {
    if (debug) {
      createDebugObjects();
    }
    
    // Position camera at initial waypoint only on first mount
    if (formattedWaypoints.current.length > 0 && enabled && !initialized.current) {
      const initialWaypoint = formattedWaypoints.current[0];
      camera.position.copy(initialWaypoint.position);
      camera.lookAt(initialWaypoint.lookAt);
      initialized.current = true;
    }
    
    // Set up wheel event listener
    const wheelListener = (e: WheelEvent) => {
      if (enabled) {
        handleWheel(e);
      }
    };
    
    // Find the canvas container
    const canvasContainer = document.querySelector('canvas')?.parentElement;
    if (canvasContainer) {
      canvasContainer.addEventListener('wheel', wheelListener, { passive: false });
      
      return () => {
        canvasContainer.removeEventListener('wheel', wheelListener);
      };
    } else {
      window.addEventListener('wheel', wheelListener, { passive: false });
      
      return () => {
        window.removeEventListener('wheel', wheelListener);
      };
    }
  }, [enabled, debug]);
  
  // Create debug visualization objects
  const createDebugObjects = () => {
    // Clean up existing debug objects
    debugObjects.current.forEach(obj => obj.parent?.remove(obj));
    debugObjects.current = [];
    
    // Create spheres for each waypoint
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const lookAtMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    
    formattedWaypoints.current.forEach((wp, index) => {
      // Position sphere
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(wp.position);
      sphere.scale.set(0.5, 0.5, 0.5);
      debugObjects.current.push(sphere);
      
      // LookAt target sphere
      const targetSphere = new THREE.Mesh(geometry, lookAtMaterial);
      targetSphere.position.copy(wp.lookAt);
      targetSphere.scale.set(0.25, 0.25, 0.25);
      debugObjects.current.push(targetSphere);
    });
  };
  
  // Start camera transition from one waypoint to another
  const startTransition = (fromIndex: number, toIndex: number) => {
    // Set transitioning state
    setTransitioning(true);
    
    // Get current camera position and look direction
    const startPosition = camera.position.clone();
    
    // Calculate where camera is currently looking
    const startLookAt = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .add(camera.position);
    
    // Get target waypoint
    const targetWaypoint = formattedWaypoints.current[toIndex];
    
    // Set up animation state
    animation.current = {
      startTime: Date.now(),
      startPosition: startPosition,
      startLookAt: startLookAt,
      targetPosition: targetWaypoint.position.clone(),
      targetLookAt: targetWaypoint.lookAt.clone(),
      targetIndex: toIndex
    };
    
    if (debug) {
      console.log(`Starting transition from ${fromIndex} to ${toIndex}: ${targetWaypoint.name || 'Unnamed'}`);
    }
  };
  
  // Handle animation in each frame
  useFrame(() => {
    if (!enabled) return;
    
    // Add debug objects to scene if needed
    if (debug && debugObjects.current.length > 0) {
      debugObjects.current.forEach(obj => {
        if (!obj.parent) {
          camera.parent?.add(obj);
        }
      });
    }
    
    // Handle camera transition animation
    if (transitioning) {
      const now = Date.now();
      const elapsed = now - animation.current.startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      
      // Cubic ease-in-out for smooth movement
      const t = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Interpolate position and lookAt
      const newPosition = new THREE.Vector3().lerpVectors(
        animation.current.startPosition,
        animation.current.targetPosition,
        t
      );
      
      const newLookAt = new THREE.Vector3().lerpVectors(
        animation.current.startLookAt,
        animation.current.targetLookAt,
        t
      );
      
      // Update camera position and orientation
      camera.position.copy(newPosition);
      camera.lookAt(newLookAt);
      
      // Check if animation is complete
      if (progress >= 1) {
        setTransitioning(false);
        setCurrentIndex(animation.current.targetIndex);
        
        if (debug) {
          console.log(`Transition complete. Now at waypoint ${animation.current.targetIndex}`);
        }
      }
    }
  });
  
  return null;
};

export default ScrollableCameraController;