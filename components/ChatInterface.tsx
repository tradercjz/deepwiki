import React, { useState, useRef, useEffect } from 'react';
import { QAPair, RAGSource, ActiveHighlight, Citation } from '../types';
import { SourceViewer } from './SourceViewer';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

type ContentPart =
  | { type: 'text'; content: string }
  | { type: 'citation'; citations: Citation[] }
  | { type: 'code'; language: string; content: string }
  | { type: 'inline_code'; content: string }
  | { type: 'bold'; content: ContentPart[]}
  | { type: 'italic'; content: ContentPart[] }; 

const CodeBlock: React.FC<{ language: string; content: string }> = ({ language, content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(content).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
            });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = content;
            textArea.style.position = 'fixed';
            textArea.style.top = '-9999px';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <div className="my-4 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 font-mono">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-200 dark:bg-slate-700/50">
                <span className="text-xs font-sans text-gray-600 dark:text-gray-400">{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-sans"
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 text-sm overflow-x-auto"><code className={`language-${language}`}>{content.trim()}</code></pre>
        </div>
    );
};

const parseContent = (text: string, sources: Record<string, RAGSource>): ContentPart[] => {
  const parts: ContentPart[] = [];
  // 1. 引用 [source:...]
  // 2. 代码块 ```...```
  // 3. 行内代码 `...`
  // 4. 加粗 **...** (注意：不能包含 `**` 在内部)
  // 5. 斜体 *...* (注意：不能包含 `*` 在内部，且不在单词内部)
  const regex = /\[((?:source:\s*)?.+?)\]|```(\S*)\n?([\s\S]*?)```|`([^`]+)`|\*\*([^\*]+)\*\*|\*([^\*]+)\*/g;
  let lastIndex = 0;
  let match;
  const availableSourcePaths = Object.keys(sources);

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }

    // 捕获组索引现在是：
    // match[1]: 引用
    // match[2], match[3]: 代码块
    // match[4]: 行内代码
    // match[5]: 加粗
    // match[6]: 斜体

    if (match[1] && !match[2] && match[1].includes(':')) {
      const innerText = match[1];
      const citationsInBlock: Citation[] = [];
      let lastFilePath: string | null = null;
      
      const citationParts = innerText.split(',').map(p => p.trim());

      for(const part of citationParts) {
          const fullCitationMatch = part.match(/(?:source:\s*)?([\w\/\.-]+):(\d+)(?:-(\d+))?/);
          if (fullCitationMatch) {
              const parsedFilePath = fullCitationMatch[1];
              const startLine = parseInt(fullCitationMatch[2], 10);
              const endLine = fullCitationMatch[3] ? parseInt(fullCitationMatch[3], 10) : startLine;

              let resolvedFilePath: string | null = null;
              if (availableSourcePaths.includes(parsedFilePath)) {
                  resolvedFilePath = parsedFilePath;
              } else {
                  const matchingPaths = availableSourcePaths.filter(p => p.endsWith('/' + parsedFilePath) || p === parsedFilePath);
                  if (matchingPaths.length > 0) {
                      resolvedFilePath = matchingPaths[0];
                  }
              }

              if(resolvedFilePath) {
                citationsInBlock.push({ filePath: resolvedFilePath, startLine, endLine, text: part });
                lastFilePath = resolvedFilePath;
              }
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
          parts.push({ type: 'citation', citations: citationsInBlock });
      } else {
          parts.push({ type: 'text', content: match[0] });
      }
    } 
    else if (match[2] !== undefined) {
      parts.push({
        type: 'code',
        language: match[2],
        content: match[3],
      });
    } else if (match[4]) {
      parts.push({
        type: 'inline_code',
        content: match[4]
      });
    } else if (match[5]) { // 处理加粗
      parts.push({
        type: 'bold',
        content: parseContent(match[5], sources)
      });
    } else if (match[6]) { // 处理斜体
      parts.push({
        type: 'italic',
        content: parseContent(match[6], sources)
      });
    } else {
        parts.push({ type: 'text', content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }
  return parts;
};

interface ContentRendererProps {
  parts: ContentPart[];
  sources: Record<string, RAGSource>;
  onCitationClick: (highlight: ActiveHighlight, element: HTMLElement) => void;
  isFocusModeActive: boolean;
  focusedHighlight: ActiveHighlight | null;
}

const RecursiveRenderer: React.FC<ContentRendererProps> = ({ 
  parts, 
  sources, 
  onCitationClick, 
  isFocusModeActive, 
  focusedHighlight 
}) => {
  return (
    <>
      {parts.map((part, index) => {
        switch (part.type) {
          case 'text':
            return <span key={index}>{part.content}</span>;

          case 'code':
            return <CodeBlock key={index} language={part.language} content={part.content} />;

          case 'citation': {
            const citations = part.citations;
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

            const highlightPayload = citations.map(c => ({ filePath: c.filePath, startLine: c.startLine, endLine: c.endLine }));

            const isThisCitationFocused = isFocusModeActive && focusedHighlight && 
              JSON.stringify(highlightPayload) === JSON.stringify(focusedHighlight);

            return (
              <span
                key={index}
                data-citation-payload={JSON.stringify(highlightPayload)}
                className={`relative bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-mono text-sm px-1.5 py-0.5 rounded-md cursor-pointer transition-all hover:bg-blue-200 dark:hover:bg-blue-800/60 
                  ${isThisCitationFocused ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''}
                  group
                `}
                onClick={(e) => onCitationClick(highlightPayload, e.currentTarget)}
              >
                [{displayText}]
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  Click to focus
                </span>
              </span>
            );
          }
          
          case 'inline_code':
            return (
              <code key={index} className="bg-gray-100 dark:bg-gray-700 font-semibold rounded px-1.5 py-0.5 mx-0.5">
                {part.content}
              </code>
            );

          case 'bold':
            return (
              <strong key={index} className="font-bold">
                {/* 递归渲染：将所有 props 传递下去，但使用新的 parts */}
                <RecursiveRenderer {...{ parts: part.content, sources, onCitationClick, isFocusModeActive, focusedHighlight }} />
              </strong>
            );

          case 'italic':
            return (
              <em key={index} className="italic">
                {/* 递归渲染：将所有 props 传递下去，但使用新的 parts */}
                <RecursiveRenderer {...{ parts: part.content, sources, onCitationClick, isFocusModeActive, focusedHighlight }} />
              </em>
            );

          default:
            return null;
        }
      })}
    </>
  );
};

const ContentRenderer: React.FC<{ 
    content: string; 
    sources: Record<string, RAGSource>;
    onCitationClick: (highlight: ActiveHighlight, element: HTMLElement) => void;
    isFocusModeActive: boolean;
    focusedHighlight: ActiveHighlight | null;
}> = ({ content, sources, onCitationClick, isFocusModeActive, focusedHighlight }) => {
  const parts = parseContent(content, sources);
  
  return (
    <RecursiveRenderer 
      parts={parts} 
      sources={sources} 
      onCitationClick={onCitationClick}
      isFocusModeActive={isFocusModeActive}
      focusedHighlight={focusedHighlight}
    />
  );
  
};

interface QAPairRendererProps {
  qa: QAPair;
  isLast: boolean;
  streamingData: {
    isLoading: boolean;
    error: string | null;
    statusMessage: string;
  };
  onEnterFocusMode: (highlight: ActiveHighlight, element: HTMLElement, qaPairContainer: HTMLElement) => void;
  isFocusModeActive: boolean;
  focusedHighlight: ActiveHighlight | null;
}

const QAPairRenderer: React.FC<QAPairRendererProps> = ({ qa, isLast, streamingData, onEnterFocusMode, isFocusModeActive, focusedHighlight }) => {
    const leftColRef = useRef<HTMLDivElement>(null);
    const rightColRef = useRef<HTMLDivElement>(null);
    const qaPairRef = useRef<HTMLDivElement>(null);
    const { isLoading, error, statusMessage } = streamingData;
    const isStreamingThisBlock = isLast && isLoading;

    useEffect(() => {
        const setMaxHeight = () => {
            if (leftColRef.current && rightColRef.current) {
                const leftHeight = leftColRef.current.offsetHeight;
                rightColRef.current.style.maxHeight = `${leftHeight}px`;
                rightColRef.current.style.height = ''; 
            }
        };

        if (qa.answer || isStreamingThisBlock) {
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
        <div ref={qaPairRef} className="flex flex-col md:flex-row gap-6">
            <div ref={leftColRef} className="md:w-2/5 flex flex-col gap-4">
                <div className="flex justify-start">
                    <div className="bg-blue-500 text-white p-3 rounded-lg w-full">
                        <p>{qa.question}</p>
                    </div>
                </div>
                
                { (qa.answer || isStreamingThisBlock) && (
                    <div className="flex justify-start mt-2">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg prose prose-sm dark:prose-invert break-words whitespace-pre-wrap w-full border border-gray-200 dark:border-gray-700">
                            <ContentRenderer 
                                content={qa.answer} 
                                sources={qa.sources}
                                onCitationClick={(highlight, element) => {
                                    if (qaPairRef.current) {
                                        onEnterFocusMode(highlight, element, qaPairRef.current);
                                    } else {
                                      console.log("QAPair container ref is not available.")
                                    }
                                }}
                                isFocusModeActive={isFocusModeActive}
                                focusedHighlight={focusedHighlight}
                            />
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
                        highlight={focusedHighlight}
                        activeAnswer={qa.answer}
                        isFocusModeActive={isFocusModeActive}
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
  };
  onEnterFocusMode: (highlight: ActiveHighlight, element: HTMLElement,  qaPairContainer: HTMLElement) => void;
  isFocusModeActive: boolean;
  focusedHighlight: ActiveHighlight | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, streamingData, onEnterFocusMode, isFocusModeActive, focusedHighlight }) => {
  return (
    <div>
      {history.map((qa, index) => (
        <div 
          key={qa.id} 
          className={
            // ✨ 3. 对非第一个元素应用样式
            index > 0 
              ? "border-t border-gray-200 dark:border-gray-700/50 pt-12 mt-12" 
              : ""
          }
        >
          <QAPairRenderer
            qa={qa}
            isLast={index === history.length - 1}
            streamingData={streamingData}
            onEnterFocusMode={onEnterFocusMode}
            isFocusModeActive={isFocusModeActive}
            focusedHighlight={focusedHighlight}
          />
        </div>
      ))}
    </div>
  );
};