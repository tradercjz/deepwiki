import React, { useState, useRef, useEffect } from 'react';
import { QAPair, RAGSource, ActiveHighlight, Citation } from '../types';
import { SourceViewer } from './SourceViewer';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ContentPart =
  | { type: 'text'; content: string }
  | { type: 'citation'; citations: Citation[] }
  | { type: 'code'; language: string; content: string }
  | { type: 'inline_code'; content: string }
  | { type: 'bold'; content: ContentPart[]}
  | { type: 'italic'; content: ContentPart[] }; 



interface ContentRendererProps {
  parts: ContentPart[];
  sources: Record<string, RAGSource>;
  onCitationClick: (highlight: ActiveHighlight, element: HTMLElement) => void;
  isFocusModeActive: boolean;
  focusedHighlight: ActiveHighlight | null;
}

const CitationSpan: React.FC<{
  citationText: string;
  sources: Record<string, RAGSource>;
  onCitationClick: (highlight: ActiveHighlight, element: HTMLElement) => void;
  isFocusModeActive: boolean;
  focusedHighlight: ActiveHighlight | null;
}> = ({ citationText, sources, onCitationClick, isFocusModeActive, focusedHighlight }) => {
  const availableSourcePaths = Object.keys(sources);

  try {
    const citationsInBlock: Citation[] = [];
    let lastFilePath: string | null = null;
    
    // 解析 [source:...] 内部的文本，去掉首尾的方括号
    const innerText = citationText.slice(1, -1);
    const citationParts = innerText.split(',').map(p => p.trim());

    for (const part of citationParts) {
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

        if (resolvedFilePath) {
          citationsInBlock.push({ filePath: resolvedFilePath, startLine, endLine, text: part });
          lastFilePath = resolvedFilePath;
        }
      } else {
        const rangeMatch = part.match(/^(\d+)(?:-(\d+))?$/);
        if (rangeMatch && lastFilePath) {
          const startLine = parseInt(rangeMatch[1], 10);
          const endLine = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : startLine;
          citationsInBlock.push({ filePath: lastFilePath, startLine, endLine, text: part });
        }
      }
    }

    if (citationsInBlock.length === 0) {
      return <span>{citationText}</span>; // 解析失败则原文返回
    }
    
    const groupedByFile = citationsInBlock.reduce((acc, c) => {
        if (!acc[c.filePath]) acc[c.filePath] = [];
        acc[c.filePath].push(c);
        return acc;
    }, {} as Record<string, Citation[]>);

    const displayText = Object.entries(groupedByFile).map(([filePath, fileCitations]) => {
        // ✨ 只显示文件名
        const fileName = filePath.replace(/\\/g, '/').split('/').pop() || filePath;
        const ranges = fileCitations.map(c => c.startLine === c.endLine ? c.startLine : `${c.startLine}-${c.endLine}`).join(', ');
        return `${fileName}:${ranges}`;
    }).join('; ');

    const highlightPayload = citationsInBlock.map(c => ({ filePath: c.filePath, startLine: c.startLine, endLine: c.endLine }));

    const isThisCitationFocused = isFocusModeActive && focusedHighlight && 
      JSON.stringify(highlightPayload) === JSON.stringify(focusedHighlight);

    return (
      <span
        data-citation-payload={JSON.stringify(highlightPayload)}
        className={`relative bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-mono text-sm px-1.5 py-0.5 rounded-md cursor-pointer transition-all hover:bg-blue-200 dark:hover:bg-blue-800/60 
          ${isThisCitationFocused ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''}
          group
        `}
        onClick={(e) => onCitationClick(highlightPayload, e.currentTarget)}
      >
        [{displayText}]
      </span>
    );
  } catch (error) {
    console.error("Failed to parse citation:", citationText, error);
    return <span>{citationText}</span>;
  }
};

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
            // Fallback for non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = content;
            textArea.style.position = 'fixed';
            textArea.style.top = '-9999px';
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
                console.error('Fallback copy failed: ', err);
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

const ContentRenderer: React.FC<{ 
    content: string; 
    sources: Record<string, RAGSource>;
    onCitationClick: (highlight: ActiveHighlight, element: HTMLElement) => void;
    isFocusModeActive: boolean;
    focusedHighlight: ActiveHighlight | null;
}> = ({ content, sources, onCitationClick, isFocusModeActive, focusedHighlight }) => {

  const renderParagraph = ({ node, children }) => {
      const childrenArray = React.Children.toArray(children);
      const newChildren: React.ReactNode[] = [];

      childrenArray.forEach((child) => {
          if (typeof child === 'string') {
              const citationRegex = /\[source:[^\]]+\]/g;
              const parts = child.split(citationRegex);
              const matches = [...child.matchAll(citationRegex)];

              newChildren.push(parts[0]);
              for (let i = 0; i < matches.length; i++) {
                  const match = matches[i][0];
                  newChildren.push(
                      <CitationSpan
                          key={`${match}-${i}`}
                          citationText={match}
                          sources={sources}
                          onCitationClick={onCitationClick}
                          isFocusModeActive={isFocusModeActive}
                          focusedHighlight={focusedHighlight}
                      />
                  );
                  newChildren.push(parts[i + 1]);
              }
          } else {
              newChildren.push(child);
          }
      });

      return <p>{newChildren}</p>;
  };

  const createComponents = () => {
    return {
        p: renderParagraph,
        // ✨ CodeBlock 渲染器
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <CodeBlock language={match[1]} content={String(children).replace(/\n$/, '')} />
          ) : ( <code className="bg-gray-100 dark:bg-gray-700 font-semibold rounded px-1.5 py-0.5 mx-0.5" {...props}>{children}</code> );
        },
        table: ({ node, ...props }) => <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 my-4" {...props} />,
        thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
        th: ({ node, ...props }) => <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="bg-white dark:bg-gray-900" {...props} />,
        tr: ({ node, ...props }) => <tr className="border-t border-gray-200 dark:border-gray-700" {...props} />,
        td: ({ node, ...props }) => <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props} />,
        a: ({ node, href, children, ...props }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-600" {...props}>{children}</a>,
    }
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      children={content}
      components={createComponents()}
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
  onCitationClick: (highlight: ActiveHighlight) => void;
  focusedHighlight: ActiveHighlight | null;
}

const QAPairRenderer: React.FC<QAPairRendererProps> = ({ qa, isLast, streamingData, onCitationClick, focusedHighlight }) => {
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
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg w-full border border-gray-200 dark:border-gray-700 
                            prose prose-sm dark:prose-invert max-w-none 
                            prose-h2:border-b prose-h2:pb-2 prose-h2:mb-4
                            dark:prose-h2:border-gray-600">
                            <ContentRenderer 
                                content={qa.answer} 
                                sources={qa.sources} // 传回 sources
                                onCitationClick={(highlight, element) => onCitationClick(highlight)}
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
  onCitationClick: (highlight: ActiveHighlight) => void;
  focusedHighlight: ActiveHighlight | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, streamingData, onCitationClick, focusedHighlight }) => {
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
            onCitationClick={onCitationClick}
            focusedHighlight={focusedHighlight}
          />
        </div>
      ))}
    </div>
  );
};