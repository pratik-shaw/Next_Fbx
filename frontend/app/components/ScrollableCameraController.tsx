/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  enabled?: boolean;
  onWaypointChange?: (index: number) => void;
  currentWaypoint?: number;
  externalControl?: boolean;
}

const ScrollableCameraController: React.FC<ScrollableCameraControllerProps> = ({
  waypoints,
  scrollThreshold = 0.15,
  transitionDuration = 2000,
  curve = true,
  enabled = true,
  onWaypointChange,
  currentWaypoint,
  externalControl = false
}) => {
  const { camera } = useThree();
  const [waypointIndex, setWaypointIndex] = useState(currentWaypoint || 0);
  const waypointIndexRef = useRef(currentWaypoint || 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitioningRef = useRef(false);
  const initialized = useRef(false);
  const initialWaypointSet = useRef(false);
  
  // Add a ref to track the previous external waypoint to prevent loops
  const previousExternalWaypoint = useRef(currentWaypoint);
  
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
    controlPoint: new THREE.Vector3(),
    targetIndex: 0
  });
  
  // Scroll handler state
  const scrollState = useRef({
    accumulatedScroll: 0,
    cooldown: false,
    lastScrollTime: 0
  });
  
  // Touch handler state - Updated with new reverseTouchDirection property
  const touchState = useRef({
    startY: 0,
    startX: 0,
    lastY: 0,
    lastX: 0,
    accumulatedDistance: 0,
    touching: false,
    lastTouchTime: 0,
    reverseTouchDirection: true // Set to true by default to reverse mobile direction
  });
  
  // Update the refs when state changes
  useEffect(() => {
    waypointIndexRef.current = waypointIndex;
    if (onWaypointChange) {
      onWaypointChange(waypointIndex);
    }
  }, [waypointIndex, onWaypointChange]);
  
  useEffect(() => {
    transitioningRef.current = isTransitioning;
  }, [isTransitioning]);
  
  // Add new useEffect to handle mobile direction fix
  useEffect(() => {
    // Listen for the custom event from HomePage to fix mobile direction
    const handleFixMobileScroll = () => {
      // Always set to true to reverse direction on mobile devices
      touchState.current = {
        ...touchState.current,
        reverseTouchDirection: true
      };
    };
    
    window.addEventListener('fixMobileScroll', handleFixMobileScroll);
    // Run it once on load - always reverse mobile direction
    handleFixMobileScroll();
    
    return () => {
      window.removeEventListener('fixMobileScroll', handleFixMobileScroll);
    };
  }, []);
  
  // Function to move to a specific waypoint - wrapped in useCallback
  const goToWaypoint = useCallback((index: number) => {
    if (index < 0 || index >= formattedWaypoints.current.length || transitioningRef.current) return;
    
    // Set transitioning state
    setIsTransitioning(true);
    transitioningRef.current = true;
    
    // Get current camera position and look direction
    const startPosition = camera.position.clone();
    
    // Calculate where camera is currently looking
    const startLookAt = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .add(camera.position);
    
    // Get target waypoint
    const targetWaypoint = formattedWaypoints.current[index];
    
    // Calculate control point for curved transition (midpoint raised up)
    const midPoint = new THREE.Vector3().addVectors(startPosition, targetWaypoint.position).multiplyScalar(0.5);
    if (curve) {
      // Add some height to the midpoint for a curved path
      midPoint.y += Math.max(startPosition.y, targetWaypoint.position.y) * 0.5;
    }
    
    // Set up animation state
    animation.current = {
      startTime: Date.now(),
      startPosition: startPosition,
      startLookAt: startLookAt,
      targetPosition: targetWaypoint.position.clone(),
      targetLookAt: targetWaypoint.lookAt.clone(),
      controlPoint: midPoint,
      targetIndex: index
    };
  }, [camera, curve]);
  
  // Update waypoint index when controlled externally - fix the loop issue
  useEffect(() => {
    if (externalControl && 
        currentWaypoint !== undefined && 
        currentWaypoint !== previousExternalWaypoint.current) {
      
      // Update the refs and state
      waypointIndexRef.current = currentWaypoint;
      setWaypointIndex(currentWaypoint);
      previousExternalWaypoint.current = currentWaypoint;
      
      // Only initiate transition if not already transitioning to avoid conflicts
      if (!transitioningRef.current) {
        goToWaypoint(currentWaypoint);
      }
    }
  }, [currentWaypoint, goToWaypoint, externalControl]);
  
  // Generic navigation function to handle both wheel and touch events
  const navigate = useCallback((direction: number, distance: number) => {
    if (externalControl) return;
    if (!enabled || transitioningRef.current || scrollState.current.cooldown) return;
    
    // Add to accumulated scroll based on the normalized distance
    scrollState.current.accumulatedScroll += Math.abs(distance);
    scrollState.current.lastScrollTime = Date.now();
    
    // Only change waypoints if we've accumulated enough scroll
    if (scrollState.current.accumulatedScroll > scrollThreshold) {
      const currentIdx = waypointIndexRef.current;
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
        // Important: Update the ref first to prevent race conditions
        waypointIndexRef.current = newIndex;
        setWaypointIndex(newIndex);
        goToWaypoint(newIndex);
        
        // Reset accumulated scroll and set cooldown
        scrollState.current.accumulatedScroll = 0;
        scrollState.current.cooldown = true;
        
        // Release cooldown after transition finishes
        setTimeout(() => {
          scrollState.current.cooldown = false;
        }, transitionDuration + 100);
        
        return true;
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
    
    return false;
  }, [enabled, goToWaypoint, scrollThreshold, transitionDuration, externalControl]);
  
  // Handle wheel events
  const handleWheel = useCallback((event: WheelEvent) => {
    // If external control is active, don't handle wheel events manually
    if (externalControl) return;
    
    // Ignore events when transitioning or in cooldown or disabled
    if (!enabled || transitioningRef.current || scrollState.current.cooldown) return;
    
    // Prevent default scroll behavior
    event.preventDefault();
    event.stopPropagation();
    
    const delta = event.deltaY;
    
    // Ignore very small wheel movements
    if (Math.abs(delta) < 5) return;
    
    // Determine scroll direction (positive = down, negative = up)
    const direction = delta > 0 ? 1 : -1;
    
    // Normalize the delta for consistency between devices
    const normalizedDelta = Math.abs(delta) / 500;
    
    // Use the navigate function to handle the movement
    navigate(direction, normalizedDelta);
    
    return false;
  }, [enabled, navigate, externalControl]);
  
  // Touch handlers for mobile devices
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (externalControl) return;
    if (!enabled || transitioningRef.current) return;
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchState.current = {
        ...touchState.current,
        startY: touch.clientY,
        startX: touch.clientX,
        lastY: touch.clientY,
        lastX: touch.clientX,
        accumulatedDistance: 0,
        touching: true,
        lastTouchTime: Date.now()
      };
      
      // Prevent default to avoid page scrolling
      event.preventDefault();
    }
  }, [enabled, externalControl]);
  
  // Updated handleTouchMove with completely reversed direction logic
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (externalControl) return;
    if (!enabled || !touchState.current.touching || transitioningRef.current) return;
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaY = touchState.current.lastY - touch.clientY;
      const deltaX = touchState.current.lastX - touch.clientX;
      
      // Use primarily vertical movement, but check that horizontal movement isn't dominant
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.8) {
        // COMPLETELY REVERSED DIRECTION: swipe down = go up, swipe up = go down
        // Change from -1:1 to 1:-1 in this line
        const direction = deltaY > 0 ? 1 : -1;
        
        const normalizedDelta = Math.abs(deltaY) / 150;
        touchState.current.accumulatedDistance += normalizedDelta;
        
        if (touchState.current.accumulatedDistance > scrollThreshold * 0.5) {
          const navigated = navigate(direction, touchState.current.accumulatedDistance);
          if (navigated) {
            touchState.current.accumulatedDistance = 0;
          }
        }
      }
      
      // Update last position
      touchState.current.lastY = touch.clientY;
      touchState.current.lastX = touch.clientX;
      touchState.current.lastTouchTime = Date.now();
      
      // Prevent default to avoid page scrolling
      event.preventDefault();
    }
  }, [enabled, externalControl, navigate, scrollThreshold]);
  
  // Also update handleTouchEnd to reverse direction for swipes
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!enabled) return;
    
    // Check for a quick swipe (difference between start and end)
    if (touchState.current.touching) {
      const totalDeltaY = touchState.current.startY - touchState.current.lastY;
      const totalDeltaX = touchState.current.startX - touchState.current.lastX;
      const timeDelta = Date.now() - touchState.current.lastTouchTime;
      
      // If this was a fast, mostly vertical swipe
      if (timeDelta < 300 && Math.abs(totalDeltaY) > 50 && Math.abs(totalDeltaY) > Math.abs(totalDeltaX) * 1.5) {
        // REVERSED DIRECTION for quick swipes too
        // Change from -1:1 to 1:-1 here
        const direction = totalDeltaY > 0 ? 1 : -1;
        
        // Use a larger threshold for quick swipes
        navigate(direction, scrollThreshold * 1.2);
      }
    }
    
    // Reset touch state
    touchState.current.touching = false;
    touchState.current.accumulatedDistance = 0;
  }, [enabled, navigate, scrollThreshold]);
  
  // Initialize camera and event listeners
  useEffect(() => {
    // Position camera at initial waypoint only on first mount
    if (formattedWaypoints.current.length > 0 && enabled && !initialWaypointSet.current) {
      const startIndex = currentWaypoint !== undefined ? currentWaypoint : 0;
      waypointIndexRef.current = startIndex;
      setWaypointIndex(startIndex);
      
      const initialWaypoint = formattedWaypoints.current[startIndex];
      camera.position.copy(initialWaypoint.position);
      camera.lookAt(initialWaypoint.lookAt);
      initialWaypointSet.current = true;
      initialized.current = true;
    }
  }, [camera, enabled, currentWaypoint]);
  
  // Set up wheel and touch event listeners
  useEffect(() => {
    // Wheel event handler with passive: false to allow preventDefault
    const wheelListener = (e: WheelEvent) => {
      if (enabled && !transitioningRef.current) {
        e.preventDefault();
        e.stopPropagation();
        handleWheel(e);
        return false;
      }
    };
    
    // Touch event handlers
    const touchStartListener = (e: TouchEvent) => handleTouchStart(e);
    const touchMoveListener = (e: TouchEvent) => handleTouchMove(e);
    const touchEndListener = (e: TouchEvent) => handleTouchEnd(e);
    
    if (enabled) {
      // Find the canvas element directly
      const canvas = document.querySelector('canvas');
      
      if (canvas) {
        // Add wheel event listeners
        canvas.addEventListener('wheel', wheelListener, { passive: false });
        document.addEventListener('wheel', wheelListener, { passive: false });
        
        // Add touch event listeners
        canvas.addEventListener('touchstart', touchStartListener, { passive: false });
        canvas.addEventListener('touchmove', touchMoveListener, { passive: false });
        canvas.addEventListener('touchend', touchEndListener);
        
        // Add document-level touch events for broader capture
        document.addEventListener('touchstart', touchStartListener, { passive: false });
        document.addEventListener('touchmove', touchMoveListener, { passive: false });
        document.addEventListener('touchend', touchEndListener);
        
        return () => {
          // Remove wheel event listeners
          canvas.removeEventListener('wheel', wheelListener);
          document.removeEventListener('wheel', wheelListener);
          
          // Remove touch event listeners
          canvas.removeEventListener('touchstart', touchStartListener);
          canvas.removeEventListener('touchmove', touchMoveListener);
          canvas.removeEventListener('touchend', touchEndListener);
          
          document.removeEventListener('touchstart', touchStartListener);
          document.removeEventListener('touchmove', touchMoveListener);
          document.removeEventListener('touchend', touchEndListener);
        };
      } else {
        // Fallback to window/document if canvas not found
        window.addEventListener('wheel', wheelListener, { passive: false });
        document.addEventListener('touchstart', touchStartListener, { passive: false });
        document.addEventListener('touchmove', touchMoveListener, { passive: false });
        document.addEventListener('touchend', touchEndListener);
        
        return () => {
          window.removeEventListener('wheel', wheelListener);
          document.removeEventListener('touchstart', touchStartListener);
          document.removeEventListener('touchmove', touchMoveListener);
          document.removeEventListener('touchend', touchEndListener);
        };
      }
    }
    
    return undefined;
  }, [enabled, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  // Handle animation in each frame
  useFrame(() => {
    if (!enabled) return;
    
    // Handle camera transition animation
    if (isTransitioning) {
      const now = Date.now();
      const elapsed = now - animation.current.startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      
      // Cubic ease-in-out for smooth movement
      const t = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Use Bezier curve for position if enabled
      if (curve) {
        // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
        const t1 = 1 - t;
        
        const newPosition = new THREE.Vector3(
          t1 * t1 * animation.current.startPosition.x + 
          2 * t1 * t * animation.current.controlPoint.x + 
          t * t * animation.current.targetPosition.x,
          
          t1 * t1 * animation.current.startPosition.y + 
          2 * t1 * t * animation.current.controlPoint.y + 
          t * t * animation.current.targetPosition.y,
          
          t1 * t1 * animation.current.startPosition.z + 
          2 * t1 * t * animation.current.controlPoint.z + 
          t * t * animation.current.targetPosition.z
        );
        
        camera.position.copy(newPosition);
      } else {
        // Linear interpolation
        const newPosition = new THREE.Vector3().lerpVectors(
          animation.current.startPosition,
          animation.current.targetPosition,
          t
        );
        camera.position.copy(newPosition);
      }
      
      // Always interpolate look target linearly
      const newLookAt = new THREE.Vector3().lerpVectors(
        animation.current.startLookAt,
        animation.current.targetLookAt,
        t
      );
      camera.lookAt(newLookAt);
      
      // Check if animation is complete
      if (progress >= 1) {
        // Ensure we're exactly at the target position/rotation
        camera.position.copy(animation.current.targetPosition);
        camera.lookAt(animation.current.targetLookAt);
        
        setIsTransitioning(false);
        transitioningRef.current = false;
        
        // Ensure waypointIndex is updated to match the animation target
        if (waypointIndexRef.current !== animation.current.targetIndex) {
          waypointIndexRef.current = animation.current.targetIndex;
          setWaypointIndex(animation.current.targetIndex);
          
          // Also update the previous external waypoint to prevent loops
          if (externalControl) {
            previousExternalWaypoint.current = animation.current.targetIndex;
          }
        }
      }
    }
  });
  
  return null;
};

export default ScrollableCameraController;