
import React, { useState } from 'react';
import { FuncType, DATA_TIME, TM_TIMES, TM_INPUTS, AppMode, PIVOT_DATA, TS_ENGINE_DATA, RSE_DATA, CSE_DATA, ASOF_X, ASOF_Y, AGGR_TOPN_DATA, ACCUMULATE_DATA, AccFunc, EACH_DATA_X, EACH_DATA_Y, EACH_PRE_X, PairFunc, GROUPING_DATA, GroupFunc, SEGMENT_DATA, SegmentFunc, ROLLING_AAPL, ROLLING_SPY } from '../constants';
import { AggrFunc } from '../hooks/useAggrTopNLogic';

interface UIOverlayProps {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  progress: number;
  setProgress: (v: number) => void;
  totalSteps: number;
  hoveredIndex: number | null;
  results: any[];
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  params: {
    threshold: number; setThreshold: (v: number) => void;
    funcType: FuncType; setFuncType: (v: any) => void;
    funcWindow: number; setFuncWindow: (v: number) => void;
    pivotFunc?: 'last'|'sum'|'count'; setPivotFunc?: (v: any) => void;
    tsWindowSize?: number; setTsWindowSize?: (v: any) => void;
    tsStep?: number; setTsStep?: (v: any) => void;
    rseWindow?: number; setRseWindow?: (v: any) => void;
    aggrTopNFunc?: AggrFunc; setAggrTopNFunc?: (v: any) => void;
    aggrTopNTop?: number; setAggrTopNTop?: (v: any) => void;
    aggrTopNAsc?: boolean; setAggrTopNAsc?: (v: boolean) => void;
    accFunc?: AccFunc; setAccFunc?: (v: any) => void;
    pairFunc?: PairFunc; setPairFunc?: (v: any) => void;
    pairBoundary?: number; setPairBoundary?: (v: number) => void;
    groupFunc?: GroupFunc; setGroupFunc?: (v: any) => void;
    segmentFunc?: SegmentFunc; setSegmentFunc?: (v: any) => void;
    rollingWindow?: number; setRollingWindow?: (v: any) => void;
    rollingStep?: number; setRollingStep?: (v: any) => void;
  };
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  mode,
  setMode,
  progress,
  setProgress,
  totalSteps,
  hoveredIndex,
  results,
  isPlaying,
  setIsPlaying,
  params
}) => {
  const [copied, setCopied] = useState(false);
  const tooltipData = hoveredIndex !== null ? results[hoveredIndex] : null;

  const generateScript = () => {
    if (mode === 'conditionalIterate') {
        const timeVecStr = DATA_TIME.join(' ');
        let funcDef = "";
        if (params.funcType === 'tmsum') {
            funcDef = `tmsum{time, , ${params.funcWindow}}`;
        } else {
            funcDef = `${params.funcType}{, ${params.funcWindow}}`;
        }
      return `// DolphinDB Script for ConditionalIterate Verification
time = ${timeVecStr}
trade = table(time as time, take("A", 10) as sym, take(1 3 6, 10) as val0, take(10, 10) as val1)

// Engine Logic
// Cond: val0 > ${params.threshold}
// False: ${funcDef}(prevResult)

inputTable = streamTable(1:0, \`time\`sym\`val0\`val1, [INT, SYMBOL, INT, INT])
outputTable = table(100:0, \`sym\`factor, [STRING, DOUBLE])

rse = createReactiveStateEngine(name="rsTest", metrics=<conditionalIterate(val0 > ${params.threshold}, val1, ${funcDef})>, dummyTable=inputTable, outputTable=outputTable, keyColumn="sym")
rse.append!(trade)
select * from outputTable`;
    }

    if (mode === 'tmFunction') {
        const tStr = TM_TIMES.join(' ');
        const xStr = TM_INPUTS.join(' ');
        return `T = ${tStr}\nX = ${xStr}\nwindow = ${params.funcWindow}\nresult = tmsum(T, X, window)\nt = table(T, X, result)\nselect * from t`;
    }

    if (mode === 'pivot') {
        return `// Pivot\nsym = ${JSON.stringify(PIVOT_DATA.map(d => d.sym)).replace(/"/g, '`')}\ntime = ${JSON.stringify(PIVOT_DATA.map(d => d.time)).replace(/"/g, '"')}\nprice = ${JSON.stringify(PIVOT_DATA.map(d => d.price))}\nt = table(sym, time, price)\nresult = pivot(${params.pivotFunc || 'last'}, price, time, sym)\nselect * from result`;
    }

    if (mode === 'createTimeSeriesEngine') {
        return `share streamTable(1000:0, ["time","sym","volume"], [TIMESTAMP, SYMBOL, INT]) as trades\nshare table(10000:0, ["time","sym","sumVolume"], [TIMESTAMP, SYMBOL, INT]) as output1\nengine1 = createTimeSeriesEngine(name="engine1", windowSize=60000, step=60000, metrics=<[sum(volume)]>, dummyTable=trades, outputTable=output1, timeColumn="time", useSystemTime=false, keyColumn="sym", garbageSize=50, useWindowStartTime=false)\nsubscribeTable(tableName="trades", actionName="engine1", offset=0, handler=append!{engine1}, msgAsTable=true);\n// Insert data...\nselect * from output1;`;
    }

    if (mode === 'createReactiveStateEngine') {
        return `// Reactive State Engine Demo (Moving Average)\nshare streamTable(1:0, \`time\`sym\`price, [SECOND, SYMBOL, DOUBLE]) as ticks\nshare table(100:0, \`time\`sym\`factor1, [SECOND, STRING, DOUBLE]) as result\nrse = createReactiveStateEngine(name="rseDemo", metrics=[<time>, <sym>, <mavg(price, ${params.rseWindow})>], dummyTable=ticks, outputTable=result, keyColumn="sym")\nsubscribeTable(tableName=\`ticks, actionName="rse", handler=tableInsert{rse})`;
    }

    if (mode === 'createCrossSectionalEngine') {
        return `share streamTable(10:0,\`time\`sym\`price\`volume,[TIMESTAMP,SYMBOL,DOUBLE,INT]) as trades1\nshare table(1:0, \`time\`avgPrice\`volume\`dollarVolume\`count, [TIMESTAMP,DOUBLE,INT,DOUBLE,INT]) as outputTable\ncsEngine1=createCrossSectionalEngine(name="csEngineDemo1", metrics=<[avg(price), sum(volume), sum(price*volume), count(price)]>, dummyTable=trades1, outputTable=outputTable, keyColumn=\`sym, triggeringPattern="perRow", useSystemTime=false, timeColumn=\`time)\nsubscribeTable(tableName="trades1", actionName="tradesStats", offset=-1, handler=append!{csEngine1}, msgAsTable=true)`;
    }

    if (mode === 'asof') {
        return `X = ${ASOF_X.join(' ')}\nY = ${ASOF_Y.join(' ')}\nasof(X, Y)`;
    }
    
    if (mode === 'aggrTopN') {
        const func = params.aggrTopNFunc || 'sum';
        const top = params.aggrTopNTop || 3;
        const asc = params.aggrTopNAsc !== false;
        return `sortingCol = ${AGGR_TOPN_DATA.map(d => d.sortVal).join(' ')}\nfuncArgs = ${AGGR_TOPN_DATA.map(d => d.funcVal).join(' ')}\naggrTopN(${func}, funcArgs, sortingCol, ${top}, ${asc})`;
    }

    if (mode === 'accumulate') {
        const func = params.accFunc || 'sum';
        return `X = ${ACCUMULATE_DATA.join(' ')}\naccumulate(${func}, X)`;
    }

    if (mode === 'eachLeft') {
        return `X = ${EACH_DATA_X.join(' ')}\nY = ${EACH_DATA_Y.join(' ')}\neachLeft(add, X, Y) // or X +:L Y`;
    }

    if (mode === 'eachRight') {
        return `X = ${EACH_DATA_X.join(' ')}\nY = ${EACH_DATA_Y.join(' ')}\neachRight(add, X, Y) // or X +:R Y`;
    }

    if (mode === 'eachPre') {
        const op = params.pairFunc === 'sub' ? '-' : (params.pairFunc === 'add' ? '+' : '/');
        return `X = ${EACH_PRE_X.join(' ')}\neachPre(${params.pairFunc}, X, ${params.pairBoundary}) // or ${params.pairBoundary} ${op}:P X`;
    }

    if (mode === 'eachPost') {
        const op = params.pairFunc === 'sub' ? '-' : (params.pairFunc === 'add' ? '+' : '/');
        return `X = ${EACH_PRE_X.join(' ')}\neachPost(${params.pairFunc}, X, ${params.pairBoundary}) // or X ${op}:O ${params.pairBoundary}`;
    }

    if (mode === 'groupby') {
        const symStr = GROUPING_DATA.map(d => '`'+d.sym).join(' ');
        const valStr = GROUPING_DATA.map(d => d.val).join(' ');
        return `sym = ${symStr}\nval = ${valStr}\ngroupby(${params.groupFunc}, val, sym) // Returns table with unique syms`;
    }

    if (mode === 'contextby') {
        const symStr = GROUPING_DATA.map(d => '`'+d.sym).join(' ');
        const valStr = GROUPING_DATA.map(d => d.val).join(' ');
        return `sym = ${symStr}\nval = ${valStr}\ncontextby(${params.groupFunc}, val, sym) // Returns vector same length as input`;
    }

    if (mode === 'segmentby') {
        const xStr = SEGMENT_DATA.x.join(' ');
        const segStr = SEGMENT_DATA.segment.join(' ');
        return `x = ${xStr}\nsegment = ${segStr}\nsegmentby(${params.segmentFunc}, x, segment)`;
    }

    if (mode === 'rolling') {
        return `AAPL = ${ROLLING_AAPL.join(' ')}\nSPY = ${ROLLING_SPY.join(' ')}\nrolling(beta, [AAPL, SPY], ${params.rollingWindow}, ${params.rollingStep})`;
    }

    return '// Script generation not implemented for this mode.';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none font-sans">
      
      {/* 1. LEFT SIDEBAR (Function Library) */}
      <div className="absolute left-0 top-0 bottom-16 w-16 hover:w-64 transition-all duration-300 group z-50 pointer-events-auto flex flex-col bg-gray-900/95 border-r border-gray-700 backdrop-blur-md shadow-2xl">
           <div className="p-4 border-b border-gray-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                  <span className="font-bold text-white text-xs">FN</span>
              </div>
              <span className="font-bold text-cyan-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Library
              </span>
           </div>
           
           <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
              <SidebarButton mode={mode} target="conditionalIterate" label="conditionalIterate" desc="Branching Logic (RSE)" setMode={setMode} short="C" />
              <SidebarButton mode={mode} target="tmFunction" label="tmsum (TM Series)" desc="Time-Based Window" setMode={setMode} short="T" />
              <SidebarButton mode={mode} target="pivot" label="pivot" desc="Matrix Transpose" setMode={setMode} short="P" />
              <SidebarButton mode={mode} target="asof" label="asof" desc="Sorted Lookup" setMode={setMode} short="A" />
              <SidebarButton mode={mode} target="aggrTopN" label="aggrTopN" desc="Sort & Filter & Agg" setMode={setMode} short="AG" />
              <SidebarButton mode={mode} target="accumulate" label="accumulate" desc="State Scan" setMode={setMode} short="AC" />
              <SidebarButton mode={mode} target="eachLeft" label="eachLeft" desc="Broadcast Left" setMode={setMode} short="EL" />
              <SidebarButton mode={mode} target="eachRight" label="eachRight" desc="Broadcast Right" setMode={setMode} short="ER" />
              <SidebarButton mode={mode} target="eachPre" label="eachPre" desc="Previous Pair" setMode={setMode} short="EP" />
              <SidebarButton mode={mode} target="eachPost" label="eachPost" desc="Next Pair" setMode={setMode} short="EO" />
              <SidebarButton mode={mode} target="groupby" label="groupby" desc="Reduce by Key" setMode={setMode} short="GB" />
              <SidebarButton mode={mode} target="contextby" label="contextby" desc="Broadcast within Group" setMode={setMode} short="CB" />
              <SidebarButton mode={mode} target="segmentby" label="segmentby" desc="Sequential Grouping" setMode={setMode} short="SB" />
              <SidebarButton mode={mode} target="rolling" label="rolling" desc="Jumping Window" setMode={setMode} short="RL" />
              
              <div className="h-px bg-gray-700 my-2 opacity-50" />
              
              <SidebarButton mode={mode} target="createTimeSeriesEngine" label="Time Series Engine" desc="Window Aggregation" setMode={setMode} short="TSE" />
              <SidebarButton mode={mode} target="createReactiveStateEngine" label="Reactive State Engine" desc="Event-Driven State" setMode={setMode} short="RSE" />
              <SidebarButton mode={mode} target="createCrossSectionalEngine" label="Cross Sectional Engine" desc="Snapshot Aggregation" setMode={setMode} short="CSE" />
           </nav>
      </div>

      {/* 2. TOP HEADER (Title & Copy) */}
      <div className="absolute top-0 left-16 right-0 h-16 flex justify-between items-center px-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 tracking-tighter filter drop-shadow-[0_0_10px_rgba(0,255,100,0.5)] uppercase">
              {mode.replace(/create/g, '')}
            </h1>
            <p className="text-gray-400 text-[10px] font-mono opacity-80">
               Interactive 3D Visualization
            </p>
        </div>
        <button 
            onClick={handleCopy}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-xs text-green-400 px-3 py-1.5 rounded border border-gray-600 transition-colors"
        >
            <span>{copied ? 'Copied!' : 'Copy Script'}</span>
        </button>
      </div>

      {/* 3. TOP RIGHT PARAMETERS (HUD) */}
      <div className="absolute top-20 right-6 pointer-events-auto">
        <div className="bg-gray-900/90 backdrop-blur-md p-4 border border-gray-700 rounded-lg shadow-xl w-72 space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1 mb-2">Parameters</div>
            <ParameterControls mode={mode} params={params} />
        </div>
      </div>

      {/* 4. BOTTOM FOOTER (Playback) */}
      <div className="absolute bottom-0 left-16 right-0 h-20 bg-gray-900/95 border-t border-gray-700 backdrop-blur-md flex items-center px-6 pointer-events-auto z-40">
         <div className="flex items-center space-x-4 w-full">
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
             >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                )}
             </button>
             
             <div className="flex-1 flex flex-col">
                 <div className="flex justify-between text-xs text-cyan-400 mb-1 font-mono">
                     <span>Time: {progress.toFixed(2)}</span>
                     <span>Total: {totalSteps}</span>
                 </div>
                 <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden group">
                     <div 
                        className="absolute top-0 left-0 h-full bg-cyan-500 transition-all duration-75"
                        style={{ width: `${(progress / totalSteps) * 100}%` }}
                     />
                     <input 
                        type="range" 
                        min="0" 
                        max={totalSteps} 
                        step="0.01" 
                        value={progress}
                        onChange={(e) => {
                            setIsPlaying(false);
                            setProgress(parseFloat(e.target.value));
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     />
                 </div>
             </div>
         </div>
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && tooltipData && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-4 rounded-xl border border-cyan-500 shadow-[0_0_20px_rgba(0,240,255,0.3)] max-w-sm pointer-events-none z-[100]">
           <h3 className="text-lg font-bold text-cyan-400 mb-2 border-b border-gray-700 pb-1">
               Step {tooltipData.index || tooltipData.windowIndex} Details
           </h3>
           <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
               {tooltipData.debugStr || 'No Details'}
           </pre>
        </div>
      )}
    </div>
  );
};

