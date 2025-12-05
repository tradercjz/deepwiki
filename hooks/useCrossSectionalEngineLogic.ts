
import { useMemo } from 'react';
import { CSE_DATA } from '../constants';

export interface CSESnapshotItem {
  sym: string;
  price: number;
  vol: number;
  time: string;
  isUpdatedThisStep: boolean;
}

export interface CSEStep {
  index: number;
  data: { time: string; sym: string; price: number; vol: number };
  snapshot: CSESnapshotItem[]; // The state of the cross-section
  metrics: { avgPrice: number; totalVol: number; dollarVol: number; count: number };
  outputHistory: { time: string; avgPrice: number; totalVol: number; dollarVol: number; count: number }[];
  debugStr: string;
}

export const useCrossSectionalEngineLogic = () => {
  return useMemo(() => {
    const rawData = CSE_DATA;
    const steps: CSEStep[] = [];
    
    // Engine Memory: Map<Sym, Record>
    const snapshotMap = new Map<string, { price: number; vol: number; time: string }>();
    const outputHistory: { time: string; avgPrice: number; totalVol: number; dollarVol: number; count: number }[] = [];

    // Keys expected (for visualization stability, usually dynamic)
    const allKeys = Array.from(new Set(rawData.map(d => d.sym))).sort();

    for (let i = 0; i < rawData.length; i++) {
        const item = rawData[i];
        
        // 1. Update Snapshot
        snapshotMap.set(item.sym, { price: item.price, vol: item.vol, time: item.time });

        // 2. Calculate Cross-Sectional Metrics (e.g. perRow trigger)
        let totalPrice = 0;
        let totalVol = 0;
        let dollarVol = 0;
        let count = 0;

        const currentSnapshotState: CSESnapshotItem[] = [];

        allKeys.forEach(sym => {
            const record = snapshotMap.get(sym);
            if (record) {
                totalPrice += record.price;
                totalVol += record.vol;
                dollarVol += (record.price * record.vol);
                count++;
                currentSnapshotState.push({
                    sym, 
                    price: record.price, 
                    vol: record.vol, 
                    time: record.time,
                    isUpdatedThisStep: sym === item.sym
                });
            } else {
                currentSnapshotState.push({
                    sym, 
                    price: 0, vol: 0, time: '-', 
                    isUpdatedThisStep: false 
                });
            }
        });

        const avgPrice = count > 0 ? totalPrice / count : 0;
        
        // Add to output history
        outputHistory.push({
            time: item.time,
            avgPrice: Number(avgPrice.toFixed(2)),
            totalVol,
            dollarVol: Number(dollarVol.toFixed(0)),
            count
        });

        steps.push({
            index: i,
            data: item,
            snapshot: currentSnapshotState,
            metrics: { avgPrice, totalVol, dollarVol, count },
            outputHistory: [...outputHistory],
            debugStr: `Update ${item.sym}.\nSnapshot Size: ${count}\nAvgPrice: ${avgPrice.toFixed(2)}, $Vol: ${dollarVol}`
        });
    }

    return steps;
  }, []);
};
