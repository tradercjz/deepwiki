import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { QAPair, RAGSource } from './types';
import { useRAGStream } from './hooks/useRAGStream';
import { DolphinIcon } from './components/icons/DolphinIcon';

function App() {
  const [history, setHistory] = useState<QAPair[]>([]);
  const [question, setQuestion] = useState('');
  const { currentAnswer, sources, statusMessage, error, isLoading, startStream } = useRAGStream();
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the page when history or the streaming answer changes
    if (isLoading) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history, currentAnswer, isLoading]);


  const handleAsk = () => {
    if (!question.trim() || isLoading) return;
    
    const newQuestion = question.trim();
    
    const qaPairShell: QAPair = {
        id: Date.now().toString(),
        question: newQuestion,
        answer: '',
        sources: {}
    };
    setHistory(prev => [...prev, qaPairShell]);
    setQuestion('');

    startStream(newQuestion, history, (fullAnswer, finalSources) => {
       const finalQAPair: QAPair = {
        id: qaPairShell.id,
        question: newQuestion,
        answer: fullAnswer,
        sources: finalSources,
      };
      setHistory(prev => prev.map(p => p.id === qaPairShell.id ? finalQAPair : p));
    });
  };

  useEffect(() => {
    if (isLoading && history.length > 0) {
      const lastQAPair = history[history.length - 1];
      const streamingQAPair: QAPair = {
        ...lastQAPair,
        answer: currentAnswer,
        sources: sources,
      };
       setHistory(prev => prev.map(p => p.id === lastQAPair.id ? streamingQAPair : p));
    }
  }, [currentAnswer, sources, isLoading]);


  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-200">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#2e3c51_1px,transparent_1px)]"></div>
      
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">DolphinMind</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <DolphinIcon className="text-gray-400 dark:text-gray-500" />
                <span className="hidden sm:inline">Powered by DolphinDB</span>
              </div>
              <button 
                onClick={() => alert('Share functionality is a TODO')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-slate-700 transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main ref={mainContentRef} className="px-4 sm:px-6 lg:px-8 pt-24 pb-48">
          <ChatInterface 
            history={history}
            streamingData={{
                currentAnswer,
                sources,
                statusMessage,
                error,
                isLoading,
            }}
          />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-transparent">
        <div className="mx-auto max-w-3xl">
          <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              disabled={isLoading}
              rows={1}
              className="w-full p-4 pr-14 text-gray-900 dark:text-white bg-transparent border-none rounded-lg focus:ring-0 focus:outline-none transition resize-none"
            />
            <button
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <DolphinIcon size={20} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;