import { useFrame } from '@react-three/fiber';
import { useGameStore } from './store';
import * as THREE from 'three';

export function CameraRig() {
  useFrame((state) => {
    const playerPos = useGameStore.getState().playerPosition;
    const targetPos = new THREE.Vector3(
      playerPos.x,
      playerPos.y + 15,
      playerPos.z + 15
    );
    state.camera.position.lerp(targetPos, 0.1);
    state.camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
  });
  return null;
}
