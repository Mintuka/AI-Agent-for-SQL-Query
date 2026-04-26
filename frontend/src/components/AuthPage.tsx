import { useState } from 'react'
import { loginOptions } from '../utils/component-utils'

type ChildProps = {
  setState: React.Dispatch<React.SetStateAction<string>>;
};

export const LoginPage = ({ setState }: ChildProps) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const handleLogIn = async () => {
    if (authLoading) return
    try {
      setAuthLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`,
        loginOptions('POST', username, password)
      );

      if (response.status == 200) {
        const data = await response.json() as { token?: string; email?: string }
        if (!data.token || !data.email) {
          throw new Error('Missing auth token in login response')
        }
        setState('home')
        localStorage.setItem('username', data.email)
        localStorage.setItem('auth_token', data.token)
      }
      setAuthLoading(false)
    } catch (error) {
      setAuthLoading(false)
      console.log(error)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col items-center justify-center w-full max-w-md py-10 px-8 rounded-2xl" style={{ background: 'var(--color-bg-card)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
        <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>GenSQL</div>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>Sign in to your account</p>
        <input
          type="text"
          className="w-full px-4 py-2.5 mb-3 rounded-lg border outline-none text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-input)' }}
          placeholder="Enter email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full px-4 py-2.5 mb-4 rounded-lg border outline-none text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-input)' }}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="flex items-center justify-center w-full cursor-pointer mb-4 font-medium px-6 py-2.5 rounded-lg text-sm"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
          onClick={handleLogIn}
          disabled={authLoading}
        >
          {authLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>}
          <span>Sign In</span>
        </button>
        <div className="flex items-center justify-center text-sm">
          <span className="mr-1" style={{ color: 'var(--color-text-muted)' }}>Don't have an account?</span>
          <button className="cursor-pointer font-medium" style={{ color: 'var(--color-primary)' }} onClick={() => setState('register')}>Register</button>
        </div>
      </div>
    </div>
  )
}

export const RegisterPage = ({ setState }: ChildProps) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const handleRegister = async () => {
    if (authLoading) return
    try {
      setAuthLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/register`,
        loginOptions('POST', username, password)
      );

      if (response.status == 201) {
        const data = await response.json() as { token?: string; email?: string }
        if (!data.token || !data.email) {
          throw new Error('Missing auth token in register response')
        }
        setState('home')
        localStorage.setItem('username', data.email)
        localStorage.setItem('auth_token', data.token)
      }
      setAuthLoading(false)
    } catch (error) {
      setAuthLoading(false)
      console.log(error)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col items-center justify-center w-full max-w-md py-10 px-8 rounded-2xl" style={{ background: 'var(--color-bg-card)', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}>
        <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>GenSQL</div>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>Create your account</p>
        <input
          type="text"
          className="w-full px-4 py-2.5 mb-3 rounded-lg border outline-none text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-input)' }}
          placeholder="Enter email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full px-4 py-2.5 mb-3 rounded-lg border outline-none text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-input)' }}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full px-4 py-2.5 mb-4 rounded-lg border outline-none text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-input)' }}
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button
          className="flex items-center justify-center w-full cursor-pointer mb-4 font-medium px-6 py-2.5 rounded-lg text-sm"
          style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
          onClick={handleRegister}
          disabled={authLoading}
        >
          {authLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>}
          <span>Register</span>
        </button>
        <div className="flex items-center justify-center text-sm">
          <span className="mr-1" style={{ color: 'var(--color-text-muted)' }}>Already have an account?</span>
          <button className="cursor-pointer font-medium" style={{ color: 'var(--color-primary)' }} onClick={() => setState('login')}>Sign In</button>
        </div>
      </div>
    </div>
  )
}
