import React, { useState, useRef, useEffect } from 'react';
import { QAPair, RAGSource, ActiveHighlight, Citation } from '../types';
import { SourceViewer } from './SourceViewer';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

type ContentPart =
  | { type: 'text'; content: string }
  | { type: 'citation'; citations: Citation[] }
  | { type: 'code'; language: string; content: string };

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
            // Fallback for insecure contexts or older browsers
            const textArea = document.createElement('textarea');
            textArea.value = content;
            
            // Make the textarea invisible
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


const parseContent = (text: string): ContentPart[] => {
  const parts: ContentPart[] = [];
  // Updated regex to be more flexible with newlines and language identifiers for code blocks.
  const regex = /\[(source:.+?)\]|```(\S*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }

    // Handle citation block
    if (match[1]) {
      const innerText = match[1];
      const citationsInBlock: Citation[] = [];
      let lastFilePath: string | null = null;
      
      const citationParts = innerText.split(',').map(p => p.trim());

      for(const part of citationParts) {
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
          parts.push({ type: 'citation', citations: citationsInBlock });
      } else {
          parts.push({ type: 'text', content: match[0] });
      }
    } 
    // Handle code block
    else if (match[2] !== undefined) {
      parts.push({
        type: 'code',
        language: match[2],
        content: match[3],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }
  return parts;
};


const ContentRenderer: React.FC<{ 
    content: string; 
    onHighlight: (h: ActiveHighlight | null) => void;
    onCitationHover: (element: HTMLElement, citations: Citation[]) => void;
    onCitationLeave: () => void;
}> = ({ content, onHighlight, onCitationHover, onCitationLeave }) => {
  const parts = parseContent(content);
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

            return (
              <span
                key={index}
                className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-mono text-sm px-1.5 py-0.5 rounded-md cursor-pointer transition-colors hover:bg-blue-200 dark:hover:bg-blue-800/60"
                onMouseEnter={(e) => {
                    const highlightPayload = citations.map(c => ({ filePath: c.filePath, startLine: c.startLine, endLine: c.endLine }));
                    onHighlight(highlightPayload);
                    onCitationHover(e.currentTarget, citations);
                }}
                onMouseLeave={() => {
                    onHighlight(null);
                    onCitationLeave();
                }}
              >
                [{displayText}]
              </span>
            );
          }
          default:
            return null;
        }
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

const FloatingCitation: React.FC<{
  citations: Citation[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ citations, onMouseEnter, onMouseLeave }) => {
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
        <div 
            className="fixed top-20 left-4 sm:left-6 lg:left-8 z-20 transition-all duration-300 ease-out"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
          <div className="flex items-center gap-2">
            <span
                className="bg-white dark:bg-slate-800 shadow-lg text-blue-600 dark:text-blue-300 font-mono text-sm px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-700"
            >
                [{displayText}]
            </span>
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>
        </div>
    );
};

const QAPairRenderer: React.FC<QAPairRendererProps> = ({ qa, isLast, streamingData }) => {
    const leftColRef = useRef<HTMLDivElement>(null);
    const rightColRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const [activeHighlight, setActiveHighlight] = useState<ActiveHighlight | null>(null);
    const [floatingCitation, setFloatingCitation] = useState<{ element: HTMLElement; citations: Citation[] } | null>(null);

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

    const handleCitationHover = (element: HTMLElement, citations: Citation[]) => {
        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    setFloatingCitation({ element, citations });
                } else {
                    setFloatingCitation(null);
                }
            },
            { threshold: 1.0 }
        );
        observerRef.current.observe(element);
    };

    const handleCitationLeave = () => {
        observerRef.current?.disconnect();
        setFloatingCitation(null);
    };

    const showSources = Object.keys(qa.sources).length > 0;

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {floatingCitation && (
                <FloatingCitation
                    citations={floatingCitation.citations}
                    onMouseEnter={() => {
                        const highlightPayload = floatingCitation.citations.map(c => ({ filePath: c.filePath, startLine: c.startLine, endLine: c.endLine }));
                        setActiveHighlight(highlightPayload);
                    }}
                    onMouseLeave={() => setActiveHighlight(null)}
                />
            )}
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
                                onHighlight={setActiveHighlight} 
                                onCitationHover={handleCitationHover}
                                onCitationLeave={handleCitationLeave}
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