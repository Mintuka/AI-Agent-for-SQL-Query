export const getFetchOptions = (method: string, question: string, session_id: string) => ({
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      session_id,
      email: localStorage.getItem('username') ?? '',
      password: localStorage.getItem('password') ?? '',
    }),
    mode: 'cors' as RequestMode,
    credentials: 'include' as RequestCredentials
});

export const loginOptions = (method: string, email: string, password: string) => ({
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
    mode: 'cors' as RequestMode,
});

export const settingsLoadOptions = (email: string, password: string) => ({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
    mode: 'cors' as RequestMode,
});

export const settingsOptions = (method: string, apikey: string, dbApiKey: string, email: string, password: string) => ({
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apikey,
      db_api_key: dbApiKey,
      email,
      password,
    }),
    mode: 'cors' as RequestMode,
});
