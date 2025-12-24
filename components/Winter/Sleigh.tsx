
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { MiniPerson } from './Trees';

const WORDS = ["DOLPHINDB", "SWORDFISH", "ORCA", "STARFISH"];

const Sleigh: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const [wordIndex, setWordIndex] = useState(0);
  
  const characterStates = useRef<{ 
    y: number; 
    headRot: number; 
    targetHeadRot: number; 
    lookTimer: number;
    jumpOffset: number;
    jumpSpeed: number;
  }[]>([]);

  const startX = -45;
  const endX = 45;
  const speed = 0.08;

  const currentWord = WORDS[wordIndex];
  const personSpacing = 1.3;
  const sleighLength = currentWord.length * personSpacing + 2.5;

  const charRandoms = useMemo(() => {
    return Array.from({ length: currentWord.length }).map(() => ({
      speed: 4 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.3 + Math.random() * 0.3,
      lookChance: 0.005 + Math.random() * 0.01
    }));
  }, [currentWord]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (group.current) {
      group.current.position.x += speed;
      group.current.position.y = 0.3 + Math.sin(time * 2) * 0.05;
      
      if (group.current.position.x > endX) {
        group.current.position.x = startX;
        setWordIndex((prev) => (prev + 1) % WORDS.length);
      }
    }

    if (characterStates.current.length !== currentWord.length) {
      characterStates.current = currentWord.split('').map(() => ({
        y: 0,
        headRot: 0,
        targetHeadRot: 0,
        lookTimer: 0,
        jumpOffset: Math.random() * 5,
        jumpSpeed: 4.5 + Math.random() * 1.5
      }));
    }

    characterStates.current.forEach((char, i) => {
      const rnd = charRandoms[i];
      const jump = Math.sin(time * rnd.speed + rnd.phase) * rnd.amplitude;
      char.y = Math.max(0, jump);

      if (Math.random() < rnd.lookChance && char.lookTimer <= 0) {
        const choice = Math.floor(Math.random() * 3);
        if (choice === 0) char.targetHeadRot = Math.PI / 4;
        else if (choice === 1) char.targetHeadRot = -Math.PI / 4;
        else char.targetHeadRot = 0;
        char.lookTimer = 60 + Math.random() * 120;
      }

      if (char.lookTimer > 0) char.lookTimer--;
      char.headRot = THREE.MathUtils.lerp(char.headRot, char.targetHeadRot, 0.1);
    });
  });

  const colors = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <group ref={group} position={[startX, 0.3, 0]}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[sleighLength, 0.6, 2.2]} />
        <meshStandardMaterial color="#c2410c" roughness={0.1} metalness={0.7} />
      </mesh>

      <mesh position={[0, 0.7, 1.11]}>
        <boxGeometry args={[sleighLength, 0.05, 0.05]} />
        <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
      </mesh>

      <mesh castShadow position={[sleighLength / 2, 0.8, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <boxGeometry args={[1.8, 0.6, 2.2]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>

      <group position={[-(currentWord.length * personSpacing) / 2 + personSpacing / 2, 0.7, 0]}>
        {currentWord.split('').map((char, i) => {
          const charColor = colors[i % colors.length];
          return (
            <CharacterWrapper 
              key={`${wordIndex}-${i}`} 
              index={i} 
              char={char} 
              charColor={charColor} 
              personSpacing={personSpacing} 
              characterStates={characterStates} 
            />
          );
        })}
      </group>

      <mesh castShadow position={[0, -0.1, 0.9]}>
        <boxGeometry args={[sleighLength + 3, 0.1, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1} />
      </mesh>
      <mesh castShadow position={[0, -0.1, -0.9]}>
        <boxGeometry args={[sleighLength + 3, 0.1, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1} />
      </mesh>
    </group>
  );
};

const CharacterWrapper: React.FC<{
  index: number;
  char: string;
  charColor: string;
  personSpacing: number;
  characterStates: React.MutableRefObject<any[]>;
}> = ({ index, char, charColor, personSpacing, characterStates }) => {
  const charRef = useRef<THREE.Group>(null);
  const [headRot, setHeadRot] = useState(0);

  useFrame(() => {
    if (charRef.current && characterStates.current[index]) {
      const state = characterStates.current[index];
      charRef.current.position.y = state.y;
      charRef.current.rotation.z = state.y * 0.1;
      setHeadRot(state.headRot);
    }
  });

  return (
    <group ref={charRef} position={[index * personSpacing, 0, 0]}>
      <MiniPerson position={[0, 0, 0]} shirtColor={charColor} scale={0.7} headRotationY={headRot} />
      <Text
        position={[0, 2.1, 0]}
        fontSize={1.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Montserrat-Bold.ttf"
      >
        {char}
        <meshStandardMaterial color="#ffffff" emissive={charColor} emissiveIntensity={1.5} />
      </Text>
      {/* Light removed for performance */}
    </group>
  );
};

export default Sleigh;
