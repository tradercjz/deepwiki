
import React from 'react';
import { Text, Line, RoundedBox } from '@react-three/drei';
import { TSEngineStep, WindowState } from '../hooks/useTimeSeriesEngineLogic';
import { COLORS, TS_ENGINE_DATA } from '../constants';
import { useSpring, animated } from '@react-spring/three';
import { Table3D } from './Table3D';

interface TSEngineStageProps {
  progress: number;
  logic: TSEngineStep[];
  windowSize: number;
}

export const TSEngineStage: React.FC<TSEngineStageProps> = ({ progress, logic, windowSize }) => {
  const activeIndex = Math.min(Math.floor(progress), logic.length - 1);
  const transition = progress % 1;
  const currentStep = logic[activeIndex];

  // --- Layout Configuration ---
  const INPUT_TABLE_X = -12;
  const OUTPUT_TABLE_X = 12;
  const LANE_CENTER_X = 0;
  
  // Mapping logic for large timestamps (ms)
  // Base: 01:00:00 = 3600000. 
  // Range of interest: 3660000 (01:01:00) to 3846000 (01:04:06)
  // Span ~ 200,000 ms
  // Map 1 minute (60,000ms) to 6 units
  const BASE_TIME = 3660000;
  const mapTime = (t: number) => (t - BASE_TIME) / 10000;

  // Format Helper: 3661785 -> "01:01:01.785"
  const formatTime = (ms: number) => {
      const totalSec = Math.floor(ms / 1000);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const milli = ms % 1000;
      return `01:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${milli.toString().padStart(3,'0')}`;
  };

  const formatShortTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `01:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Lane Z-Positions
  const LANE_Z = { 'A': -2.5, 'B': 2.5 };
  const laneColor = (sym: string) => sym === 'A' ? COLORS.laneA : COLORS.laneB;

  return (
    <group position={[0, -2, 0]}>
      
      {/* 1. INPUT TABLE (Source) */}
      <group position={[INPUT_TABLE_X, 4, 0]}>
          <Table3D 
            title="Input Stream (trades)"
            data={TS_ENGINE_DATA}
            highlightIndex={activeIndex}
            columns={[
                { header: 'Time', accessor: d => formatTime(d.time), width: 3.5, color: COLORS.time },
                { header: 'Sym', accessor: d => d.sym, width: 1.0, color: '#fff' },
                { header: 'Vol', accessor: d => d.value, width: 1.0, color: COLORS.primary },
            ]}
          />
      </group>

      {/* 2. ENGINE CORE (Center) */}
      <group position={[LANE_CENTER_X, 0, 0]}>
          
          {/* Lane Guides */}
          <LaneGuide sym="A" z={LANE_Z['A']} label="Group A" />
          <LaneGuide sym="B" z={LANE_Z['B']} label="Group B" />

          {/* Timeline Axis */}
          <mesh position={[0, -2.5, 0]}>
            <boxGeometry args={[22, 0.05, 0.05]} />
            <meshBasicMaterial color="#444" />
          </mesh>
          {[3660000, 3720000, 3780000, 3840000].map(t => (
            <group key={`tick-${t}`} position={[mapTime(t), -2.8, 0]}>
                <Text fontSize={0.25} color="#666" anchorX="center">{formatShortTime(t)}</Text>
                <mesh position={[0, 0.25, 0]}>
                    <boxGeometry args={[0.05, 0.4, 0.05]} />
                    <meshBasicMaterial color="#444" />
                </mesh>
            </group>
          ))}

          {/* Window Containers */}
          {currentStep && currentStep.activeWindows.map((win) => (
            <WindowContainer 
                key={win.id}
                window={win}
                x={mapTime((win.start + win.end)/2)}
                width={Math.max(0.5, mapTime(win.end) - mapTime(win.start))}
                z={LANE_Z[win.sym as 'A'|'B']}
                isJustUpdated={win.lastUpdateIdx === activeIndex}
                color={laneColor(win.sym)}
                formatTime={formatShortTime}
            />
          ))}

          {/* Scanline */}
          {currentStep && (
            <group position={[mapTime(currentStep.data.time), 0, 0]}>
                <Line 
                    points={[[0, 4, 0], [0, -2.5, 0]]} 
                    color="white" transparent opacity={0.1} lineWidth={1} 
                    dashSize={0.2} gapSize={0.2}
                />
            </group>
          )}

          {/* Data Injection & Ray Casting Animation */}
          {currentStep && (
              <InjectionAnimation 
                  step={currentStep}
                  transition={transition}
                  startX={INPUT_TABLE_X - LANE_CENTER_X + 2.5} // Relative to engine group
                  startY={4 - (activeIndex * 0.6)} // Match input table row height logic
                  targetX={mapTime(currentStep.data.time)}
                  targetZ={LANE_Z[currentStep.data.sym as 'A'|'B']}
                  color={laneColor(currentStep.data.sym)}
                  mapTime={mapTime}
                  windowSize={windowSize}
              />
          )}

      </group>

      {/* 3. OUTPUT TABLE (Sink) */}
      <group position={[OUTPUT_TABLE_X, 4, 0]}>
           <Table3D 
             title="Output Table (output1)"
             data={currentStep ? currentStep.outputHistory : []}
             columns={[
                 { header: 'WinEnd', accessor: d => formatShortTime(d.time), width: 2.5, color: COLORS.time },
                 { header: 'Sym', accessor: d => d.sym, width: 1.0, color: '#fff' },
                 { header: 'Sum', accessor: d => d.sum, width: 1.5, color: COLORS.success },
             ]}
           />
      </group>

    </group>
  );
};

// --- Sub-Components ---

const LaneGuide = ({ sym, z, label }: { sym: string, z: number, label: string }) => (
    <group position={[-10, 0, z]}>
        <Text fontSize={0.5} color={sym === 'A' ? COLORS.laneA : COLORS.laneB} fontWeight="bold" anchorX="right">
            {label}
        </Text>
        <Line points={[[0, 0, 0], [20, 0, 0]]} color="#333" transparent opacity={0.5} lineWidth={1} />
    </group>
);

const WindowContainer = ({ window, x, width, z, isJustUpdated, color, formatTime }: any) => {
    const { scale, opacity, fillOpacity } = useSpring({
        scale: window.isFinalized ? 1 : 0.95,
        opacity: window.isFinalized ? 1 : 0.5,
        fillOpacity: window.isFinalized ? 0.2 : 0.05,
        config: { tension: 150, friction: 20 }
    });

    return (
        <animated.group position={[x, 0, z]} scale={scale}>
            {/* The "Vat" or Container */}
            <RoundedBox args={[width - 0.2, 1.2, 1.8]} radius={0.1}>
                <animated.meshPhysicalMaterial 
                    color={window.isFinalized ? COLORS.success : color}
                    transparent opacity={fillOpacity}
                    roughness={0.1} metalness={0.1} transmission={0.6} thickness={1}
                />
            </RoundedBox>
            
            {/* Wireframe Outline */}
            <mesh>
                 <boxGeometry args={[width - 0.15, 1.25, 1.85]} />
                 <animated.meshBasicMaterial color={window.isFinalized ? COLORS.success : color} wireframe transparent opacity={opacity} />
            </mesh>

            {/* Range Label */}
            <Text position={[0, -0.8, 0]} fontSize={0.2} color="#888">
                [{formatTime(window.start)}, {formatTime(window.end)})
            </Text>

            {/* Aggregated Sum Display */}
            <Text position={[0, 0, 0]} fontSize={0.5} color="white" fontWeight="bold">
                {window.currentSum}
            </Text>

            {isJustUpdated && (
                <pointLight distance={3} intensity={2} color="white" />
            )}
        </animated.group>
    );
};

const InjectionAnimation = ({ step, transition, startX, startY, targetX, targetZ, color, mapTime, windowSize }: any) => {
    // 1. Packet flies from Input Table -> Timeline Point
    // Parabolic arc
    const midX = (startX + targetX) / 2;
    const midY = Math.max(startY, 2) + 2;
    
    // Bezier Quadratic approx
    const t = transition;
    const x = (1-t)*(1-t)*startX + 2*(1-t)*t*midX + t*t*targetX;
    const y = (1-t)*(1-t)*startY + 2*(1-t)*t*midY + t*t*0; // Lands at Y=0 (Lane height)
    const z = (1-t)*(1-t)*0 + 2*(1-t)*t*0 + t*t*targetZ;

    // 2. Ray Casting: Once packet is close to landing (t > 0.8), shoot rays to active windows
    // Windows that *contain* this data point
    const activeWindows = step.activeWindows.filter((w: WindowState) => 
        w.sym === step.data.sym && step.data.time >= w.start && step.data.time < w.end
    );

    return (
        <group>
            {/* The Packet */}
            <group position={[x, y, z]}>
                <mesh>
                    <sphereGeometry args={[0.25]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
                </mesh>
                <Text position={[0, 0.4, 0]} fontSize={0.25} color="white">{step.data.value}</Text>
            </group>

            {/* Ray Casting (Multi-Window Write Visualization) */}
            {t > 0.6 && activeWindows.map((win: WindowState) => {
                const winX = mapTime((win.start + win.end)/2);
                return (
                    <Line 
                        key={`ray-${win.id}`}
                        points={[[x, y, z], [winX, 0, targetZ]]}
                        color="white"
                        transparent
                        opacity={(t - 0.6) * 2} // Fade in
                        lineWidth={1}
                    />
                );
            })}
        </group>
    );
};
