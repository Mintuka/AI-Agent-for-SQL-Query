import { useState, useEffect } from 'react'
import ChatPage from './components/ChatPage'
import { LoginPage, RegisterPage } from './components/AuthPage'
import { loginOptions } from './utils/component-utils'

export default function App() {
  const [state, setState] = useState('loading')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const username = localStorage.getItem('username') || ''
        const password = localStorage.getItem('password') || ''
        if (username && password) {
          const { status } = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`,
            loginOptions('POST', username, password))
          if (status == 200) {
            setState('home')
            return
          }
        }
        setState('login')
      } catch (err) {
        console.log('auth check error', err)
        setState('login')
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen">
      {state == 'loading' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
          </div>
        </div>
      )}
      {state == 'login' && <LoginPage setState={setState} />}
      {state == 'home' && <ChatPage setState={setState} />}
      {state == 'register' && <RegisterPage setState={setState} />}
    </div>
  )
}
