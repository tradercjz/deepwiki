import * as THREE from 'three';

// Data for a word instance on the "infinite tape"
export interface WordInstance {
    uniqueId: string; // e.g., "lane0-idx105"
    text: string;
    laneIdx: number;
    globalIndex: number; // The absolute index on the tape (0 to Infinity)
    worldX: number; // The calculated world X position at the current time
    baseY: number;
    color: THREE.Color;
}

export interface LaneParams {
    waveFreq: number;
    waveAmp: number;
    breatheFreq: number;
    breatheIntensity: number;
    depthFreq: number;
    depthAmp: number;
    phase: number;
    speedFreq: number; // Breathing speed frequency
    speedAmp: number;  // Breathing speed amplitude (position surge)
}

export interface MatchResult {
    char: string;
    laneIdx: number;
    wordId: string;
    charIdx: number;
    position: THREE.Vector3;
    targetLaneOrder: number; // 目标通道顺序 (0=D, 1=O, 2=L, ...)
}

export class WordFlowMatcher {
    lanes: LaneParams[];
    baseSpeeds: number[];
    allWords: string[];
    colors: THREE.Color[];
    targetWords: string[];

    // Layout Constants
    WORD_SPACING: number;
    Y_STEP: number;
    // Reduced Viewport Width to match Camera FOV (approx 60 deg at distance 1000)
    // Width ~ 1150 to 1200. Setting strict 1100 to ensure completely visible.
    VIEWPORT_WIDTH: number = 1100;

    isPaused: boolean = false;

    // Lane reordering state for bubble sort animation
    laneReorderMap: Map<number, number> = new Map(); // original lane -> target order (0-6 for D-O-L-P-H-I-N)
    laneReorderProgress: number = 0; // 0 = original positions, 1 = fully reordered

    // Bubble sort animation state
    bubbleSortSwaps: Array<[number, number]> = []; // List of swap pairs (laneA, laneB)
    currentSwapIndex: number = 0; // Current swap being animated
    currentSwapProgress: number = 0; // Progress of current swap (0-1)
    currentLanePositions: Map<number, number> = new Map(); // Current visual position of each lane

    // Track consumed words to avoid reuse
    consumedWordIds: Set<string> = new Set();

    // Cache for stable WordInstance object references (Performance Optimization)
    private wordInstanceCache: Map<string, WordInstance> = new Map();

    // Prevent reusing the same function name
    private consumedFunctions: Set<string> = new Set();

    // Track departure times for entire lanes
    // Value: { time: departureTime, cutoffTerm: globalIndex above which words do NOT accelerate }


    constructor(
        lanes: LaneParams[],
        baseSpeeds: number[],
        allWords: string[],
        colors: THREE.Color[],
        targetWords: string[],
        WORD_SPACING: number = 600,
        Y_STEP: number = 160
    ) {
        this.lanes = lanes;
        this.baseSpeeds = baseSpeeds;
        this.allWords = allWords;
        this.colors = colors;
        this.targetWords = targetWords;
        this.WORD_SPACING = WORD_SPACING;
        this.Y_STEP = Y_STEP;
    }

    // Track permanent shifts as lists of intervals: { idx: number, shift: number }
    // Sorted DESC by idx (max index first).
    laneOffsets: Map<number, { idx: number, shift: number }[]> = new Map();

    // Transient offsets for the current frame
    tempOffsets: Map<number, { idx: number, shift: number }[]> = new Map();




    // Called every frame
    updateActiveOffsets(path: MatchResult[] | null, time: number, convergence: number) {
        this.tempOffsets.clear();
        return; // DISABLE shifting logic to prevent X-axis jumps
        if (!path || convergence <= 0.01) return;

        path.forEach(p => {
            const [lStr, gStr] = p.wordId.split('-');
            const laneIdx = parseInt(lStr);
            const globalIndex = parseInt(gStr);

            const rawPos = this.getWordPosition(laneIdx, globalIndex, time, 0);
            if (rawPos.x < -100) {
                const targetX = -50;
                const fullShift = targetX - rawPos.x;
                const currentShift = fullShift * convergence * 0.7; // Factor

                if (!this.tempOffsets.has(laneIdx)) this.tempOffsets.set(laneIdx, []);
                const list = this.tempOffsets.get(laneIdx)!;
                list.push({ idx: globalIndex, shift: currentShift });
            }
        });

        this.tempOffsets.forEach(list => list.sort((a, b) => b.idx - a.idx));
    }

