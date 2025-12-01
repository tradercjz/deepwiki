
import React, { useState } from 'react';
import { FuncType, DATA_TIME, TM_TIMES, TM_INPUTS, AppMode, PIVOT_DATA, TS_ENGINE_DATA } from '../constants';

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
        // Use exact example vectors
        const tStr = TM_TIMES.join(' ');
        const xStr = TM_INPUTS.join(' ');
        
        return `// DolphinDB Script for TM Series (tmsum)
T = ${tStr}
X = ${xStr}
window = ${params.funcWindow}

// tmsum(T, X, window)
// Calculates sum of X in range (T-window, T]
result = tmsum(T, X, window)

t = table(T, X, result)
select * from t`;
    }

    if (mode === 'pivot') {
        return `// DolphinDB Script for Pivot
// Data Construction
sym = ${JSON.stringify(PIVOT_DATA.map(d => d.sym)).replace(/"/g, '`')}
time = ${JSON.stringify(PIVOT_DATA.map(d => d.time)).replace(/"/g, '"')}
price = ${JSON.stringify(PIVOT_DATA.map(d => d.price))}

t = table(sym, time, price)

// syntax: pivot(func, funcArgs, rowAlignCol, colAlignCol)
result = pivot(${params.pivotFunc || 'last'}, price, time, sym)

select * from result`;
    }

    if (mode === 'createTimeSeriesEngine') {
        return `share streamTable(1000:0, ["time","sym","volume"], [TIMESTAMP, SYMBOL, INT]) as trades
share table(10000:0, ["time","sym","sumVolume"], [TIMESTAMP, SYMBOL, INT]) as output1

engine1 = createTimeSeriesEngine(name="engine1", windowSize=60000, step=60000, metrics=<[sum(volume)]>, dummyTable=trades, outputTable=output1, timeColumn="time", useSystemTime=false, keyColumn="sym", garbageSize=50, useWindowStartTime=false)
subscribeTable(tableName="trades", actionName="engine1", offset=0, handler=append!{engine1}, msgAsTable=true);

insert into trades values(2018.10.08T01:01:01.785,\`A,10)
insert into trades values(2018.10.08T01:01:02.125,\`B,26)
insert into trades values(2018.10.08T01:01:10.263,\`B,14)
insert into trades values(2018.10.08T01:01:12.457,\`A,28)
insert into trades values(2018.10.08T01:02:10.789,\`A,15)
insert into trades values(2018.10.08T01:02:12.005,\`B,9)
insert into trades values(2018.10.08T01:02:30.021,\`A,10)
insert into trades values(2018.10.08T01:04:02.236,\`A,29)
insert into trades values(2018.10.08T01:04:04.412,\`B,32)
insert into trades values(2018.10.08T01:04:05.152,\`B,23)

sleep(10)

select * from output1;`;
    }

    return '// Script generation not implemented for this mode.';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Sidebar / Function Selector */}
      <div className="absolute left-6 top-6 bottom-24 w-16 hover:w-64 transition-all duration-300 group z-50 pointer-events-auto flex flex-col">
        <div className="bg-gray-900/95 border-r border-y border-gray-700 rounded-r-xl rounded-l-md h-full shadow-2xl overflow-hidden backdrop-blur-md flex flex-col">
           <div className="p-4 border-b border-gray-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                  <span className="font-bold text-white text-xs">FN</span>
              </div>
              <span className="font-bold text-cyan-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Function Library
              </span>
           </div>
           
           <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              <button 
                onClick={() => setMode('conditionalIterate')}
                className={`w-full flex items-center p-2 rounded-lg transition-colors ${mode === 'conditionalIterate' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                  <span className="text-lg w-8 text-center shrink-0">C</span>
                  <div className="flex flex-col items-start ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      <span className="text-sm font-semibold">conditionalIterate</span>
                      <span className="text-[10px] text-gray-500">Branching Logic (RSE)</span>
                  </div>
              </button>

              <button 
                onClick={() => setMode('tmFunction')}
                className={`w-full flex items-center p-2 rounded-lg transition-colors ${mode === 'tmFunction' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                  <span className="text-lg w-8 text-center shrink-0">T</span>
                  <div className="flex flex-col items-start ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      <span className="text-sm font-semibold">tmsum</span>
                      <span className="text-[10px] text-gray-500">Time-Based Window</span>
                  </div>
              </button>

              <button 
                onClick={() => setMode('pivot')}
                className={`w-full flex items-center p-2 rounded-lg transition-colors ${mode === 'pivot' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                  <span className="text-lg w-8 text-center shrink-0">P</span>
                  <div className="flex flex-col items-start ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      <span className="text-sm font-semibold">pivot</span>
                      <span className="text-[10px] text-gray-500">Matrix Transpose</span>
                  </div>
              </button>

              <button 
                onClick={() => setMode('createTimeSeriesEngine')}
                className={`w-full flex items-center p-2 rounded-lg transition-colors ${mode === 'createTimeSeriesEngine' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
              >
                  <span className="text-lg w-8 text-center shrink-0">E</span>
                  <div className="flex flex-col items-start ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      <span className="text-sm font-semibold">TS Engine</span>
                      <span className="text-[10px] text-gray-500">Real-time Aggregation</span>
                  </div>
              </button>
           </nav>
        </div>
      </div>

      {/* Main Header & Controls (Pushed right to avoid sidebar) */}
      <header className="flex justify-between items-start pointer-events-auto pl-20">
        <div className="flex flex-col items-start space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 tracking-tighter filter drop-shadow-[0_0_10px_rgba(0,255,100,0.5)] uppercase">
              {mode}
            </h1>
            <p className="text-gray-400 text-xs mt-1 max-w-md font-mono">
              {mode === 'conditionalIterate' && `If (val0 > ${params.threshold}) then val1 else ${params.funcType}(prevY)`}
              {mode === 'tmFunction' && `tmsum(T, X, ${params.funcWindow}) - Sum X where T in (currentT - ${params.funcWindow}, currentT]`}
              {mode === 'pivot' && `pivot(${params.pivotFunc}, Price, Time, Sym) - Reshape Table to Matrix`}
              {mode === 'createTimeSeriesEngine' && `createTimeSeriesEngine(window=${params.tsWindowSize}, step=${params.tsStep}, ...)`}
            </p>
          </div>
          
          <button 
            onClick={handleCopy}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-xs text-green-400 px-3 py-1.5 rounded border border-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>
        
        {/* Parameter Control Panel (Dynamic) */}
        <div className="bg-gray-900/90 backdrop-blur-md p-4 border border-gray-700 rounded-lg shadow-xl w-80 space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase border-b border-gray-700 pb-1 mb-2">Parameters</div>
            
            {mode === 'conditionalIterate' && (
                <>
                {/* CondIterate Controls */}
                <div className="flex justify-between items-center">
                    <label className="text-xs text-yellow-500">FalseFunc</label>
                    <select 
                        value={params.funcType} 
                        onChange={(e) => params.setFuncType(e.target.value)}
                        className="bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 focus:border-yellow-400 outline-none text-right"
                    >
                        <optgroup label="Index Window">
                            <option value="msum">msum</option>
                            <option value="mavg">mavg</option>
                            <option value="mmax">mmax</option>
                            <option value="mmin">mmin</option>
                            <option value="mcount">mcount</option>
                        </optgroup>
                        <optgroup label="Time Window">
                             <option value="tmsum">tmsum</option>
                        </optgroup>
                        <optgroup label="Sequence">
                            <option value="move">move</option>
                        </optgroup>
                    </select>
                </div>
                <div className="flex justify-between items-center">
                    <label className="text-xs text-yellow-500">Window / Shift</label>
                    <input 
                        type="number" min="1" max="10" 
                        value={params.funcWindow} 
                        onChange={(e) => params.setFuncWindow(parseInt(e.target.value))}
                        className="w-12 bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 text-center"
                    />
                </div>
                <div className="h-px bg-gray-800 my-1" />
                <div className="flex justify-between items-center">
                    <label className="text-xs text-blue-400">Threshold (val0 &gt; ?)</label>
                    <input 
                        type="number" 
                        value={params.threshold} 
                        onChange={(e) => params.setThreshold(parseInt(e.target.value))}
                        className="w-12 bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 text-center"
                    />
                </div>
                </>
            )}

            {mode === 'tmFunction' && (
                <>
                    {/* TM Series Controls */}
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-yellow-500">Function</label>
                        <span className="text-xs text-white font-mono">tmsum</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-yellow-500">Time Window (Duration)</label>
                        <input 
                            type="number" min="1" max="10" 
                            value={params.funcWindow} 
                            onChange={(e) => params.setFuncWindow(parseInt(e.target.value))}
                            className="w-12 bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 text-center"
                        />
                    </div>
                </>
            )}

            {mode === 'pivot' && params.setPivotFunc && (
                <>
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-yellow-500">Function</label>
                        <select 
                            value={params.pivotFunc} 
                            onChange={(e) => params.setPivotFunc && params.setPivotFunc(e.target.value)}
                            className="bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 outline-none text-right"
                        >
                            <option value="last">last (Overwrite)</option>
                            <option value="sum">sum (Accumulate)</option>
                            <option value="count">count</option>
                        </select>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2">
                        Row = Time, Col = Sym
                    </div>
                </>
            )}

            {mode === 'createTimeSeriesEngine' && params.setTsWindowSize && params.setTsStep && (
                <>
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-yellow-500">WindowSize</label>
                        <input 
                            type="number" min="30000" max="120000" step="30000"
                            value={params.tsWindowSize} 
                            onChange={(e) => params.setTsWindowSize && params.setTsWindowSize(parseInt(e.target.value))}
                            className="w-16 bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 text-center"
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-yellow-500">Step</label>
                        <input 
                            type="number" min="30000" max="120000" step="30000"
                            value={params.tsStep} 
                            onChange={(e) => params.setTsStep && params.setTsStep(parseInt(e.target.value))}
                            className="w-16 bg-gray-800 text-white text-xs rounded p-1 border border-gray-600 text-center"
                        />
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2">
                        60000ms = 1 min
                    </div>
                </>
            )}
        </div>
      </header>

      {/* Tooltip */}
      {hoveredIndex !== null && tooltipData && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
           <div className={`bg-black/95 border border-gray-700 p-6 rounded-xl shadow-2xl backdrop-blur-xl min-w-[320px]`}>
              <h3 className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-2">
                {mode === 'conditionalIterate' ? (tooltipData.isConditionMet ? 'Condition TRUE' : 'Condition FALSE') : (mode === 'pivot' ? 'Pivot Op' : 'Window Calculation')}
              </h3>
              
              <div className="font-mono text-sm space-y-2">
                 
                 {mode === 'pivot' && (
                     <>
                        <div className="flex justify-between border-b border-gray-800 pb-1">
                            <span className="text-gray-400">Input</span>
                            <span className="text-white">{tooltipData.input.sym} @ {tooltipData.input.time}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-gray-400">Value</span>
                            <span className="text-yellow-400">{tooltipData.input.price}</span>
                        </div>
                     </>
                 )}

                 {mode !== 'pivot' && mode !== 'createTimeSeriesEngine' && (
                     <div className="flex justify-between border-b border-gray-800 pb-1">
                        <span className="text-gray-400">Time T</span>
                        <span className="text-blue-400 font-bold">{tooltipData.time}</span>
                     </div>
                 )}
                 
                 {mode === 'conditionalIterate' && (
                     <>
                        <div className="flex justify-between border-b border-gray-800 pb-1">
                            <span className="text-gray-400">Input val0</span>
                            <span>{tooltipData.val0}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Logic: {tooltipData.val0} &gt; {params.threshold}? 
                            <span className={tooltipData.isConditionMet ? 'text-green-400 ml-2 font-bold' : 'text-red-400 ml-2 font-bold'}>
                                {tooltipData.isConditionMet ? 'YES' : 'NO'}
                            </span>
                        </div>
                     </>
                 )}
                 
                 {mode !== 'createTimeSeriesEngine' && (
                    <>
                        <div className="text-xs text-gray-500 bg-gray-900 p-2 rounded mt-1 border border-gray-800">
                            Step Formula:<br/>
                            <span className="text-white">{tooltipData.debugStr}</span>
                        </div>
                        
                        <div className="flex justify-between pt-2 text-lg font-bold border-t border-gray-800 mt-2">
                            <span className="text-white">Result</span>
                            <span className="text-cyan-400">{mode === 'pivot' ? tooltipData.newValue : (tooltipData.result ?? 'NULL')}</span>
                        </div>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Footer Controls */}
      <footer className="pointer-events-auto w-full max-w-4xl mx-auto bg-gray-900/90 border border-gray-800 rounded-2xl p-4 backdrop-blur-md shadow-2xl pl-20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-cyan-900/50 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all duration-300"
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 translate-x-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
            )}
          </button>
          <div className="flex-1 flex flex-col space-y-2">
            <input 
              type="range" min="0" max={totalSteps} step="0.01" value={progress}
              onChange={(e) => { setProgress(parseFloat(e.target.value)); if (isPlaying) setIsPlaying(false); }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </footer>
    </div>
  );
};
