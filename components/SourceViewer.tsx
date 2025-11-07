import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RAGSource, ActiveHighlight, Citation } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface SingleSourceDisplayProps {
  source: RAGSource;
  isParentHighlighted: boolean;
  highlight: ActiveHighlight | null;
  citations: Citation[];
}

const SingleSourceDisplay: React.FC<SingleSourceDisplayProps> = ({ source, isParentHighlighted, highlight, citations }) => {
  const [expandedGaps, setExpandedGaps] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  
  const lines = source.content.split('\n');
  const sourceStartLine = source.metadata?.start_line || 1;
  const sourceEndLine = sourceStartLine + lines.length - 1;
  const CONTEXT_LINES = 3;

  const fullUrl = `https://github.com/tradercjz/documentation/tree/main/${source.file_path}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const renderLine = (lineNumber: number) => {
    const lineIndex = lineNumber - sourceStartLine;
    if (lineIndex < 0 || lineIndex >= lines.length) return null;
    
    const isLineHighlighted = highlight?.some(h =>
      h.filePath === source.file_path &&
      lineNumber >= h.startLine &&
      lineNumber <= h.endLine
    ) ?? false;

    const isCited = citations.some(c => lineNumber >= c.startLine && lineNumber <= c.endLine);

    return (
      <div
        key={`line-${lineNumber}`}
        data-line-number={lineNumber}
        className={`flex gap-4 -mx-2 px-2 rounded transition-colors duration-150 ${isLineHighlighted ? 'bg-blue-100 dark:bg-blue-900/50' : isCited ? 'bg-gray-100 dark:bg-slate-800' : ''}`}
      >
        <span className="w-8 text-right text-gray-400 dark:text-gray-600 select-none flex-shrink-0">
          {lineNumber}
        </span>
        <span className="flex-1 whitespace-pre-wrap break-words">{lines[lineIndex] || ' '}</span>
      </div>
    );
  };
  
  const renderGap = (start: number, end: number, gapIndex: number) => {
    if (expandedGaps.has(gapIndex)) {
      const expandedLines: React.ReactNode[] = [];
      for (let i = start; i <= end; i++) {
        expandedLines.push(renderLine(i));
      }
      return expandedLines;
    }
    
    return (
      <div key={`gap-${gapIndex}`} className="text-center my-1 select-none">
        <button
          onClick={() => setExpandedGaps(prev => new Set(prev).add(gapIndex))}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5"
        >
          ... ({end - start + 1} lines hidden) ...
        </button>
      </div>
    );
  };

  const codeContent = useMemo(() => {
    if (citations.length === 0) {
      return lines.map((_, index) => renderLine(sourceStartLine + index));
    }

    const ranges = citations.map(c => ({
      start: Math.max(sourceStartLine, c.startLine - CONTEXT_LINES),
      end: Math.min(sourceEndLine, c.endLine + CONTEXT_LINES)
    }));

    if (ranges.length === 0) {
       return lines.map((_, index) => renderLine(sourceStartLine + index));
    }
    ranges.sort((a, b) => a.start - b.start);

    const mergedRanges: {start: number; end: number}[] = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const last = mergedRanges[mergedRanges.length - 1];
      if (ranges[i].start <= last.end + 1) {
        last.end = Math.max(last.end, ranges[i].end);
      } else {
        mergedRanges.push(ranges[i]);
      }
    }

    const elements: React.ReactNode[] = [];
    let lastRenderedLine = sourceStartLine - 1;

    mergedRanges.forEach((range, rangeIndex) => {
      if (range.start > lastRenderedLine + 1) {
        elements.push(renderGap(lastRenderedLine + 1, range.start - 1, rangeIndex));
      }
      
      for (let i = range.start; i <= range.end; i++) {
        elements.push(renderLine(i));
      }
      
      lastRenderedLine = range.end;
    });
    
    if (sourceEndLine > lastRenderedLine) {
        elements.push(renderGap(lastRenderedLine + 1, sourceEndLine, mergedRanges.length));
    }

    return elements;

  }, [citations, highlight, source.content, source.metadata, expandedGaps]);
  
  return (
    <div
      data-filepath={source.file_path}
      className={`flex flex-col bg-white dark:bg-slate-900 border rounded-lg shadow-sm transition-all duration-300 ${isParentHighlighted ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/50 dark:ring-blue-400/50' : 'border-gray-200 dark:border-gray-800'}`}
    >
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-mono text-sm font-semibold truncate text-gray-700 dark:text-gray-300" title={source.file_path}>
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            {source.file_path.split('/').pop() || source.file_path}
          </a>
        </h3>
        <button 
          onClick={handleCopy}
          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-md transition-colors"
          aria-label="Copy file URL"
        >
          {/* {copied ? <CheckIcon /> : <CopyIcon />} */}
        </button>
      </div>
      <div className="flex-1 overflow-x-auto p-3">
        <pre className="text-xs">
          <code>
            {codeContent}
          </code>
        </pre>
      </div>
    </div>
  );
};

