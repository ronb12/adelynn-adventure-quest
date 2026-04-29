import { useFrame } from '@react-three/fiber';
import { useGameStore } from './store';
import * as THREE from 'three';

// Camera offsets per environment type
const OUTDOOR_OFFSET = { y: 15, z: 15 };
// Interior: camera sits well below the 5.6-unit ceiling so it looks
// into the room rather than down through the roof.
const INTERIOR_OFFSET = { y: 4.5, z: 8 };

export function CameraRig() {
  useFrame((state) => {
    const { playerPosition, currentArea } = useGameStore.getState();
    const isInterior = currentArea === 'home';
    const off = isInterior ? INTERIOR_OFFSET : OUTDOOR_OFFSET;

    const targetPos = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y + off.y,
      playerPosition.z + off.z
    );

    // Lerp faster indoors so it tracks the player tightly in the small room
    state.camera.position.lerp(targetPos, isInterior ? 0.15 : 0.1);

    // Look slightly above the feet so we see the character & furniture
    const lookY = isInterior ? playerPosition.y + 1.0 : playerPosition.y;
    state.camera.lookAt(playerPosition.x, lookY, playerPosition.z);
  });
  return null;
}