    // Get the core position (without characters offset)
    getWordPosition(
        laneIdx: number,
        globalIndex: number,
        time: number,
        _convergenceFactor: number = 0,
        _isActiveMatch: boolean = false
    ): THREE.Vector3 {
        // const uniqueId = `${laneIdx}-${globalIndex}`; // Not used for shifts anymore
        const params = this.lanes[laneIdx];
        const speed = this.baseSpeeds[laneIdx];

        // Left-to-Right Logic:
        // User Request: No backward fluctuation. Strict Left-to-Right.
        // Removed 'surge' (sine wave) that caused retrograde motion.
        const effectiveTime = time;

        // Pos = T*S - i*P
        // User reported "moving left" (retrograde motion). This happens if the derivative of the surge term is too negative.
        // We must ensure the total velocity is always positive.
        // v_total = speed + d(surge)/dt.
        // If surge = A * sin(wt), d/dt = A*w * cos(wt). Min value is -A*w.
        // We need speed > A*w.
        // Let's enforce a "Safe Amplitude" that guarantees distinct breathing but NO backward movement.
        // Max allow back-swing velocity to be 50% of base speed.
        // A * w = 0.5 * speed  =>  A = (0.5 * speed) / w
        const maxSafeAmp = (0.5 * speed) / (params.speedFreq + 0.01);
        const actualAmp = Math.min(params.speedAmp, maxSafeAmp);

        const speedSurge = Math.sin(effectiveTime * params.speedFreq + params.phase) * actualAmp;
        let worldX = (effectiveTime * speed) + speedSurge - (globalIndex * this.WORD_SPACING);

        // Mark function name as consumed
        // (Re-implemented here simple inline version if needed, or rely on solveTarget doing it)
        // Actually solveTarget ALREADY marks consumedWordIds.
        // But consumedFunctions needs to be handled?
        // consumedFunctions logic was inside markDeparture. I should move it to solveTarget or handle it elsewhere if I want unique functions.
        // The user wants UNIQUE functions. 
        // So I should keep the logic that adds to consumedFunctions, but maybe inside solveTarget or a new simple helper.
        // For now, I will remove markDeparture. I will verify if solveTarget handles consumedFunctions.


        const spatialFreq = 0.002;


        // Original lane Y position
        const originalLaneCenterY = (laneIdx - (this.lanes.length - 1) / 2) * this.Y_STEP;

        // Target lane Y position (if reordering is active)
        let targetLaneCenterY = originalLaneCenterY;
        if (this.laneReorderMap.has(laneIdx)) {
            const targetOrder = this.laneReorderMap.get(laneIdx)!;
            targetLaneCenterY = (targetOrder - (this.lanes.length - 1) / 2) * this.Y_STEP;
        }

        // Interpolate between original and target Y based on eased progress
        const easedProgress = this.easeInOutQuad(this.laneReorderProgress);
        const laneCenterY = originalLaneCenterY + (targetLaneCenterY - originalLaneCenterY) * easedProgress;

        // DAMPEN Waves for matched lanes during reorder to ensure perfect alignment
        let waveFactor = 1.0;
        if (this.laneReorderMap.has(laneIdx)) {
            waveFactor = 1.0 - easedProgress;
        }

        const waveY = Math.sin(time * params.waveFreq + globalIndex * 100 * spatialFreq) * params.waveAmp * waveFactor;
        const normalY = laneCenterY + waveY;

        const waveZ = Math.cos(time * params.depthFreq + globalIndex * 100 * spatialFreq * 0.5) * params.depthAmp * waveFactor;
        const normalZ = 150 + waveZ;

        let finalX = worldX;

        // Shift Logic: Find "Nearest Downstream" source. 
        // Downstream = Smaller Index (Right side).
        // I follow if source.idx <= my.idx.
        // Lists are sorted DESC (Max First).
        // We want the Largest Source Index that is <= My Index.

        let shift = 0;
        let found = false;

        // 1. Check Temp
        const temp = this.tempOffsets.get(laneIdx);
        if (temp) {
            for (const t of temp) {
                if (t.idx <= globalIndex) {
                    shift = t.shift;
                    found = true;
                    break;
                }
            }
        }

        // 2. Check Permanent
        if (!found) {
            const perm = this.laneOffsets.get(laneIdx);
            if (perm) {
                for (const p of perm) {
                    if (p.idx <= globalIndex) {
                        shift = p.shift;
                        break;
                    }
                }
            }
        }

        finalX += shift;

        return new THREE.Vector3(finalX, normalY, normalZ);
    }

