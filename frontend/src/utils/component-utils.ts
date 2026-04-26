export const getFetchOptions = (method: string, question: string, session_id: string) => ({
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
    },
    body: JSON.stringify({
      question,
      session_id,
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

export const settingsLoadOptions = () => ({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
    },
    body: JSON.stringify({}),
    mode: 'cors' as RequestMode,
});

export const settingsOptions = (method: string, apikey: string, dbApiKey: string) => ({
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
    },
    body: JSON.stringify({
      apikey,
      db_api_key: dbApiKey,
    }),
    mode: 'cors' as RequestMode,
});
