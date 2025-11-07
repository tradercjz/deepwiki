import React, { useState, useRef, useEffect } from 'react';
import { useRAGStream } from '../hooks/useRAGStream';
import { QAPair, RAGSource, ActiveHighlight, Citation } from '../types';
import { SendIcon } from './icons/SendIcon';

interface ChatInterfaceProps {
  history: QAPair[];
  onNewQA: (qaPair: QAPair) => void;
  onHighlight: (highlight: ActiveHighlight | null) => void;
}

const citationRegex = /\[source:([\w\/\.-]+):(\d+)(?:-(\d+))?\]/g;

const parseContent = (text: string): (string | Citation)[] => {
  const parts: (string | Citation)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    const startLine = parseInt(match[2], 10);
    const endLine = match[3] ? parseInt(match[3], 10) : startLine;

    parts.push({
      filePath: match[1],
      startLine: startLine,
      endLine: endLine,
      text: match[0],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

const ContentRenderer: React.FC<{ content: string; onHighlight: (h: ActiveHighlight | null) => void }> = ({ content, onHighlight }) => {
  const parts = parseContent(content);
  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        }
        const citation = part as Citation;
        const fileName = citation.filePath.split('/').pop() || citation.filePath;
        const lineRange = citation.startLine === citation.endLine ? citation.startLine : `${citation.startLine}-${citation.endLine}`;
        const displayText = `[${fileName}:${lineRange}]`;
        
        return (
          <span
            key={index}
            className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-mono text-sm px-1.5 py-0.5 rounded-md cursor-pointer transition-colors hover:bg-blue-200 dark:hover:bg-blue-800/60"
            onMouseEnter={() => onHighlight({ filePath: citation.filePath, startLine: citation.startLine, endLine: citation.endLine })}
            onMouseLeave={() => onHighlight(null)}
          >
            {displayText}
          </span>
        );
      })}
    </>
  );
};


export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, onNewQA, onHighlight }) => {
  const [question, setQuestion] = useState('');
  const { currentAnswer, sources, statusMessage, error, isLoading, startStream } = useRAGStream();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentAnswer, statusMessage, error]);

  useEffect(() => {
    if (isLoading && history.length > 0) {
      const lastQAPair = history[history.length - 1];
      // Only call onNewQA if the streaming data is different from what's already in history
      // to prevent an infinite re-render loop.
      if (lastQAPair.answer !== currentAnswer || lastQAPair.sources !== sources) {
        onNewQA({
          ...lastQAPair,
          answer: currentAnswer,
          sources: sources,
        });
      }
    }
  }, [currentAnswer, sources, isLoading, history, onNewQA]);
  
  const handleAsk = () => {
    if (!question.trim() || isLoading) return;
    
    const newQuestion = question.trim();
    
    const qaPairShell: QAPair = {
        id: Date.now().toString(),
        question: newQuestion,
        answer: '',
        sources: {}
    };
    onNewQA(qaPairShell);
    setQuestion('');

    startStream(newQuestion, history, (fullAnswer, sources) => {
       const finalQAPair: QAPair = {
        id: qaPairShell.id,
        question: newQuestion,
        answer: fullAnswer,
        sources: sources,
      };
       onNewQA(finalQAPair);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
      <div ref={scrollRef} className="flex-1 p-4 space-y-6 overflow-y-auto">
        {history.map((qa, index) => (
          <div key={qa.id}>
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white p-3 rounded-lg max-w-lg">
                <p>{qa.question}</p>
              </div>
            </div>
            
            { qa.answer && ! (index === history.length - 1 && isLoading) && (
                <div className="flex justify-start mt-2">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-lg prose prose-sm dark:prose-invert break-words whitespace-pre-wrap">
                        <ContentRenderer content={qa.answer} onHighlight={onHighlight} />
                    </div>
                </div>
            )}
             {/* Render streaming answer for the last item */}
            { index === history.length -1 && isLoading && (
                 <div className="flex justify-start mt-2">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-lg prose prose-sm dark:prose-invert break-words whitespace-pre-wrap">
                        <ContentRenderer content={currentAnswer} onHighlight={onHighlight} />
                        {statusMessage && <span className="ml-2 text-gray-500 italic text-xs animate-pulse">{statusMessage}</span>}
                        {!statusMessage && currentAnswer && <span className="inline-block w-2 h-4 bg-gray-600 dark:bg-gray-400 animate-pulse ml-1"></span>}
                    </div>
                </div>
            )}
             { index === history.length -1 && error && (
                <div className="flex justify-start mt-2">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative max-w-lg" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 rounded-b-lg">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={isLoading}
            rows={1}
            className="w-full p-3 pr-12 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition resize-none"
          />
          <button
            onClick={handleAsk}
            disabled={isLoading || !question.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};