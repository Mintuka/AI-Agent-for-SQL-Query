export interface Chat {
    question: string;
    /** @deprecated Legacy plain-text reply; used when sql is absent */
    answer: string;
    /** Executed SQL (single statement) */
    sql?: string;
    /** Short narrative: row count + model explanation (or error text without sql) */
    resultSummary?: string;
    /** Row preview or error detail */
    resultDetails?: string;
  }

export interface ChatHistory {
    session_id: string;
    history: Chat[];
    title: string;
    timestamp: number;
  }