const SidebarButton = ({ mode, target, label, desc, setMode, short }: any) => (
    <button 
      onClick={() => setMode(target)}
      className={`w-full flex items-center p-2 rounded-lg transition-colors group/btn relative ${mode === target ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
        <span className="text-lg w-8 text-center shrink-0 font-bold">{short}</span>
        <div className="flex flex-col items-start ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-[10px] text-gray-500">{desc}</span>
        </div>
    </button>
);

const ParameterControls = ({ mode, params }: any) => {
    if (mode === 'conditionalIterate') {
        return (
            <>
                <ControlRow label="FalseFunc">
                     <select 
                        value={params.funcType} 
                        onChange={(e) => params.setFuncType(e.target.value)}
                        className="bg-gray-800 text-xs rounded p-1 border border-gray-600 text-white"
                    >
                        <option value="msum">msum</option>
                        <option value="mavg">mavg</option>
                        <option value="mmax">mmax</option>
                        <option value="mmin">mmin</option>
                        <option value="tmsum">tmsum (Time)</option>
                        <option value="move">move</option>
                    </select>
                </ControlRow>
                <ControlRow label="Window">
                    <input type="number" min="1" max="10" value={params.funcWindow} onChange={(e) => params.setFuncWindow(parseInt(e.target.value))} className="w-12 bg-gray-800 text-xs text-white p-1 rounded" />
                </ControlRow>
                <ControlRow label="Threshold">
                    <input type="number" value={params.threshold} onChange={(e) => params.setThreshold(parseInt(e.target.value))} className="w-12 bg-gray-800 text-xs text-white p-1 rounded" />
                </ControlRow>
            </>
        )
    }
    if (mode === 'tmFunction') {
        return (
             <ControlRow label="Time Window">
                <input type="number" min="1" max="10" value={params.funcWindow} onChange={(e) => params.setFuncWindow(parseInt(e.target.value))} className="w-12 bg-gray-800 text-xs text-white p-1 rounded" />
             </ControlRow>
        )
    }
    if (mode === 'pivot' && params.setPivotFunc) {
        return (
             <ControlRow label="Agg Func">
                 <select value={params.pivotFunc} onChange={(e) => params.setPivotFunc(e.target.value)} className="bg-gray-800 text-xs rounded p-1 border border-gray-600 text-white">
                    <option value="last">last</option>
                    <option value="sum">sum</option>
                    <option value="count">count</option>
                 </select>
             </ControlRow>
        )
    }
    if (mode === 'createTimeSeriesEngine' && params.setTsWindowSize) {
        return (
            <>
                <ControlRow label="WindowSize">
                     <input type="number" step="30000" value={params.tsWindowSize} onChange={(e) => params.setTsWindowSize(parseInt(e.target.value))} className="w-16 bg-gray-800 text-xs text-white p-1 rounded" />
                </ControlRow>
                <ControlRow label="Step">
                     <input type="number" step="30000" value={params.tsStep} onChange={(e) => params.setTsStep(parseInt(e.target.value))} className="w-16 bg-gray-800 text-xs text-white p-1 rounded" />
                </ControlRow>
            </>
        )
    }
    if (mode === 'createReactiveStateEngine' && params.setRseWindow) {
        return (
            <ControlRow label="MAvg Window">
                <input type="number" min="2" max="5" value={params.rseWindow} onChange={(e) => params.setRseWindow(parseInt(e.target.value))} className="w-12 bg-gray-800 text-xs text-white p-1 rounded" />
            </ControlRow>
        )
    }
    if (mode === 'aggrTopN' && params.setAggrTopNFunc) {
        return (
            <>
                <ControlRow label="Func">
                    <select value={params.aggrTopNFunc} onChange={(e) => params.setAggrTopNFunc(e.target.value)} className="bg-gray-800 text-xs rounded p-1 border border-gray-600 text-white">
                        <option value="sum">sum</option>
                        <option value="max">max</option>
                        <option value="avg">avg</option>
                    </select>
                </ControlRow>
                <ControlRow label="Top N">
                    <input type="number" min="1" max="5" value={params.aggrTopNTop} onChange={(e) => params.setAggrTopNTop(parseInt(e.target.value))} className="w-12 bg-gray-800 text-xs text-white p-1 rounded" />
                </ControlRow>
                <ControlRow label="Ascending">
                    <input type="checkbox" checked={params.aggrTopNAsc} onChange={(e) => params.setAggrTopNAsc(e.target.checked)} className="accent-cyan-500" />
                </ControlRow>
            </>
        )
    }
    if (mode === 'accumulate' && params.setAccFunc) {
        return (
             <ControlRow label="Function">
                 <select value={params.accFunc} onChange={(e) => params.setAccFunc(e.target.value)} className="bg-gray-800 text-xs rounded p-1 border border-gray-600 text-white">
                    <option value="sum">sum</option>
                    <option value="prod">prod</option>
                    <option value="max">max</option>
                 </select>
             </ControlRow>
        )
    }
    if ((mode === 'eachPre' || mode === 'eachPost') && params.setPairFunc) {
        return (
            <>
                <ControlRow label="Func">
                    <select value={params.pairFunc} onChange={(e) => params.setPairFunc(e.target.value)} className="bg-gray-800 text-xs rounded p-1 border border-gray-600 text-white">
                        <option value="sub">sub (-)</option>
                        <option value="add">add (+)</option>
                        <option value="ratio">ratio (/)</option>
                    </select>
                </ControlRow>
                <ControlRow label={mode === 'eachPre' ? 'Pre Val' : 'Post Val'}>
                    <input type="number" value={params.pairBoundary} onChange={(e) => params.setPairBoundary(parseInt(e.target.value))} className="w-12 bg-gray-800 text-xs text-white p-1 rounded" />
                </ControlRow>
            </>
        )
    }
    if ((mode === 'groupby' || mode === 'contextby') && params.setGroupFunc) {
        return (
            <ControlRow label="Agg Func">
                <select value={params.groupFunc} onChange={(e) => params.setGroupFunc(e.target.value)} className="bg-gray-800 text-xs rounded p-1 border border-gray-600 text-white">
                    <option value="sum">sum</option>
                    <option value="avg">avg</option>
                    <option value="max">max</option>
                    <option value="count">count</option>
                </select>
            </ControlRow>
        )
    }
    if (mode === 'segmentby' && params.setSegmentFunc) {
        return (
            <ControlRow label="Func">
                <select value={params.segmentFunc} onChange={(e) => params.setSegmentFunc(e.target.value)} className="bg-gray-800 text-xs rounded p-1 border border-gray-600 text-white">
                    <option value="cumsum">cumsum</option>
                    <option value="cummax">cummax</option>
                    <option value="cummin">cummin</option>
                </select>
            </ControlRow>
        )
    }
    if (mode === 'rolling' && params.setRollingWindow && params.setRollingStep) {
        return (
            <>
                <ControlRow label="Window">
                    <input type="number" min="5" max="15" value={params.rollingWindow} onChange={(e) => params.setRollingWindow(parseInt(e.target.value))} className="w-12 bg-gray-800 text-xs text-white p-1 rounded" />
                </ControlRow>
                <ControlRow label="Step">
                    <input type="number" min="1" max="10" value={params.rollingStep} onChange={(e) => params.setRollingStep(parseInt(e.target.value))} className="w-12 bg-gray-800 text-xs text-white p-1 rounded" />
                </ControlRow>
            </>
        )
    }
    if (mode === 'eachLeft' || mode === 'eachRight') {
        return <div className="text-gray-500 text-xs italic">Broadcasting Animation</div>;
    }
    return <div className="text-gray-500 text-xs italic">No parameters</div>;
};

const ControlRow = ({ label, children }: any) => (
    <div className="flex justify-between items-center">
        <label className="text-xs text-yellow-500 font-semibold">{label}</label>
        {children}
    </div>
);
