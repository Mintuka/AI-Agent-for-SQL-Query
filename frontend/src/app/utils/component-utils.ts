export const getFetchOptions = (method: string, question: string, session_id: string) => ({
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        session_id,
      }),
      mode: 'cors' as RequestMode,
      credentials: 'include' as RequestCredentials
  });