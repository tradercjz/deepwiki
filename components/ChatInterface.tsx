import React, { useState, useRef, useEffect } from 'react';
import { QAPair, RAGSource, ActiveHighlight, Citation } from '../types';
import { SourceViewer } from './SourceViewer';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom'; 
import { AppMode } from '../visualizer/constants';

const FUNCTION_TO_MODE_MAP: Record<string, AppMode> = {
    'conditionalIterate': 'conditionalIterate',
    'createReactiveStateEngine': 'conditionalIterate',
    'tmsum': 'tmFunction',
    'pivot': 'pivot',
    'createTimeSeriesEngine': 'createTimeSeriesEngine',
    'dailyAlignedBar': 'createTimeSeriesEngine', // 关联相关函数
};

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
  onShowVisualizer?: (mode: AppMode) => void; 
  isStreaming?: boolean; 
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
      // 允许 source 和 : 之间，以及 : 和行号之间有空格
      const fullCitationMatch = part.match(/(?:source\s*:\s*)?([\w\/\s\.-]+?)\s*:\s*(\d+)(?:-(\d+))?/);
      
      if (fullCitationMatch) {
        const parsedFilePath = fullCitationMatch[1].trim();
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
          whitespace-nowrap
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

const CodeBlock: React.FC<{ 
    language: string; 
    content: string; 
    onShowVisualizer?: (mode: AppMode) => void;
    isStreaming?: boolean;
}> = ({ language, content, onShowVisualizer, isStreaming }) => {
    const [copied, setCopied] = useState(false);

    const detectedMode = React.useMemo(() => {
        for (const [func, mode] of Object.entries(FUNCTION_TO_MODE_MAP)) {
            if (content.includes(func)) {
                return mode;
            }
        }
        return null;
    }, [content]);

    console.log("Content:", content, "Detected Mode:", detectedMode);

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
                <div className="flex items-center gap-3">
                    <span className="text-xs font-sans text-gray-600 dark:text-gray-400">{language || 'code'}</span>
                    
                    {/* ✨ 3D 特效按钮 ✨ */}
                    {detectedMode && onShowVisualizer && (
                        <button
                            onClick={() => onShowVisualizer(detectedMode)}
                            disabled={isStreaming} // ✨ 禁用按钮
                            className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold text-white rounded-full transition-all shadow-sm 
                                ${isStreaming 
                                    ? 'bg-gray-400 cursor-not-allowed opacity-70' // ✨ 流式传输时的样式：灰色、不可点
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:shadow-md animate-pulse cursor-pointer' // ✨ 正常样式
                                }
                            `}
                            title={isStreaming ? "Waiting for generation to complete..." : "Launch 3D Visualization"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                            3D Demo
                        </button>
                    )}
                </div>
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

const ImageThumbnail: React.FC<{ image: File | string }> = ({ image }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let objectUrl: string | null = null;

    if (image instanceof File) {
      // 1. 只有当 image 文件对象改变时，才创建新的 URL
      objectUrl = URL.createObjectURL(image);
      setSrc(objectUrl);
    } else {
      setSrc(image);
    }

    // 2. ✨ 关键：组件卸载或 image 变化时，销毁旧的 URL，释放内存！
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [image]);

  if (!src) return <div className="h-24 w-24 bg-gray-200 animate-pulse rounded-lg" />;

  return (
    <div className="relative group">
      <img 
        src={src} 
        alt="attachment" 
        className="h-24 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => window.open(src, '_blank')} 
      />
    </div>
  );
};

const ImageGrid: React.FC<{ images: (File | string)[] }> = ({ images }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3">
        {images.map((img, idx) => (
            <ImageThumbnail key={idx} image={img} />
        ))}
        </div>
    );
};

const ContentRenderer: React.FC<{ 
    content: string; 
    sources: Record<string, RAGSource>;
    onCitationClick: (highlight: ActiveHighlight, element: HTMLElement) => void;
    focusedHighlight: ActiveHighlight | null;
    onShowVisualizer: (mode: AppMode) => void;
    isStreaming: boolean;
}> = ({ content, sources, onCitationClick, focusedHighlight,onShowVisualizer,isStreaming }) => {

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
            <CodeBlock 
                language={match[1]} 
                content={String(children).replace(/\n$/, '')} 
                onShowVisualizer={onShowVisualizer}
                isStreaming={isStreaming}
            />
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
    history: QAPair[]; 
    index: number;
    onShowVisualizer?: (mode: AppMode) => void;
}

const QAPairRenderer: React.FC<QAPairRendererProps> = ({ qa, isLast, streamingData, onCitationClick, activeFocus, history, index, onShowVisualizer }) => {
    const leftColRef = useRef<HTMLDivElement>(null);
    const rightColRef = useRef<HTMLDivElement>(null);
    const qaPairRef = useRef<HTMLDivElement>(null);
    const copyMenuRef = useRef<HTMLDivElement>(null); 
    const { isLoading, error, statusMessage } = streamingData;
    const isStreamingThisBlock = isLast && isLoading;
    
    const isThisQaPairActive = activeFocus?.qaId === qa.id;
    const focusedHighlightForThisQa = isThisQaPairActive ? activeFocus.highlight : null;

    const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'response' | 'thread'>('idle');

    // ✨ 3. 辅助函数：将 QA 对象格式化为 Markdown 文本
    const formatSingleQAPair = (pair: QAPair): string => {
    let content = `## Question\n\n> ${pair.question}\n\n## Answer\n\n${pair.answer}`;
    
    // ✨ 1. 解析答案文本，找出所有实际的引用
    const citations: Citation[] = [];
    const citationBlockRegex = /\[((?:source:\s*)?.+?)\]/g;
    let blockMatch;

    while ((blockMatch = citationBlockRegex.exec(pair.answer)) !== null) {
        const innerText = blockMatch[1];
        let lastFilePath: string | null = null;
        const citationParts = innerText.split(',');

        for (const part of citationParts) {
            const trimmedPart = part.trim();
            const fullCitationRegex = /(?:source\s*:\s*)?([\w\/\s\.-]+?)\s*:\s*(\d+)(?:-(\d+))?/;
            const rangeOnlyRegex = /^(\d+)(?:-(\d+))?$/;

            let partMatch = trimmedPart.match(fullCitationRegex);
            if (partMatch) {
                const parsedFilePath = partMatch[1].trim();
                let resolvedFilePath = Object.keys(pair.sources).find(p => p.endsWith('/' + parsedFilePath) || p === parsedFilePath) || null;

                if (resolvedFilePath) {
                    const startLine = parseInt(partMatch[2], 10);
                    const endLine = partMatch[3] ? parseInt(partMatch[3], 10) : startLine;
                    citations.push({ filePath: resolvedFilePath, startLine, endLine, text: trimmedPart });
                    lastFilePath = resolvedFilePath;
                }
            } else {
                partMatch = trimmedPart.match(rangeOnlyRegex);
                if (partMatch && lastFilePath) {
                    const startLine = parseInt(partMatch[1], 10);
                    const endLine = partMatch[2] ? parseInt(partMatch[2], 10) : startLine;
                    citations.push({ filePath: lastFilePath, startLine, endLine, text: trimmedPart });
                }
            }
        }
    }

    // ✨ 2. 如果解析出了引用，则提取并格式化这些片段
    if (citations.length > 0) {
        content += "\n\n## Sources\n\n";

        // 按文件路径对引用进行分组
        const groupedByFile = citations.reduce((acc, c) => {
            if (!acc[c.filePath]) acc[c.filePath] = [];
            acc[c.filePath].push(c);
            return acc;
        }, {} as Record<string, { startLine: number, endLine: number }[]>);

        // ✨ 3. 遍历分组后的文件，从每个文件中提取片段
        for (const filePath in groupedByFile) {
            const sourceDoc = pair.sources[filePath];
            if (!sourceDoc) continue;

            const fileName = filePath.split('/').pop() || filePath;
            content += `### Source: ${fileName}\n\n`;
            
            const fileContentLines = sourceDoc.content.split('\n');
            const ranges = groupedByFile[filePath];

            // 对每个文件的引用范围进行排序和合并，避免重复拷贝
            ranges.sort((a, b) => a.startLine - b.startLine);
            const mergedRanges: {startLine: number, endLine: number}[] = [];
            if (ranges.length > 0) {
                mergedRanges.push({...ranges[0]});
                for (let i = 1; i < ranges.length; i++) {
                    const last = mergedRanges[mergedRanges.length - 1];
                    if (ranges[i].startLine <= last.endLine + 1) {
                        last.endLine = Math.max(last.endLine, ranges[i].endLine);
                    } else {
                        mergedRanges.push({...ranges[i]});
                    }
                }
            }

            // 提取合并后的代码片段
            mergedRanges.forEach(range => {
                const snippet = fileContentLines.slice(range.startLine - 1, range.endLine).join('\n');
                content += `// Lines ${range.startLine}-${range.endLine}\n`;
                content += "```\n" + snippet + "\n```\n\n";
            });
        }
    }
    
    return content;
};

    const copyToClipboard = (text: string) => {
      // ✨ 1. 优先使用现代、安全的 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(err => {
                console.error("Clipboard API failed:", err);
            });
        } else {
            // ✨ 2. 如果不安全，则回退到传统的 execCommand 方法
            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            // 样式设置，防止在屏幕上闪烁
            textArea.style.position = 'fixed';
            textArea.style.top = '-9999px';
            textArea.style.left = '-9999px';
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (!successful) {
                    console.error('Fallback: Copy command was not successful.');
                }
            } catch (err) {
                console.error('Fallback copy failed:', err);
            } finally {
                document.body.removeChild(textArea);
            }
        }
    };

    const handleCopy = (type: 'response' | 'thread') => {
        let textToCopy = '';
        if (type === 'response') {
            textToCopy = formatSingleQAPair(qa);
        } else {
            const threadSlice = history.slice(0, index + 1);
            textToCopy = threadSlice.map(formatSingleQAPair).join('\n\n---\n\n');
        }
        copyToClipboard(textToCopy);
        setCopyStatus(type);
        setIsCopyMenuOpen(false);
        setTimeout(() => setCopyStatus('idle'), 2000);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (copyMenuRef.current && !copyMenuRef.current.contains(event.target as Node)) {
                setIsCopyMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        {qa.images && qa.images.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-blue-400/50">
                                <ImageGrid images={qa.images} />
                            </div>
                        )}
                    </div>
                </div>
                
                { (qa.answer || (isLast && isLoading)) && (
                    <div className="relative flex justify-start mt-2">
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
                                onShowVisualizer={onShowVisualizer} 
                                isStreaming={isStreamingThisBlock} 
                            />
                            {isLoading && isLast && statusMessage && <span className="ml-2 text-gray-500 italic text-xs animate-pulse">{statusMessage}</span>}
                            {isLoading && isLast && !statusMessage && qa.answer && <span className="inline-block w-2 h-4 bg-gray-600 dark:bg-gray-400 animate-pulse ml-1"></span>}
                        </div>
                        { !isStreamingThisBlock && qa.answer && (
                            <div ref={copyMenuRef} className="absolute bottom-3 right-3">
                                <button
                                    onClick={() => setIsCopyMenuOpen(prev => !prev)}
                                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-md transition-colors"
                                    aria-label="Copy options"
                                >
                                    {copyStatus !== 'idle' ? <CheckIcon /> : <CopyIcon />}
                                </button>
                                {isCopyMenuOpen && (
                                    <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg z-10">
                                        <button 
                                            onClick={() => handleCopy('response')}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Copy Response
                                        </button>
                                        <button 
                                            onClick={() => handleCopy('thread')}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Copy Thread
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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
  onShowVisualizer?: (mode: AppMode) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, streamingData, onCitationClick, activeFocus, onShowVisualizer }) => {
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
            history={history}
            index={index}
            onShowVisualizer={onShowVisualizer} 
          />
        </div>
      ))}
    </div>
  );
};