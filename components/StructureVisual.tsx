import React from 'react';
import { Text } from '@react-three/drei';
import { Value, ValueType } from '../lib/dolphindbParser';

export type NodeType = ValueType | 'bracket' | 'comma' | 'group';

export interface LayoutNode {
    id: string;
    val: string | number;
    x: number;
    y: number;
    type: NodeType;
    width: number;
    height: number;
    children: LayoutNode[];
}

const SCALAR_WIDTH = 0.8;
const BRACKET_WIDTH = 0.4;
const COMMA_WIDTH = 0.3;

export const calculateLayout = (v: Value, startX: number, startY: number): LayoutNode => {
    if (v.type === 'scalar') {
        return {
            id: v.id,
            val: v.val,
            x: startX + SCALAR_WIDTH / 2, // Center
            y: startY,
            type: 'scalar',
            width: SCALAR_WIDTH,
            height: 1,
            children: []
        };
    }

    if (v.type === 'vector' || v.type === 'tuple') {
        const elements = v.val as Value[];
        let currentX = startX;
        const childrenNodes: LayoutNode[] = [];
        
        // Left Bracket
        const leftChar = v.type === 'tuple' ? '(' : '[';
        childrenNodes.push({
            id: `${v.id}-left`,
            val: leftChar,
            x: currentX + BRACKET_WIDTH / 2,
            y: startY,
            type: 'bracket',
            width: BRACKET_WIDTH,
            height: 1,
            children: []
        });
        currentX += BRACKET_WIDTH;

        // Elements
        elements.forEach((e, i) => {
            const layout = calculateLayout(e, currentX, startY);
            childrenNodes.push(layout);
            currentX += layout.width;
            
            // Comma
            if (i < elements.length - 1) {
                childrenNodes.push({
                    id: `${v.id}-comma-${i}`,
                    val: ',',
                    x: currentX + COMMA_WIDTH / 2,
                    y: startY,
                    type: 'comma',
                    width: COMMA_WIDTH,
                    height: 1,
                    children: []
                });
                currentX += COMMA_WIDTH;
            }
        });
        
        // Right Bracket
        const rightChar = v.type === 'tuple' ? ')' : ']';
        childrenNodes.push({
            id: `${v.id}-right`,
            val: rightChar,
            x: currentX + BRACKET_WIDTH / 2,
            y: startY,
            type: 'bracket',
            width: BRACKET_WIDTH,
            height: 1,
            children: []
        });
        currentX += BRACKET_WIDTH;

        const totalWidth = currentX - startX;
        
        return {
            id: v.id,
            val: '',
            x: startX + totalWidth / 2, // Center of the group
            y: startY,
            type: 'group', // Use generic group type for container
            width: totalWidth,
            height: 1,
            children: childrenNodes
        };
    }
    
    return { id: 'err', val: '', x: 0, y: 0, type: 'scalar', width: 0, height: 0, children: [] };
};

// Flatten the tree to get all scalar nodes for animation
export const getScalarNodes = (node: LayoutNode): LayoutNode[] => {
    if (node.type === 'scalar') return [node];
    return node.children.flatMap(getScalarNodes);
};

// Recursive component to draw brackets/structure
export const StructureVisual = ({ node, opacity = 1 }: { node: LayoutNode, opacity?: number }) => {
    // If it's a leaf node (bracket or comma), render it
    if (node.type === 'bracket' || node.type === 'comma') {
        return (
            <Text 
                position={[0, 0, 0]} // Render at local origin (parent group handles positioning)
                fontSize={node.type === 'bracket' ? 0.6 : 0.4} 
                color="white" 
                fillOpacity={opacity} 
                anchorX="center" 
                anchorY="middle"
            >
                {node.val}
            </Text>
        );
    }

    // If scalar, do nothing (handled by AnimatedItem)
    if (node.type === 'scalar') return null;

    // If group, render children
    return (
        <group>
            {node.children.map((child) => (
                <group key={child.id} position={[child.x - node.x, child.y - node.y, 0]}>
                     <StructureVisual node={child} opacity={opacity} />
                </group>
            ))}
        </group>
    );
};