    getCharPosition(
        laneIdx: number,
        globalIndex: number,
        text: string,
        charIdx: number,
        time: number,
        convergenceFactor: number = 0,
        isActiveMatch: boolean = false
    ): THREE.Vector3 {
        const centerPos = this.getWordPosition(laneIdx, globalIndex, time, convergenceFactor, isActiveMatch);
        const CHAR_WIDTH = 27.6; // 46 * 0.6
        const charOffset = (charIdx - (text.length - 1) / 2) * CHAR_WIDTH;
        return new THREE.Vector3(centerPos.x + charOffset, centerPos.y, centerPos.z);
    }

    // Helper to get consistent text for any logical position
    getWordText(laneIdx: number, globalIndex: number): string {
        // Add a "salt" offset per lane so they don't look identical
        // 53 is a prime number to avoid patterns aligning too often
        const offset = laneIdx * 53;
        const len = this.allWords.length;
        // Handle negative indices correctly if they occur
        const index = ((globalIndex + offset) % len + len) % len;
        return this.allWords[index];
    }

    // Retrieve all currently plausible word instances with STABLE REFERENCES
    getVisibleWords(time: number): WordInstance[] {
        const results: WordInstance[] = [];
        const buffer = 400; // Rendering buffer
        const leftLimit = -this.VIEWPORT_WIDTH - buffer;
        const rightLimit = this.VIEWPORT_WIDTH + buffer;

        const currentFrameKeys = new Set<string>();

        this.lanes.forEach((params, laneIdx) => {
            const speed = this.baseSpeeds[laneIdx];
            const dist = time * speed;

            const minIndex = Math.floor((dist - rightLimit) / this.WORD_SPACING);
            const maxIndex = Math.floor((dist - leftLimit) / this.WORD_SPACING);

            for (let i = minIndex; i <= maxIndex; i++) {
                if (i < 0) continue;

                const uniqueId = `${laneIdx}-${i}`;
                currentFrameKeys.add(uniqueId);

                let wordInst = this.wordInstanceCache.get(uniqueId);

                // If not cached, create new
                if (!wordInst) {
                    const text = this.getWordText(laneIdx, i);
                    const color = this.colors[(laneIdx + i) % this.colors.length];
                    // Initial pos
                    const pos = this.getWordPosition(laneIdx, i, time);

                    wordInst = {
                        uniqueId,
                        globalIndex: i,
                        laneIdx,
                        text,
                        worldX: pos.x,
                        baseY: pos.y,
                        color
                    };
                    this.wordInstanceCache.set(uniqueId, wordInst);
                } else {
                    // Update dynamic properties for Scan Logic (worldX is used there)
                    const pos = this.getWordPosition(laneIdx, i, time);
                    wordInst.worldX = pos.x;
                    wordInst.baseY = pos.y;
                }

                results.push(wordInst);
            }
        });

        // Cleanup cache for invisible words preventing memory leak
        for (const key of this.wordInstanceCache.keys()) {
            if (!currentFrameKeys.has(key)) {
                this.wordInstanceCache.delete(key);
            }
        }

        return results;
    }

    // Track last match time to prevent spamming easy words
    lastMatchTimes: Map<string, number> = new Map();

