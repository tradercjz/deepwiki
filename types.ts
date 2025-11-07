
export interface RAGStatusUpdate {
  type: 'status';
  message: string;
}

export interface RAGSource {
  type: 'source';
  file_path: string;
  content: string;
  score?: number;
  metadata?: {
    start_line: number;
    end_line: number;
  };
}

export interface RAGContentChunk {
  type: 'content';
  chunk: string;
}

export interface RAGError {
  type: 'error';
  detail: string;
}

export interface RAGEnd {
  type: 'end';
  message: string;
}

export type RAGMessage = RAGStatusUpdate | RAGSource | RAGContentChunk | RAGError | RAGEnd;

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  text: string;
}

export interface QAPair {
  id: string;
  question: string;
  answer: string;
  sources: Record<string, RAGSource>;
}

export interface ActiveHighlight {
  filePath: string;
  startLine: number;
  endLine: number;
}
