import { useMemo } from 'react';

export interface SegmentItem {
    id: number;
    val: number | null;
    originalIndex: number;
    segmentId: number;
    segmentStart: number;
    result: number; // The value returned by segment() based on offset param
}

export const useSegmentLogic = (
    xStr: string,
    segmentOffset: boolean
) => {
    return useMemo(() => {
        const items: SegmentItem[] = [];
        const parts = xStr.split(',');
        
        // Parse input
        const rawValues = parts.map(p => {
            const trimmed = p.trim();
            if (trimmed.toLowerCase() === 'null' || trimmed === '') return null;
            const n = Number(trimmed);
            return isNaN(n) ? null : n;
        });

        // Calculate segments
        let currentSegmentId = 0;
        let currentSegmentStart = 0;
        
        rawValues.forEach((val, i) => {
            if (i > 0) {
                const prevVal = rawValues[i-1];
                if (val !== prevVal) {
                    currentSegmentId++;
                    currentSegmentStart = i;
                }
            }

            items.push({
                id: i,
                val,
                originalIndex: i,
                segmentId: currentSegmentId,
                segmentStart: currentSegmentStart,
                result: segmentOffset ? currentSegmentStart : currentSegmentId
            });
        });

        return { items, segmentOffset };
    }, [xStr, segmentOffset]);
};
