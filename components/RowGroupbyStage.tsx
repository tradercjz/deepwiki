import React from 'react';
import { Text, RoundedBox, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { RowGroupbyStep } from '../hooks/useRowGroupbyLogic';
import { COLORS, RowGroupbyMode } from '../constants';

interface RowGroupbyStageProps {
  progress: number;
  steps: RowGroupbyStep[];
  mode?: RowGroupbyMode;
}

export const RowGroupbyStage: React.FC<RowGroupbyStageProps> = ({ progress, steps, mode = 'tuple' }) => {
  // Animation Phases
  // 0-1: Inputs (Cards appear)
  // 1-2: Sort (Cards move to sorted order)
  // 2-3: Group (Cards cluster, Brackets appear)
  // 3-4: Calculate (Show math)
  // 4-5: Result (Collapse to result)

  const phase = Math.min(Math.floor(progress), 4);
  const subProgress = progress - phase;

  return (
    <group position={[0, 0, 0]}>
      <Text position={[0, 6, 0]} fontSize={0.6} color="white" fontWeight="bold">
        rowGroupby(func, M, G, mode='{mode}')
      </Text>

      {/* Headers */}
      <Text position={[-6, 5, 0]} fontSize={0.4} color="#aaa">Input (M, G)</Text>
      <Text position={[0, 5, 0]} fontSize={0.4} color="#aaa">Sort & Group</Text>
      <Text position={[6, 5, 0]} fontSize={0.4} color="#aaa">Result</Text>

      {steps.map((step, idx) => (
        <RowRenderer 
            key={idx} 
            step={step} 
            y={3 - idx * 3.5} // Increased spacing
            phase={phase} 
            subProgress={subProgress}
            mode={mode}
        />
      ))}
    </group>
  );
};

interface RowRendererProps {
    step: RowGroupbyStep;
    y: number;
    phase: number;
    subProgress: number;
    mode: RowGroupbyMode;
}

const RowRenderer: React.FC<RowRendererProps> = ({ step, y, phase, subProgress, mode }) => {
    // Calculate group positions
    // We want to center the groups in the middle area.
    // Total width available is roughly -4 to 4.
    const totalGroups = step.groups.length;
    const groupSpacing = 2.5;
    const startGroupX = -((totalGroups - 1) * groupSpacing) / 2;

    return (
        <group position={[0, y, 0]}>
            {/* Row Label */}
            <Text position={[-9, 0, 0]} fontSize={0.3} color="#666">
                Row {step.rowIndex}
            </Text>

            {/* Input Items (Cards) */}
            {step.inputM.map((val, i) => {
                const gVal = step.inputG[i];
                // Find where this item ends up
                const sortedIdx = step.sortedPairs.findIndex(p => p.m === val && p.g === gVal); // Note: duplicate values might cause visual swapping, acceptable for demo
                
                // Find which group it belongs to
                const groupIdx = step.groups.findIndex(g => g.key === gVal);
                const group = step.groups[groupIdx];
                const posInGroup = group.values.indexOf(val); // Again, duplicates might be tricky but ok
                
                // Calculate target X for Group Phase
                const groupX = startGroupX + groupIdx * groupSpacing;
                // Offset within group to center items
                const itemSpacing = 0.8;
                const groupWidth = (group.values.length - 1) * itemSpacing;
                const itemXInGroup = groupX + (posInGroup * itemSpacing) - (groupWidth / 2);

                return (
                    <InputCard 
                        key={`card-${i}`}
                        m={val}
                        g={gVal}
                        idx={i}
                        total={step.inputM.length}
                        sortedIdx={sortedIdx}
                        targetX={itemXInGroup}
                        phase={phase}
                        subProgress={subProgress}
                    />
                );
            })}

            {/* Group Containers & Calculation */}
            {step.groups.map((group, i) => {
                const groupX = startGroupX + i * groupSpacing;
                const groupWidth = Math.max(1.5, group.values.length * 0.8 + 0.2);
                
                return (
                    <GroupContainer
                        key={`group-${i}`}
                        x={groupX}
                        width={groupWidth}
                        keyVal={group.key}
                        values={group.values}
                        result={group.result}
                        phase={phase}
                        subProgress={subProgress}
                    />
                );
            })}

            {/* Final Results */}
            {/* Render based on mode */}
            {mode === 'tuple' && (
                <TupleResult 
                    keys={step.finalResult.keys} 
                    values={step.finalResult.values} 
                    phase={phase} 
                    subProgress={subProgress} 
                />
            )}
            {mode === 'dict' && (
                <DictResult 
                    keys={step.finalResult.keys} 
                    values={step.finalResult.values} 
                    phase={phase} 
                    subProgress={subProgress} 
                />
            )}
            {mode === 'table' && (
                <TableResult 
                    keys={step.finalResult.keys} 
                    values={step.finalResult.values} 
                    phase={phase} 
                    subProgress={subProgress} 
                />
            )}
        </group>
    );
};

interface InputCardProps {
    m: number;
    g: number;
    idx: number;
    total: number;
    sortedIdx: number;
    targetX: number;
    phase: number;
    subProgress: number;
}

const InputCard: React.FC<InputCardProps> = ({ m, g, idx, total, sortedIdx, targetX, phase, subProgress }) => {
    // Phase 0: Stacked on left
    const startX = -7 + (idx * 0.8);
    
    // Phase 1: Sorted but still somewhat left/center? 
    // Let's move straight to targetX but maybe with a "sorting" step visually?
    // Actually, let's just move to targetX during Phase 1-2.
    
    let x = startX;
    let y = 0;
    let opacity = 1;
    let scale = 1;

    if (phase === 0) {
        x = startX;
    } else if (phase === 1) {
        // Move to sorted order (intermediate)
        // Let's just move to targetX for simplicity, as targetX is sorted/grouped position
        const p = subProgress;
        x = startX + (targetX - startX) * p;
    } else if (phase >= 2) {
        x = targetX;
    }

    if (phase >= 4) {
        // Disappear
        opacity = 1 - subProgress;
        scale = 1 - subProgress;
    }

    return (
        <animated.group position={[x, y, 0]} scale={scale}>
            {/* Card Body */}
            <RoundedBox args={[0.7, 1.2, 0.1]} radius={0.05}>
                <meshStandardMaterial color="#333" transparent opacity={opacity} />
            </RoundedBox>
            
            {/* M Value (Top) */}
            <Text position={[0, 0.3, 0.1]} fontSize={0.25} color={COLORS.primary} fillOpacity={opacity}>
                {m}
            </Text>
            <Text position={[0, 0.1, 0.1]} fontSize={0.15} color="#888" fillOpacity={opacity}>
                (Val)
            </Text>

            {/* Divider */}
            <Line points={[[-0.3, 0, 0.1], [0.3, 0, 0.1]]} color="#555" lineWidth={1} transparent opacity={opacity} />

            {/* G Value (Bottom) */}
            <Text position={[0, -0.3, 0.1]} fontSize={0.25} color={COLORS.secondary} fillOpacity={opacity}>
                {g}
            </Text>
            <Text position={[0, -0.5, 0.1]} fontSize={0.15} color="#888" fillOpacity={opacity}>
                (Grp)
            </Text>
        </animated.group>
    );
};

interface GroupContainerProps {
    x: number;
    width: number;
    keyVal: number;
    values: number[];
    result: number;
    phase: number;
    subProgress: number;
}

const GroupContainer: React.FC<GroupContainerProps> = ({ x, width, keyVal, values, result, phase, subProgress }) => {
    // Phase 2: Appear
    // Phase 3: Show Math
    // Phase 4: Disappear

    const showContainer = phase >= 2 && phase < 4;
    const containerOpacity = phase === 2 ? subProgress : (phase === 3 ? 1 : 1 - subProgress);
    
    const showMath = phase === 3;
    const mathOpacity = phase === 3 ? subProgress : 0;

    return (
        <group position={[x, 0, -0.1]}>
            {/* Bracket/Box */}
            {showContainer && (
                <animated.group>
                    <RoundedBox args={[width, 1.4, 0.05]} radius={0.1}>
                        <meshStandardMaterial color="#222" transparent opacity={containerOpacity * 0.5} />
                    </RoundedBox>
                    <Line 
                        points={[
                            [-width/2, -0.8, 0], 
                            [-width/2, 0.8, 0], 
                            [width/2, 0.8, 0], 
                            [width/2, -0.8, 0]
                        ]} 
                        color={COLORS.secondary} 
                        lineWidth={2} 
                        transparent 
                        opacity={containerOpacity} 
                    />
                    {/* Group Label */}
                    <Text position={[0, -0.9, 0]} fontSize={0.2} color={COLORS.secondary} fillOpacity={containerOpacity}>
                        Group {keyVal}
                    </Text>
                </animated.group>
            )}

            {/* Math Callout */}
            {showMath && (
                <animated.group position={[0, 1, 0]}>
                    <Text fontSize={0.3} color={COLORS.success} fillOpacity={mathOpacity}>
                        {values.join(' + ')} = {result}
                    </Text>
                </animated.group>
            )}
        </group>
    );
};

// --- Result Renderers ---

const TupleResult: React.FC<{ keys: number[], values: number[], phase: number, subProgress: number }> = ({ keys, values, phase, subProgress }) => {
    if (phase < 4) return null;
    const p = subProgress;
    const x = 5;
    
    return (
        <animated.group position={[x, 0, 0]} scale={p}>
            {/* Tuple Element 0: Keys */}
            <Text position={[-1, 0.8, 0]} fontSize={0.2} color="#aaa">Keys (Tuple[0])</Text>
            <RoundedBox args={[keys.length * 0.8 + 0.2, 0.6, 0.1]} position={[0, 0.5, 0]} radius={0.1}>
                <meshStandardMaterial color="#333" />
            </RoundedBox>
            <Text position={[0, 0.5, 0.1]} fontSize={0.3} color={COLORS.secondary}>
                [{keys.join(', ')}]
            </Text>

            {/* Tuple Element 1: Values */}
            <Text position={[-1, -0.2, 0]} fontSize={0.2} color="#aaa">Values (Tuple[1])</Text>
            <RoundedBox args={[values.length * 1.2 + 0.2, 0.6, 0.1]} position={[0, -0.5, 0]} radius={0.1}>
                <meshStandardMaterial color="#333" />
            </RoundedBox>
            <Text position={[0, -0.5, 0.1]} fontSize={0.3} color={COLORS.success}>
                [{values.join(', ')}]
            </Text>
        </animated.group>
    );
};

const DictResult: React.FC<{ keys: number[], values: number[], phase: number, subProgress: number }> = ({ keys, values, phase, subProgress }) => {
    if (phase < 4) return null;
    const p = subProgress;
    const x = 5;

    return (
        <animated.group position={[x, 0, 0]} scale={p}>
            <Text position={[0, 0.8, 0]} fontSize={0.2} color="#aaa">Dictionary</Text>
            {keys.map((k, i) => (
                <group key={i} position={[0, 0.4 - i * 0.5, 0]}>
                    <Text position={[-0.8, 0, 0]} fontSize={0.3} color={COLORS.secondary}>{k}</Text>
                    <Text position={[-0.2, 0, 0]} fontSize={0.3} color="white">:</Text>
                    <Text position={[0.8, 0, 0]} fontSize={0.3} color={COLORS.success}>{values[i]}</Text>
                </group>
            ))}
        </animated.group>
    );
};

const TableResult: React.FC<{ keys: number[], values: number[], phase: number, subProgress: number }> = ({ keys, values, phase, subProgress }) => {
    if (phase < 4) return null;
    const p = subProgress;
    const x = 5;

    return (
        <animated.group position={[x, 0, 0]} scale={p}>
            <Text position={[0, 0.8, 0]} fontSize={0.2} color="#aaa">Table</Text>
            
            {/* Header */}
            <group position={[0, 0.4, 0]}>
                <Text position={[-0.8, 0, 0]} fontSize={0.25} color="#aaa">Key</Text>
                <Text position={[0.8, 0, 0]} fontSize={0.25} color="#aaa">Value</Text>
                <Line points={[[-1.5, -0.2, 0], [1.5, -0.2, 0]]} color="#555" lineWidth={1} />
            </group>

            {/* Rows */}
            {keys.map((k, i) => (
                <group key={i} position={[0, 0 - i * 0.4, 0]}>
                    <Text position={[-0.8, 0, 0]} fontSize={0.3} color={COLORS.secondary}>{k}</Text>
                    <Text position={[0.8, 0, 0]} fontSize={0.3} color={COLORS.success}>{values[i]}</Text>
                </group>
            ))}
        </animated.group>
    );
};
