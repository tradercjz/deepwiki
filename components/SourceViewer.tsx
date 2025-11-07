
import React, { useEffect, useRef } from 'react';
import { RAGSource, ActiveHighlight } from '../types';

interface SingleSourceDisplayProps {
  source: RAGSource;
  isParentHighlighted: boolean;
  highlight: ActiveHighlight | null;
}

const SingleSourceDisplay: React.FC<SingleSourceDisplayProps> = ({ source, isParentHighlighted, highlight }) => {
  const lines = source.content.split('\n');
  const startLine = source.metadata?.start_line || 1;

  return (
    <div
      data-filepath={source.file_path}
      className={`flex flex-col bg-white dark:bg-slate-900 border rounded-lg shadow-sm transition-all duration-300 ${isParentHighlighted ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/50 dark:ring-blue-400/50' : 'border-gray-200 dark:border-gray-800'}`}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-mono text-sm font-semibold truncate text-gray-700 dark:text-gray-300" title={source.file_path}>
          {source.file_path}
        </h3>
        {source.score && (
          <span className="text-xs text-gray-500">
            Score: {source.score.toFixed(3)}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-x-auto p-3">
        <pre className="text-xs">
          <code>
            {lines.map((line, index) => {
              const lineNumber = startLine + index;
              const isLineHighlighted = highlight &&
                highlight.filePath === source.file_path &&
                lineNumber >= highlight.startLine &&
                lineNumber <= highlight.endLine;

              return (
                <div
                  key={index}
                  className={`flex gap-4 ${isLineHighlighted ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                >
                  <span className="w-8 text-right text-gray-400 dark:text-gray-600 select-none flex-shrink-0">
                    {lineNumber}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words">{line || ' '}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};


interface SourceViewerProps {
  sources: Record<string, RAGSource> | null;
  highlight: ActiveHighlight | null;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({ sources, highlight }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight && containerRef.current) {
      // Use CSS.escape for safety with file paths that might contain special characters
      const element = containerRef.current.querySelector(`[data-filepath="${CSS.escape(highlight.filePath)}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [highlight]);

  const sourceList = sources ? Object.values(sources) : [];

  if (sourceList.length === 0) {
    return (
      <div className="sticky top-20 h-[calc(100vh-10rem)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Referenced documents for the current answer will appear here.
        </p>
         <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Hover over a citation in the answer to highlight the source.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="sticky top-20 h-[calc(100vh-10rem)] overflow-y-auto space-y-4 pb-4">
      {sourceList.map((source) => (
        <SingleSourceDisplay
          key={source.file_path}
          source={source}
          highlight={highlight}
          isParentHighlighted={highlight?.filePath === source.file_path}
        />
      ))}
    </div>
  );
};
