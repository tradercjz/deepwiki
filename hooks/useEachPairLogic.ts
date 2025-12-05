
import { useMemo } from 'react';
import { EACH_PRE_X, PairFunc } from '../constants';

export interface EachPairStep {
    index: number;
    val1: number; // The main value (X[i])
    val2: number; // The partner value (X[i-1] or Pre, X[i+1] or Post)
    val2Type: 'data' | 'boundary'; // Is partner from data or boundary?
    result: number;
    debugStr: string;
}

export const useEachPairLogic = (
    mode: 'pre' | 'post', 
    func: PairFunc, 
    boundaryVal: number
) => {
    return useMemo(() => {
        const X = EACH_PRE_X;
        const steps: EachPairStep[] = [];

        // Operation logic based on func
        // Note: eachPre(sub, X) -> sub(X[i], X[i-1]) -> X[i] - X[i-1]
        // Note: eachPost(sub, X) -> sub(X[i], X[i+1]) -> X[i] - X[i+1]
        
        const calc = (a: number, b: number) => {
            if (func === 'sub') return a - b;
            if (func === 'add') return a + b;
            if (func === 'ratio') return Number((a / b).toFixed(2));
            return 0;
        };

        const funcSym = func === 'sub' ? '-' : (func === 'add' ? '+' : '/');

        for (let i = 0; i < X.length; i++) {
            const current = X[i];
            let partner = 0;
            let partnerType: 'data' | 'boundary' = 'data';
            let res = 0;
            let debugStr = "";

            if (mode === 'pre') {
                // eachPre: Pair with Previous
                // Syntax: F(current, previous)
                if (i === 0) {
                    partner = boundaryVal;
                    partnerType = 'boundary';
                } else {
                    partner = X[i - 1];
                    partnerType = 'data';
                }
                
                // Logic: F(current, pre)
                // Note: DolphinDB eachPre(sub, x) usually implies x - pre.
                // Ex: -:P x  => [x0 - pre, x1 - x0, ...]
                // Let's assume standard application F(X[i], Partner)
                res = calc(current, partner);
                debugStr = `${current} ${funcSym} ${partner} = ${res}`;

            } else {
                // eachPost: Pair with Next
                // Syntax: F(current, next)
                if (i === X.length - 1) {
                    partner = boundaryVal;
                    partnerType = 'boundary';
                } else {
                    partner = X[i + 1];
                    partnerType = 'data';
                }

                // Logic: F(current, post)
                res = calc(current, partner);
                debugStr = `${current} ${funcSym} ${partner} = ${res}`;
            }

            steps.push({
                index: i,
                val1: current,
                val2: partner,
                val2Type: partnerType,
                result: res,
                debugStr
            });
        }

        return steps;
    }, [mode, func, boundaryVal]);
};
