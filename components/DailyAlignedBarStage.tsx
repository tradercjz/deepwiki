import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { DataRow, Session } from '../hooks/useDailyAlignedBarLogic';
import { COLORS } from '../constants';

const AnimatedText = animated(Text);

interface DailyAlignedBarStageProps {
  progress: number; // 0 to 3
  logic: {
      rows: DataRow[];
      sessions: Session[];
      resultRows: any[];
      intervalSeconds: number;
      formatTime: (s: number) => string;
  };
}

export const DailyAlignedBarStage: React.FC<DailyAlignedBarStageProps> = ({ progress, logic }) => {
  // Layout:
  // Top: Timeline with sessions
  // Middle: Data points
  // Bottom: Result Table

  // Timeline scale: Map seconds to X coordinate
  // Range: Min session start to Max session end
  const minTime = Math.min(...logic.sessions.map(s => s.start));
  const maxTime = Math.max(...logic.sessions.map(s => s.end));
  const timeRange = maxTime - minTime;
  const WIDTH = 12;
  const scaleX = (t: number) => ((t - minTime) / timeRange - 0.5) * WIDTH;

  return (
    <group position={[0, 0, 0]}>
        <Text position={[0, 5.5, 0]} fontSize={0.6} color="white" fontWeight="bold">
            dailyAlignedBar
        </Text>

        {/* Timeline Axis */}
        <Line 
            points={[[-WIDTH/2 - 1, 2, 0], [WIDTH/2 + 1, 2, 0]]} 
            color="#666" 
            lineWidth={1} 
        />

        {/* Sessions Background */}
        {logic.sessions.map((session, i) => {
            const xStart = scaleX(session.start);
            const xEnd = scaleX(session.end);
            const w = xEnd - xStart;
            return (
                <group key={i}>
                    <mesh position={[xStart + w/2, 2, -0.1]}>
                        <planeGeometry args={[w, 1]} />
                        <meshBasicMaterial color={COLORS.primary} transparent opacity={0.1} />
                    </mesh>
                    <Text position={[xStart, 2.8, 0]} fontSize={0.3} color="#aaa">
                        {logic.formatTime(session.start)}
                    </Text>
                    <Text position={[xEnd, 2.8, 0]} fontSize={0.3} color="#aaa">
                        {logic.formatTime(session.end)}
                    </Text>
                </group>
            );
        })}

        {/* Interval Grid Lines */}
        {progress >= 1 && logic.sessions.map((session, i) => {
            // Draw lines at intervals
            const lines = [];
            for (let t = session.start; t <= session.end; t += logic.intervalSeconds) {
                const x = scaleX(t);
                lines.push(
                    <Line 
                        key={`${i}-${t}`}
                        points={[[x, 2.5, 0], [x, 1.5, 0]]}
                        color={COLORS.secondary}
                        lineWidth={1}
                        dashed
                        dashScale={2}
                    />
                );
            }
            return <group key={i}>{lines}</group>;
        })}

        {/* Data Points */}
        {logic.rows.map((row) => (
            <DataPoint 
                key={row.id}
                row={row}
                scaleX={scaleX}
                progress={progress}
            />
        ))}

        {/* Result Table */}
        <ResultTable 
            resultRows={logic.resultRows} 
            progress={progress} 
        />
    </group>
  );
};

const DataPoint = ({ row, scaleX, progress }: { row: DataRow, scaleX: (t: number) => number, progress: number }) => {
    // Phase 0: Show at original time
    // Phase 1: Show intervals (no movement)
    // Phase 2: Move to barStart
    
    const originalX = scaleX(row.time);
    const targetX = row.barStart !== null ? scaleX(row.barStart) : originalX;
    
    const isMoving = progress >= 2;
    
    const { x, color } = useSpring({
        x: isMoving ? targetX : originalX,
        color: isMoving ? COLORS.success : COLORS.funcCol,
        config: { tension: 120, friction: 14 }
    });

    return (
        <animated.group position-x={x} position-y={2} position-z={0.1}>
            <animated.mesh>
                <sphereGeometry args={[0.08, 16, 16]} />
                <animated.meshStandardMaterial color={color} />
            </animated.mesh>
            {/* Show time on hover? Or just rely on position */}
        </animated.group>
    );
};

const ResultTable = ({ resultRows, progress }: { resultRows: any[], progress: number }) => {
    const isVisible = progress >= 3;
    
    const { opacity, y } = useSpring({
        opacity: isVisible ? 1 : 0,
        y: isVisible ? -1 : -5
    });

    return (
        <animated.group position={[0, y, 0]}>
            <AnimatedText position={[0, 0, 0]} fontSize={0.5} color="white" fillOpacity={opacity} anchorY="bottom">
                Result Table
            </AnimatedText>
            
            {/* Header */}
            <group position={[0, -0.8, 0]}>
                <AnimatedText position={[-3, 0, 0]} fontSize={0.35} color="#aaa" fillOpacity={opacity}>Bar Start</AnimatedText>
                <AnimatedText position={[0, 0, 0]} fontSize={0.35} color="#aaa" fillOpacity={opacity}>Count</AnimatedText>
                <AnimatedText position={[3, 0, 0]} fontSize={0.35} color="#aaa" fillOpacity={opacity}>Avg Price</AnimatedText>
            </group>

            {/* Rows */}
            {resultRows.map((row, i) => (
                <group key={i} position={[0, -1.5 - i * 0.6, 0]}>
                    <AnimatedText position={[-3, 0, 0]} fontSize={0.35} color="white" fillOpacity={opacity}>
                        {row.barStartStr}
                    </AnimatedText>
                    <AnimatedText position={[0, 0, 0]} fontSize={0.35} color="white" fillOpacity={opacity}>
                        {row.count}
                    </AnimatedText>
                    <AnimatedText position={[3, 0, 0]} fontSize={0.35} color="white" fillOpacity={opacity}>
                        {row.avgPrice.toFixed(2)}
                    </AnimatedText>
                    
                    {/* Row background */}
                    <animated.mesh position={[0, 0, -0.05]}>
                        <planeGeometry args={[8, 0.5]} />
                        <animated.meshBasicMaterial color="#333" transparent opacity={opacity.to(o => o * 0.3)} />
                    </animated.mesh>
                </group>
            ))}
        </animated.group>
    );
};
