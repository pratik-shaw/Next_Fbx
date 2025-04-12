import React, { useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface CameraPosition {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  name: string;
}

interface CameraPositionDebuggerProps {
  enabled?: boolean;
  onSavePosition?: (positions: CameraPosition[]) => void;
}

const CameraPositionDebugger: React.FC<CameraPositionDebuggerProps> = ({ 
  enabled = true,
  onSavePosition
}) => {
  const { camera } = useThree();
  const [positions, setPositions] = useState<CameraPosition[]>([]);
  const [currentName, setCurrentName] = useState<string>('');
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const controlsEnabled = useRef(true);

  // Draw a small visual indicator of where the camera is looking
  useFrame(() => {
    if (enabled && controlsEnabled.current) {
      // Calculate where the camera is looking
      targetRef.current.set(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .add(camera.position);
    }
  });

  const saveCurrentPosition = () => {
    if (!currentName.trim()) return;
    
    const newPosition: CameraPosition = {
      position: camera.position.clone(),
      lookAt: targetRef.current.clone(),
      name: currentName.trim()
    };
    
    const updatedPositions = [...positions, newPosition];
    setPositions(updatedPositions);
    setCurrentName('');
    
    if (onSavePosition) {
      onSavePosition(updatedPositions);
    }
    
    // Log position for easy copy/paste
    console.log(`Position ${newPosition.name}:`, {
      position: [
        newPosition.position.x.toFixed(2),
        newPosition.position.y.toFixed(2),
        newPosition.position.z.toFixed(2)
      ],
      lookAt: [
        newPosition.lookAt.x.toFixed(2),
        newPosition.lookAt.y.toFixed(2),
        newPosition.lookAt.z.toFixed(2)
      ]
    });
  };

  const deletePosition = (index: number) => {
    const updatedPositions = positions.filter((_, i) => i !== index);
    setPositions(updatedPositions);
    if (onSavePosition) {
      onSavePosition(updatedPositions);
    }
  };

  const goToPosition = (position: CameraPosition) => {
    // Disable orbit controls temporarily
    controlsEnabled.current = false;
    
    // Store the original position
    const startPosition = camera.position.clone();
    const startLookAt = targetRef.current.clone();
    const startTime = Date.now();
    const duration = 1000; // 1 second transition
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const t = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;
      
      // Interpolate position
      camera.position.lerpVectors(
        startPosition,
        position.position,
        t
      );
      
      // Update lookAt
      const currentLookAt = new THREE.Vector3().lerpVectors(
        startLookAt,
        position.lookAt,
        t
      );
      camera.lookAt(currentLookAt);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Re-enable controls
        controlsEnabled.current = true;
      }
    };
    
    animate();
  };

  // Only render the UI if enabled
  if (!enabled) return null;

  return (
    <Html position={[-200, 100, 0]} style={{ width: '300px' }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3>Camera Position Debugger</h3>
        
        <div>
          <p>Current Camera:</p>
          <pre style={{ fontSize: '12px', overflowX: 'auto' }}>
            Position: [{camera.position.x.toFixed(2)}, {camera.position.y.toFixed(2)}, {camera.position.z.toFixed(2)}]
            <br/>
            LookAt: [{targetRef.current.x.toFixed(2)}, {targetRef.current.y.toFixed(2)}, {targetRef.current.z.toFixed(2)}]
          </pre>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder="Position name"
            style={{ width: '70%', padding: '5px', marginRight: '5px' }}
          />
          <button 
            onClick={saveCurrentPosition}
            style={{ width: '25%', padding: '5px', backgroundColor: '#4CAF50', border: 'none', color: 'white' }}
          >
            Save
          </button>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <h4>Saved Positions:</h4>
          {positions.length === 0 ? (
            <p>No positions saved yet</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {positions.map((pos, index) => (
                <li key={index} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                  <button 
                    onClick={() => goToPosition(pos)}
                    style={{ marginRight: '5px', padding: '2px 5px', backgroundColor: '#2196F3', border: 'none', color: 'white' }}
                  >
                    Go
                  </button>
                  <span>{pos.name}</span>
                  <button 
                    onClick={() => deletePosition(index)}
                    style={{ marginLeft: 'auto', padding: '2px 5px', backgroundColor: '#f44336', border: 'none', color: 'white' }}
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => {
              console.log(JSON.stringify(positions, null, 2));
              alert('Camera positions exported to console');
            }}
            style={{ width: '100%', padding: '5px', backgroundColor: '#FFC107', border: 'none', color: 'black' }}
          >
            Export to Console
          </button>
        </div>
      </div>
    </Html>
  );
};

export default CameraPositionDebugger;