
import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { AccumulateStep } from '../hooks/useAccumulateLogic';
import { COLORS, ACCUMULATE_DATA } from '../constants';
import * as THREE from 'three';

// --- Sub-Components ---

const InputNode = ({ val, x, isActive }: any) => {
    const { scale, color } = useSpring({
        scale: isActive ? 1.2 : 1,
        color: isActive ? COLORS.primary : '#444',
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
            <RoundedBox args={[1.5, 1, 0.5]} radius={0.1}>
                <animated.meshStandardMaterial color={color} />
            </RoundedBox>
            <Text position={[0, 0, 0.3]} fontSize={0.4} color="white" fontWeight="bold">
                {val}
            </Text>
        </animated.group>
    );
};

const OutputNode = ({ val, x, visible }: any) => {
    const { scale, opacity } = useSpring({
        scale: visible ? 1 : 0,
        opacity: visible ? 1 : 0,
        config: { tension: 200 }
    });

    return (
        <animated.group position={[x, 0, 0]} scale={scale}>
             <RoundedBox args={[1.5, 1, 0.5]} radius={0.1}>
                <animated.meshStandardMaterial color={COLORS.success} transparent opacity={opacity} />
            </RoundedBox>
            <Text position={[0, 0, 0.3]} fontSize={0.4} color="white" fontWeight="bold">
                {val}
            </Text>
            {/* Connector down to rail */}
            <mesh position={[0, -0.4, 0]}>
                <boxGeometry args={[0.2, 0.4, 0.2]} />
                <animated.meshBasicMaterial color={COLORS.success} transparent opacity={opacity} />
            </mesh>
        </animated.group>
    );
};

const MergeAnimation = ({ step, transition, getX, inputY, outputY }: any) => {
    // Sources:
    // 1. Prev Output (Index i-1) OR Init (if i=0)
    // 2. Current Input (Index i)
    // Target:
    // Current Output (Index i)

    const currentX = getX(step.index);
    const prevX = step.index > 0 ? getX(step.index - 1) : currentX; // If index 0, direct vertical
    
    // Beam 1: From Prev Result (Top Left) -> Current Result (Top Center)
    // Only if index > 0
    const beam1Start = new THREE.Vector3(prevX, outputY, 0);
    const beam1End = new THREE.Vector3(currentX, outputY, 0);

    // Beam 2: From Input (Bottom Center) -> Current Result (Top Center)
    const beam2Start = new THREE.Vector3(currentX, inputY + 0.5, 0);
    const beam2End = new THREE.Vector3(currentX, outputY - 0.5, 0);

    // Converge point (Top Center)
    const center = new THREE.Vector3(currentX, outputY, 0);

    // Animation: Beams shoot to center
    // 0.0 - 0.5: Travel
    // 0.5 - 0.8: Pulse/Calc
    // 0.8 - 1.0: Result appears (Handled by OutputNode visible prop)
    
    return (
        <group>
            {/* Beam from Previous Result */}
            {step.index > 0 && (
                <Beam 
                    start={beam1Start} 
                    end={beam1End} 
                    progress={transition} 
                    color={COLORS.success}
                />
            )}

            {/* Beam from Input */}
            <Beam 
                start={beam2Start} 
                end={beam2End} 
                progress={transition} 
                color={COLORS.primary}
            />

            {/* Operator Pulse at Convergence */}
            {transition > 0.5 && transition < 0.9 && (
                <OperatorPulse position={center} label={step.debugStr} />
            )}
        </group>
    );
};

const Beam = ({ start, end, progress, color }: any) => {
    // Progress 0->0.6: Grow from start to end
    // Progress 0.6->1.0: Shrink into end
    
    if (progress > 0.9) return null;

    let t1 = 0;
    let t2 = 0;

    if (progress < 0.5) {
        // Shooting out
        t2 = progress / 0.5;
        t1 = 0;
    } else {
        // Retracting
        t2 = 1;
        t1 = (progress - 0.5) / 0.4;
    }

    const p1 = new THREE.Vector3().lerpVectors(start, end, t1);
    const p2 = new THREE.Vector3().lerpVectors(start, end, t2);
    
    if (p1.distanceTo(p2) < 0.1) return null;

    return (
        <Line 
            points={[p1, p2]}
            color={color}
            lineWidth={4}
            transparent
            opacity={0.8}
        />
    );
};

const OperatorPulse = ({ position, label }: any) => {
    const { scale } = useSpring({ from: { scale: 0 }, to: { scale: 1 }, config: { tension: 300 } });
    
    // Parse operator from debug string (e.g., "1 + 2 = 3" -> "+")
    let op = "+";
    if (label.includes("*")) op = "×";
    if (label.includes("max")) op = "max";
    if (label.includes("Init")) op = "Init";

    return (
        <animated.group position={position} scale={scale}>
             <Text position={[0, -1.2, 0.5]} fontSize={0.3} color={COLORS.gold} fontWeight="bold">
                 {label}
             </Text>
             <mesh>
                 <sphereGeometry args={[0.4]} />
                 <meshBasicMaterial color={COLORS.gold} transparent opacity={0.5} />
             </mesh>
        </animated.group>
    );
}

// --- Main Component ---

interface AccumulateStageProps {
  progress: number;
  logic: AccumulateStep[];
}

export const AccumulateStage: React.FC<AccumulateStageProps> = ({ progress, logic }) => {
  // Fix for end-of-animation revert:
  // If progress >= length, we are finished. Clamp to last index and transition 1.
  const isFinished = progress >= logic.length;
  
  const activeIndex = isFinished 
      ? logic.length - 1 
      : Math.min(Math.floor(progress), logic.length - 1);
      
  const transition = isFinished ? 1 : progress % 1;
  
  const currentStep = logic[activeIndex];

  // Layout
  const ITEM_WIDTH = 2.5;
  const TOTAL_WIDTH = ACCUMULATE_DATA.length * ITEM_WIDTH;
  const START_X = -TOTAL_WIDTH / 2 + ITEM_WIDTH / 2;
  const INPUT_Y = -2;
  const OUTPUT_Y = 2;

  const getX = (i: number) => START_X + i * ITEM_WIDTH;

  return (
    <group position={[0, -1, 0]}>
       
       <Text position={[0, 4.5, 0]} fontSize={0.5} color={COLORS.secondary} fontWeight="bold">
           Accumulate (Scan)
       </Text>

       {/* Input Rail */}
       <group position={[0, INPUT_Y, 0]}>
           <Text position={[-TOTAL_WIDTH/2 - 2, 0, 0]} fontSize={0.3} color={COLORS.primary} anchorX="right">
               Input (X)
           </Text>
           {ACCUMULATE_DATA.map((val, i) => (
               <InputNode 
                  key={i} 
                  val={val} 
                  x={getX(i)} 
                  isActive={i === activeIndex || (isFinished && i === logic.length - 1)}
               />
           ))}
           {/* Rail Line */}
           <Line 
              points={[[-TOTAL_WIDTH/2 - 1, -0.6, 0], [TOTAL_WIDTH/2 + 1, -0.6, 0]]} 
              color={COLORS.grid} lineWidth={2} 
           />
       </group>

       {/* Output Rail */}
       <group position={[0, OUTPUT_Y, 0]}>
           <Text position={[-TOTAL_WIDTH/2 - 2, 0, 0]} fontSize={0.3} color={COLORS.success} anchorX="right">
               Output
           </Text>
           {logic.map((step, i) => (
               <OutputNode 
                  key={i} 
                  val={step.newValue} 
                  x={getX(i)}
                  // Visible if past index, OR current index and animation mostly done
                  visible={i < activeIndex || (i === activeIndex && transition > 0.8)}
               />
           ))}
           {/* Rail Line */}
           <Line 
              points={[[-TOTAL_WIDTH/2 - 1, -0.6, 0], [TOTAL_WIDTH/2 + 1, -0.6, 0]]} 
              color={COLORS.grid} lineWidth={2} 
           />
       </group>

       {/* Merge Animation (Active Step) */}
       {currentStep && !isFinished && (
           <MergeAnimation 
              step={currentStep}
              transition={transition}
              getX={getX}
              inputY={INPUT_Y}
              outputY={OUTPUT_Y}
           />
       )}

    </group>
  );
};
