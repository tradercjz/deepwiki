
import { useMemo } from 'react';
import { SEGMENT_DATA, SegmentFunc } from '../constants';

export interface SegmentItem {
    id: number;
    segmentVal: number;
    inputVal: number;
    resultVal: number;
    groupIndex: number;
    indexInGroup: number;
    calcStr: string; // "2 + 3 = 5"
}

export interface SegmentGroup {
    id: number;
    segmentVal: number;
    startIndex: number;
    count: number;
    debugStr: string;
}

export interface SegmentbyState {
    items: SegmentItem[];
    groups: SegmentGroup[];
}

export const useSegmentbyLogic = (func: SegmentFunc) => {
    return useMemo(() => {
        const { x, segment } = SEGMENT_DATA;
        
        const items: SegmentItem[] = [];
        const groups: SegmentGroup[] = [];

        let currentSegVal = segment[0];
        let currentGroupItems: number[] = [];
        let groupStartIndex = 0;

        const processGroup = () => {
            if (currentGroupItems.length === 0) return;

            // Calculate Cumulative Logic
            let acc = currentGroupItems[0];
            const results = [acc];
            const calcStrings = [`Init: ${acc}`];
            
            for (let k = 1; k < currentGroupItems.length; k++) {
                const v = currentGroupItems[k];
                const prev = acc;
                let str = "";

                if (func === 'cumsum') {
                    acc += v;
                    str = `${prev} + ${v} = ${acc}`;
                } else if (func === 'cummax') {
                    acc = Math.max(acc, v);
                    str = `max(${prev}, ${v}) = ${acc}`;
                } else if (func === 'cummin') {
                    acc = Math.min(acc, v);
                    str = `min(${prev}, ${v}) = ${acc}`;
                }
                results.push(acc);
                calcStrings.push(str);
            }

            // Create Group Metadata
            groups.push({
                id: groups.length,
                segmentVal: currentSegVal,
                startIndex: groupStartIndex,
                count: currentGroupItems.length,
                debugStr: `Group ${currentSegVal}: ${func}`
            });

            // Map results back to items
            for (let k = 0; k < currentGroupItems.length; k++) {
                items.push({
                    id: groupStartIndex + k,
                    segmentVal: currentSegVal,
                    inputVal: currentGroupItems[k],
                    resultVal: results[k],
                    groupIndex: groups.length - 1,
                    indexInGroup: k,
                    calcStr: calcStrings[k]
                });
            }
        };

        for (let i = 0; i < x.length; i++) {
            if (segment[i] !== currentSegVal) {
                processGroup();
                currentSegVal = segment[i];
                currentGroupItems = [];
                groupStartIndex = i;
            }
            currentGroupItems.push(x[i]);
        }
        processGroup(); // Final group

        return { items, groups };

    }, [func]);
};