interface SourceViewerProps {
  sources: Record<string, RAGSource> | null;
  highlight: ActiveHighlight | null;
  activeAnswer?: string;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({ sources, highlight, activeAnswer }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight && highlight.length > 0 && containerRef.current) {
      const firstHighlight = highlight[0];
      const fileContainer = containerRef.current.querySelector(`[data-filepath="${CSS.escape(firstHighlight.filePath)}"]`);
      if (fileContainer) {
        const lineElement = fileContainer.querySelector(`[data-line-number="${firstHighlight.startLine}"]`);
        if (lineElement) {
          lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          fileContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [highlight]);

  const allCitations = useMemo(() => {
    if (!activeAnswer) return [];
    
    const citations: Citation[] = [];
    const citationBlockRegex = /\[(source:.+?)\]/g;
    let blockMatch;

    while ((blockMatch = citationBlockRegex.exec(activeAnswer)) !== null) {
        const innerText = blockMatch[1];
        let lastFilePath: string | null = null;
        const citationParts = innerText.split(',');

        for (const part of citationParts) {
            const trimmedPart = part.trim();
            const fullCitationRegex = /source:\s*([\w\/\.-]+):(\d+)(?:-(\d+))?/;
            const rangeOnlyRegex = /^(\d+)(?:-(\d+))?$/;

            let partMatch = trimmedPart.match(fullCitationRegex);
            if (partMatch) {
                const filePath = partMatch[1];
                const startLine = parseInt(partMatch[2], 10);
                const endLine = partMatch[3] ? parseInt(partMatch[3], 10) : startLine;
                
                citations.push({
                    filePath,
                    startLine,
                    endLine,
                    text: blockMatch[0],
                });
                lastFilePath = filePath;
            } else {
                partMatch = trimmedPart.match(rangeOnlyRegex);
                if (partMatch && lastFilePath) {
                    const startLine = parseInt(partMatch[1], 10);
                    const endLine = partMatch[2] ? parseInt(partMatch[2], 10) : startLine;

                    citations.push({
                        filePath: lastFilePath,
                        startLine,
                        endLine,
                        text: blockMatch[0],
                    });
                }
            }
        }
    }
    return citations;
  }, [activeAnswer]);

  const citedFilePaths = useMemo(() => {
    return new Set(allCitations.map(c => c.filePath));
  }, [allCitations]);

  const sourceList = useMemo(() => {
    if (!sources || citedFilePaths.size === 0) {
      return [];
    }
    return Object.values(sources).filter(source => citedFilePaths.has(source.file_path));
  }, [sources, citedFilePaths]);

  if (sourceList.length === 0) {
    return (
      <div className="sticky top-20 h-[calc(100vh-10rem)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Cited documents for the current answer will appear here.
        </p>
         <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Hover over a citation in the answer to highlight the source.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="sticky top-20 h-[calc(100vh-10rem)] overflow-y-auto space-y-4 pb-4">
      {sourceList.map((source: RAGSource) => {
        const sourceCitations = allCitations.filter(c => c.filePath === source.file_path);
        return (
          <SingleSourceDisplay
            key={source.file_path}
            source={source}
            highlight={highlight}
            isParentHighlighted={highlight?.some(h => h.filePath === source.file_path) ?? false}
            citations={sourceCitations}
          />
        );
      })}
    </div>
  );
};