import { useMemo } from 'react';

export interface BucketItem {
    id: number;
    val: number;
    bucketIndex: number | null; // null for NULL
    bucketLabel: string; // e.g. "[12, 33)" or "< 12"
    isOutbound: boolean;
}

export interface BucketDef {
    index: number;
    label: string;
    range: [number, number]; // [start, end)
    isOutbound: boolean;
}

export const useBucketLogic = (rangeStart: number, rangeEnd: number, bucketNum: number, includeOutbound: boolean) => {
    // Sample data matching the example
    const rawData = [9, 23, 54, 36, 46, 12]; 

    return useMemo(() => {
        const rangeSize = rangeEnd - rangeStart;
        const bucketSize = rangeSize / bucketNum;

        // Define Buckets
        const buckets: BucketDef[] = [];
        
        let currentIndex = 0;

        // Lower outbound
        if (includeOutbound) {
            buckets.push({
                index: currentIndex++,
                label: `< ${rangeStart}`,
                range: [-Infinity, rangeStart],
                isOutbound: true
            });
        }

        // Main buckets
        for (let i = 0; i < bucketNum; i++) {
            const start = rangeStart + i * bucketSize;
            const end = rangeStart + (i + 1) * bucketSize;
            buckets.push({
                index: currentIndex++,
                label: `[${start}, ${end})`,
                range: [start, end],
                isOutbound: false
            });
        }

        // Upper outbound
        if (includeOutbound) {
            buckets.push({
                index: currentIndex++,
                label: `>= ${rangeEnd}`,
                range: [rangeEnd, Infinity],
                isOutbound: true
            });
        }

        // Process Items
        const items: BucketItem[] = rawData.map((val, i) => {
            let bucketIndex: number | null = null;
            let bucketLabel = "";
            let isOutbound = false;

            if (val < rangeStart) {
                if (includeOutbound) {
                    bucketIndex = 0;
                    bucketLabel = `< ${rangeStart}`;
                    isOutbound = true;
                } else {
                    bucketIndex = null;
                    bucketLabel = "NULL";
                    isOutbound = true;
                }
            } else if (val >= rangeEnd) {
                if (includeOutbound) {
                    bucketIndex = bucketNum + 1; // 0 (lower) + bucketNum (main) -> index is bucketNum + 1
                    bucketLabel = `>= ${rangeEnd}`;
                    isOutbound = true;
                } else {
                    bucketIndex = null;
                    bucketLabel = "NULL";
                    isOutbound = true;
                }
            } else {
                // Inside range
                const offset = val - rangeStart;
                const rawIdx = Math.floor(offset / bucketSize);
                // Clamp in case of precision issues, though floor should handle it. 
                // Note: val >= rangeEnd is already handled, so rawIdx should be < bucketNum.
                const idx = Math.min(rawIdx, bucketNum - 1);
                
                bucketIndex = includeOutbound ? idx + 1 : idx;
                
                const bStart = rangeStart + idx * bucketSize;
                const bEnd = rangeStart + (idx + 1) * bucketSize;
                bucketLabel = `[${bStart}, ${bEnd})`;
                isOutbound = false;
            }

            return {
                id: i,
                val,
                bucketIndex,
                bucketLabel,
                isOutbound
            };
        });

        return { items, buckets, rangeStart, rangeEnd, bucketNum, includeOutbound };
    }, [rangeStart, rangeEnd, bucketNum, includeOutbound]);
};
