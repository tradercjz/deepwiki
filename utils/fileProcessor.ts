// src/utils/fileProcessor.ts
import * as pdfjsLib from 'pdfjs-dist';

// 1. 设置 Worker
// ⚠️ 关键：Vite/Webpack 环境下，需要指定 worker 的地址。
// 使用 unpkg CDN 是最简单且兼容性最好的方式，避免构建工具配置噩梦。
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * 解析 PDF 文件内容为纯文本
 */
const readPdfAsText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    // 遍历每一页提取文本
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // 将页面内的文本块拼接（简单拼接，可能会丢失复杂排版，但对 LLM 足够了）
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
        
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }
    
    return fullText;
  } catch (error) {
    console.error("PDF Parse Error:", error);
    throw new Error("Failed to parse PDF file.");
  }
};

/**
 * 读取普通文本文件 (.txt, .md, .dos, .csv, .json 等)
 */
const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

/**
 * 统一入口：根据文件类型自动选择解析策略
 */
export const processFileToText = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // 1. 处理 PDF
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await readPdfAsText(file);
  }

  // 2. 处理 Word (如果你安装了 mammoth，可以在这里加逻辑)
  // if (fileName.endsWith('.docx')) { ... }

  // 3. 默认作为文本处理 (代码文件、Markdown、Logs)
  // 为了安全，可以检查一下是否是二进制文件，或者直接尝试作为文本读取
  return await readTextFile(file);
};