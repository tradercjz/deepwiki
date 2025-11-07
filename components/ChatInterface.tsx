import React, { useState, useRef, useEffect } from 'react';
import { QAPair, RAGSource, ActiveHighlight, Citation } from '../types';
import { SourceViewer } from './SourceViewer';

const parseContent = (text: string): (string | Citation[])[] => {
  const contentParts: (string | Citation[])[] = [];
  let lastIndex = 0;
  const citationBlockRegex = /\[(source:.+?)\]/g;
  let blockMatch;

  while ((blockMatch = citationBlockRegex.exec(text)) !== null) {
      if (blockMatch.index > lastIndex) {
          contentParts.push(text.substring(lastIndex, blockMatch.index));
      }

      const innerText = blockMatch[1];
      const citationsInBlock: Citation[] = [];
      let lastFilePath: string | null = null;
      // This regex handles both formats: "source: path:1-2" and just "15-17" if path is known
      const citationRegex = /(?:source:\s*)?([\w\/\.-]+):(\d+)(?:-(\d+))?|(\d+)(?:-(\d+))?/g;
      
      const parts = innerText.split(',').map(p => p.trim());

      for(const part of parts) {
          const fullCitationMatch = part.match(/source:\s*([\w\/\.-]+):(\d+)(?:-(\d+))?/);
          if (fullCitationMatch) {
              const filePath = fullCitationMatch[1];
              const startLine = parseInt(fullCitationMatch[2], 10);
              const endLine = fullCitationMatch[3] ? parseInt(fullCitationMatch[3], 10) : startLine;
              citationsInBlock.push({ filePath, startLine, endLine, text: part });
              lastFilePath = filePath;
          } else {
              const rangeMatch = part.match(/(\d+)(?:-(\d+))?/);
              if (rangeMatch && lastFilePath) {
                   const startLine = parseInt(rangeMatch[1], 10);
                   const endLine = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : startLine;
                   citationsInBlock.push({ filePath: lastFilePath, startLine, endLine, text: part });
              }
          }
      }


      if (citationsInBlock.length > 0) {
          contentParts.push(citationsInBlock);
      } else {
          // If parsing fails for some reason, push the original text to avoid losing content
          contentParts.push(blockMatch[0]);
      }
      lastIndex = blockMatch.index + blockMatch[0].length;
  }

  if (lastIndex < text.length) {
      contentParts.push(text.substring(lastIndex));
  }
  return contentParts;
};


const ContentRenderer: React.FC<{ content: string; onHighlight: (h: ActiveHighlight | null) => void }> = ({ content, onHighlight }) => {
  const parts = parseContent(content);
  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        }
        
        const citations = part as Citation[];
        if (citations.length === 0) return null;
        
        const groupedByFile = citations.reduce((acc, c) => {
            if (!acc[c.filePath]) acc[c.filePath] = [];
            acc[c.filePath].push(c);
            return acc;
        }, {} as Record<string, Citation[]>);

        const displayText = Object.entries(groupedByFile).map(([filePath, fileCitations]) => {
            const fileName = filePath.split('/').pop() || filePath;
            const ranges = fileCitations.map(c => c.startLine === c.endLine ? c.startLine : `${c.startLine}-${c.endLine}`).join(', ');
            return `${fileName}:${ranges}`;
        }).join('; ');

        return (
          <span
            key={index}
            className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-mono text-sm px-1.5 py-0.5 rounded-md cursor-pointer transition-colors hover:bg-blue-200 dark:hover:bg-blue-800/60"
            onMouseEnter={() => onHighlight(citations.map(c => ({ filePath: c.filePath, startLine: c.startLine, endLine: c.endLine })))}
            onMouseLeave={() => onHighlight(null)}
          >
            [{displayText}]
          </span>
        );
      })}
    </>
  );
};

interface QAPairRendererProps {
  qa: QAPair;
  isLast: boolean;
  streamingData: {
    isLoading: boolean;
    error: string | null;
    statusMessage: string;
  }
}

const QAPairRenderer: React.FC<QAPairRendererProps> = ({ qa, isLast, streamingData }) => {
    const leftColRef = useRef<HTMLDivElement>(null);
    const rightColRef = useRef<HTMLDivElement>(null);

    const [activeHighlight, setActiveHighlight] = useState<ActiveHighlight | null>(null);

    const { isLoading, error, statusMessage } = streamingData;
    const isStreamingThisBlock = isLast && isLoading;

    useEffect(() => {
        const setMaxHeight = () => {
            if (leftColRef.current && rightColRef.current) {
                const leftHeight = leftColRef.current.offsetHeight;
                // Use maxHeight to prevent unnecessary whitespace, but allow scrolling for long content
                rightColRef.current.style.maxHeight = `${leftHeight}px`;
                rightColRef.current.style.height = ''; // Clear any explicit height
            }
        };

        // This effect runs whenever the answer content changes, adjusting the maxHeight dynamically
        if (qa.answer || isStreamingThisBlock) {
            // Use a small timeout to allow the DOM to update before we measure its height
            const timer = setTimeout(setMaxHeight, 50);
            window.addEventListener('resize', setMaxHeight);
            return () => {
              clearTimeout(timer);
              window.removeEventListener('resize', setMaxHeight);
            }
        }
    }, [qa.answer, isStreamingThisBlock]);

    const showSources = Object.keys(qa.sources).length > 0;

    return (
        <div className="flex flex-col md:flex-row gap-6">
            <div ref={leftColRef} className="md:w-2/5 flex flex-col gap-4">
                <div className="flex justify-start">
                    <div className="bg-blue-500 text-white p-3 rounded-lg w-full">
                        <p>{qa.question}</p>
                    </div>
                </div>
                
                { (qa.answer || isStreamingThisBlock) && (
                    <div className="flex justify-start mt-2">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg prose prose-sm dark:prose-invert break-words whitespace-pre-wrap w-full border border-gray-200 dark:border-gray-700">
                            <ContentRenderer content={qa.answer} onHighlight={setActiveHighlight} />
                            {isStreamingThisBlock && statusMessage && <span className="ml-2 text-gray-500 italic text-xs animate-pulse">{statusMessage}</span>}
                            {isStreamingThisBlock && !statusMessage && qa.answer && <span className="inline-block w-2 h-4 bg-gray-600 dark:bg-gray-400 animate-pulse ml-1"></span>}
                        </div>
                    </div>
                )}
                { isLast && error && (
                    <div className="flex justify-start mt-2">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative w-full" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="md:w-3/5">
                { showSources && (
                    <div ref={rightColRef} className="relative overflow-y-auto">
                        <SourceViewer
                        sources={qa.sources}
                        highlight={activeHighlight}
                        activeAnswer={qa.answer}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

interface ChatInterfaceProps {
  history: QAPair[];
  streamingData: {
    currentAnswer: string;
    sources: Record<string, RAGSource>;
    statusMessage: string;
    error: string | null;
    isLoading: boolean;
  }
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, streamingData }) => {
  return (
    <div className="space-y-12">
      {history.map((qa, index) => (
        <QAPairRenderer
          key={qa.id}
          qa={qa}
          isLast={index === history.length - 1}
          streamingData={streamingData}
        />
      ))}
    </div>
  );
};