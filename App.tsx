import React, { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { SourceViewer } from './components/SourceViewer';
import { QAPair, RAGSource, ActiveHighlight } from './types';

function App() {
  const [history, setHistory] = useState<QAPair[]>([]);
  const [activeSources, setActiveSources] = useState<Record<string, RAGSource> | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<ActiveHighlight | null>(null);

  const handleNewQA = (qaPair: QAPair) => {
    setHistory(prev => {
      const existingIndex = prev.findIndex(p => p.id === qaPair.id);
      if (existingIndex !== -1) {
        // Update the existing qaPair for streaming or completion
        const newHistory = [...prev];
        newHistory[existingIndex] = qaPair;
        return newHistory;
      }
      // Add a new qaPair shell
      return [...prev, qaPair];
    });
    
    // Always update sources to reflect the current state of the stream
    setActiveSources(qaPair.sources);
    setActiveHighlight(null);
  };
  
  const handleHighlight = (highlight: ActiveHighlight | null) => {
    setActiveHighlight(highlight);
  };

  const lastQA = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200 bg-dots">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#2e3c51_1px,transparent_1px)]"></div>
      
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">DeepWiki RAG</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/5">
            <ChatInterface 
              history={history}
              onNewQA={handleNewQA}
              onHighlight={handleHighlight}
            />
          </div>
          <div className="md:w-3/5">
            <SourceViewer
              sources={activeSources}
              highlight={activeHighlight}
              activeAnswer={lastQA?.answer}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;