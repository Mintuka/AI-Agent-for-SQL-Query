import { useState, useEffect } from 'react'
import { settingsLoadOptions, settingsOptions } from '../utils/component-utils'

type ChildProps = {
  setSettings: React.Dispatch<React.SetStateAction<boolean>>;
};

const Settings = ({ setSettings }: ChildProps) => {
  const [apikey, setApikey] = useState('')
  const [dbApiKey, setDbApiKey] = useState('')

  useEffect(() => {
    const load = async () => {
      const email = localStorage.getItem('username') ?? ''
      const password = localStorage.getItem('password') ?? ''
      if (!email || !password) return
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/settings/load`,
          settingsLoadOptions(email, password)
        )
        if (!res.ok) return
        const data = await res.json() as { gemini_api_key?: string; db_api_key?: string }
        setApikey(data.gemini_api_key ?? '')
        setDbApiKey(data.db_api_key ?? '')
      } catch {
        /* ignore */
      }
    }
    void load()
  }, [])

  const handleSave = async () => {
    const email = localStorage.getItem('username') ?? ''
    const password = localStorage.getItem('password') ?? ''
    const { status } = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings`,
      settingsOptions('POST', apikey, dbApiKey, email, password)
    );
    if (status == 200) {
      setSettings(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Settings</div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: 'var(--color-text-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => setSettings(false)}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        <label htmlFor="apikey" className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Gemini API Key</label>
        <input
          type="password"
          id="apikey"
          className="w-full border outline-none mb-4 rounded-lg p-2.5 text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-input)' }}
          placeholder="Enter your API key"
          value={apikey}
          onChange={(e) => setApikey(e.target.value)}
        />
        <label htmlFor="dbapikey" className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>DB API Key</label>
        <input
          type="password"
          id="dbapikey"
          className="w-full border outline-none mb-6 rounded-lg p-2.5 text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-input)' }}
          placeholder="Enter your database API key"
          value={dbApiKey}
          onChange={(e) => setDbApiKey(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => setSettings(false)}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