    scan(time: number): { path: MatchResult[], target: string } | null {
        if (this.isPaused) return null;

        // strict visible logic only for words cleanly inside the bounds
        const visibleWords = this.getVisibleWords(time);

        // Strict Filter: Must be within viewport AND not consumed
        // User Request: "Do not select if right side is out of screen". 
        // Current Flow: Left to Right. Exiting on Right.
        // We limit worldX (Center) to be safe. 
        // Reduced from 200 to -100 to ensure we pick words EARLY (Left side), giving them plenty of time to play animation.
        const strictVisible = visibleWords.filter(w => {
            const halfWidth = (w.text.length * 28) / 2;
            const rightEdge = w.worldX + halfWidth;
            // Ensure strictly inside visual range (approx +/- 900)
            const VISUAL_RIGHT = 800;

            return w.worldX > -this.VIEWPORT_WIDTH &&
                w.worldX < -100 && // Only pick if center is on the LEFT half
                rightEdge < VISUAL_RIGHT &&
                !this.consumedWordIds.has(w.uniqueId);
        });

        for (const target of this.targetWords) {
            // Check Cooldown
            const lastTime = this.lastMatchTimes.get(target) || -9999;
            // User Request: "Selected words must wait 10s before next selection"
            let cooldown = 10.0;
            if (target.length <= 4) cooldown = 15.0; // "CEP", "ORCA": hard throttle

            if (time - lastTime < cooldown) continue;

            const path = this.solveTarget(target, strictVisible, time);
            if (path) {
                // Mark words as consumed!
                path.forEach(p => this.consumedWordIds.add(p.wordId));
                this.lastMatchTimes.set(target, time);
                return { path, target };
            }
        }
        return null;
    }

    solveTarget(target: string, visibleWords: WordInstance[], time: number): MatchResult[] | null {
        // New algorithm: Each lane picks one letter from a function
        // DOLPHIN = 7 letters, 7 lanes
        if (target.length !== this.lanes.length) {
            // Fallback: target length must equal lane count
            return null;
        }

        const path: MatchResult[] = [];
        const usedLanes = new Set<number>();

        // For each character in target, find a word in a unique lane that contains it
        for (let charIndex = 0; charIndex < target.length; charIndex++) {
            const neededChar = target[charIndex].toUpperCase();

            // Find candidates: words in lanes not yet used, containing the needed char
            const candidates = visibleWords.filter(w => {
                if (usedLanes.has(w.laneIdx)) return false;
                if (this.consumedFunctions.has(w.text)) return false; // Don't reuse matched functions
                return w.text.toUpperCase().includes(neededChar);
            });

            if (candidates.length === 0) {
                return null; // Cannot match this character
            }

            // Sort by worldX for consistent selection (pick leftmost visible)
            candidates.sort((a, b) => a.worldX - b.worldX);

            // Pick the first valid candidate
            const word = candidates[0];
            const charIdxInWord = word.text.toUpperCase().indexOf(neededChar);
            const exactPos = this.getCharPosition(word.laneIdx, word.globalIndex, word.text, charIdxInWord, time, 0);

            path.push({
                char: neededChar,
                laneIdx: word.laneIdx,
                wordId: word.uniqueId,
                charIdx: charIdxInWord,
                position: exactPos,
                targetLaneOrder: (this.lanes.length - 1) - charIndex // Reverse order: D=6 (Top), N=0 (Bottom)
            });

            usedLanes.add(word.laneIdx);
        }

        // Set up lane reorder map for animation
        this.laneReorderMap.clear();
        path.forEach(match => {
            this.laneReorderMap.set(match.laneIdx, match.targetLaneOrder);

            // Mark function name as consumed to prevent reuse
            // Logic moved here from deleted markDeparture
            const [lStr, gStr] = match.wordId.split('-');
            const text = this.getWordText(parseInt(lStr), parseInt(gStr));
            this.consumedFunctions.add(text);
        });

        return path;
    }

    // Start the lane reorder animation
    startLaneReorder() {
        this.laneReorderProgress = 0;
    }

    // Update lane reorder animation progress (Direct movement with easing)
    updateLaneReorderProgress(delta: number, speed: number = 0.5) {
        if (this.laneReorderProgress < 1) {
            this.laneReorderProgress = Math.min(1, this.laneReorderProgress + delta * speed);
        }
    }

    // Easing function for smooth animation
    // Using easeInOutQuad for smoother start/end
    public easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Reset lane reorder state
    resetLaneReorder() {
        this.laneReorderMap.clear();
        this.laneReorderProgress = 0;
    }

    // Check if reorder animation is complete
    isReorderComplete(): boolean {
        return this.laneReorderProgress >= 1;
    }
}
