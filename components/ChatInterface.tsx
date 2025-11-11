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
    focusedHighlight: ActiveHighlight | null;
}> = ({ content, sources, onCitationClick, focusedHighlight }) => {

  // ✨ 步骤 1: 创建一个通用的、可重用的函数来处理子节点
  // 这个函数的核心逻辑和我们之前讨论的一样，但现在它可以被任何组件调用
  const processChildrenForCitations = (children: React.ReactNode): React.ReactNode[] => {
      const childrenArray = React.Children.toArray(children);
      const newChildren: React.ReactNode[] = [];

      childrenArray.forEach((child) => {
          if (typeof child === 'string') {
              const citationRegex = /\[source:[^\]]+\]/g;
              let lastIndex = 0;
              
              // 使用 .exec() 循环查找所有匹配项
              let match;
              while ((match = citationRegex.exec(child)) !== null) {
                  // 1. 添加上一个匹配项到当前匹配项之间的纯文本
                  if (match.index > lastIndex) {
                      newChildren.push(child.substring(lastIndex, match.index));
                  }
                  
                  // 2. 添加 CitationSpan 组件
                  const citationText = match[0];
                  newChildren.push(
                      <CitationSpan
                          key={`${citationText}-${match.index}`}
                          citationText={citationText}
                          sources={sources}
                          onCitationClick={onCitationClick}
                          focusedHighlight={focusedHighlight}
                      />
                  );
                  
                  // 3. 更新下一个纯文本的起始位置
                  lastIndex = citationRegex.lastIndex;
              }
              
              // 4. 添加最后一个匹配项之后剩余的纯文本
              if (lastIndex < child.length) {
                  newChildren.push(child.substring(lastIndex));
              }

          } else {
              newChildren.push(child); // 保留非字符串元素 (如 <strong>)
          }
      });
      
      return newChildren;
  };


  const createComponents = () => {
    return {
        // ✨ 步骤 2: 将通用函数应用到所有可能包含引用的块级元素上
        p: ({ node, children, ...props }) => <p {...props}>{processChildrenForCitations(children)}</p>,
        li: ({ node, children, ...props }) => <li {...props}>{processChildrenForCitations(children)}</li>,
        td: ({ node, children, ...props }) => <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props}>{processChildrenForCitations(children)}</td>,
        th: ({ node, children, ...props }) => <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold" {...props}>{processChildrenForCitations(children)}</th>,
        blockquote: ({ node, children, ...props }) => <blockquote {...props}>{processChildrenForCitations(children)}</blockquote>,

        // --- 其他渲染器保持不变或进行微调 ---
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <CodeBlock language={match[1]} content={String(children).replace(/\n$/, '')} />
          ) : ( <code className="bg-gray-100 dark:bg-gray-700 font-semibold rounded px-1.5 py-0.5 mx-0.5" {...props}>{children}</code> );
        },
        table: ({ node, ...props }) => <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 my-4" {...props} />,
        thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="bg-white dark:bg-gray-900" {...props} />,
        tr: ({ node, ...props }) => <tr className="border-t border-gray-200 dark:border-gray-700" {...props} />,
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
  onCitationClick: (highlight: ActiveHighlight, qaId: string) => void;
  activeFocus: { qaId: string; highlight: ActiveHighlight } | null;
}

const QAPairRenderer: React.FC<QAPairRendererProps> = ({ qa, isLast, streamingData, onCitationClick, activeFocus }) => {
    const leftColRef = useRef<HTMLDivElement>(null);
    const rightColRef = useRef<HTMLDivElement>(null);
    const qaPairRef = useRef<HTMLDivElement>(null);
    const { isLoading, error, statusMessage } = streamingData;
    
    const isThisQaPairActive = activeFocus?.qaId === qa.id;
    const focusedHighlightForThisQa = isThisQaPairActive ? activeFocus.highlight : null;

    useEffect(() => {
        const setMaxHeight = () => {
            if (leftColRef.current && rightColRef.current) {
                const leftHeight = leftColRef.current.offsetHeight;
                rightColRef.current.style.maxHeight = `${leftHeight}px`;
                rightColRef.current.style.height = ''; 
            }
        };

        if (qa.answer || (isLast && isLoading)) {
            const timer = setTimeout(setMaxHeight, 50);
            window.addEventListener('resize', setMaxHeight);
            return () => {
              clearTimeout(timer);
              window.removeEventListener('resize', setMaxHeight);
            }
        }
    }, [qa.answer, isLast, isLoading]);

    const showSources = Object.keys(qa.sources).length > 0;

    return (
        <div ref={qaPairRef} className="flex flex-col md:flex-row gap-6">
            <div ref={leftColRef} className="md:w-2/5 flex flex-col gap-4">
                <div className="flex justify-start">
                    <div className="bg-blue-500 text-white p-3 rounded-lg w-full">
                        <p>{qa.question}</p>
                    </div>
                </div>
                
                { (qa.answer || (isLast && isLoading)) && (
                    <div className="flex justify-start mt-2">
                         <div className="bg-white dark:bg-gray-800 p-3 rounded-lg w-full border border-gray-200 dark:border-gray-700 
                                      prose prose-sm dark:prose-invert max-w-none 
                                      prose-h2:border-b prose-h2:pb-2 prose-h2:mb-4
                                      dark:prose-h2:border-gray-600">
                            <ContentRenderer 
                                content={qa.answer} 
                                sources={qa.sources}
                                // ✨ 关键修正点 ✨
                                // 我们创建一个新的函数，它接收 ContentRenderer 传递的参数 (highlight, element)，
                                // 然后调用从 props 接收的 onCitationClick，并附加上我们需要的 qa.id。
                                onCitationClick={(highlight, element) => {
                                    if (onCitationClick) { // 安全检查
                                        onCitationClick(highlight, qa.id);
                                    }
                                }}
                                focusedHighlight={focusedHighlightForThisQa}
                                // onEnterFocusMode is no longer needed, so this call is now cleaner
                            />
                            {isLoading && isLast && statusMessage && <span className="ml-2 text-gray-500 italic text-xs animate-pulse">{statusMessage}</span>}
                            {isLoading && isLast && !statusMessage && qa.answer && <span className="inline-block w-2 h-4 bg-gray-600 dark:bg-gray-400 animate-pulse ml-1"></span>}
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
                        highlight={focusedHighlightForThisQa}
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
  onCitationClick: (highlight: ActiveHighlight, qaId: string) => void;
  activeFocus: { qaId: string; highlight: ActiveHighlight } | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, streamingData, onCitationClick, activeFocus }) => {
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
            activeFocus={activeFocus} 
          />
        </div>
      ))}
    </div>
  );
};