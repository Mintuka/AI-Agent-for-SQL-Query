export interface Chat {
    question: string;
    answer: string;
  }
  
export interface ChatHistory {
    session_id: string;
    history: Chat[];
    title: string;
    timestamp: number;
  }