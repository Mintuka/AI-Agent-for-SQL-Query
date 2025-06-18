'use client'
import {useState} from 'react'
import { loginOptions } from '../utils/component-utils';

type ChildProps = {
    setState: React.Dispatch<React.SetStateAction<string>>;
  };

export const LoginPage = ({setState}: ChildProps) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [authLoading, setAuthLoading] = useState(false)
    const handleLogIn = async() => {
        if (authLoading) return
        try {
          setAuthLoading(true)
          const {status} = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,
            loginOptions('POST', username, password)
          );
    
          if (status == 200) {
              setState('home')
              localStorage.setItem('username', username)
              localStorage.setItem('password', password)
          }
          setAuthLoading(false)
        }catch(error) {
          setAuthLoading(false)
          console.log(error)
        }
    }
    return (
      <div className="flex justify-center items-center min-h-[50vh] relative top-[50px]">
        <div className="flex flex-col items-center justify-center w-1/2 py-12 px-24 rounded-lg shadow-sm">
            <div className="text-5xl font-bold mb-12 text-blue-500">LogIn</div>
            <input type="text" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter email" value={username} onChange={(e) => setUsername(e.target.value)} required/>
            <input type="password" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
            <button className="flex items-center justify-center w-full cursor-pointer mb-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors" onClick={handleLogIn} disabled={authLoading}>
                {authLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>} 
                <span>LogIn</span>
            </button>
            <div className="flex items-center justify-center">
              <span className="text-sm mr-2">Dont have an account?</span> 
              <button className="text-blue-500 cursor-pointer" onClick={() => setState('register')}>Register</button>
            </div>
        </div>
      </div>
    )
  }

export const RegisterPage = ({setState}: ChildProps) => {
      const [username, setUsername] = useState('')
      const [password, setPassword] = useState('')
      const [confirm, setConfirm] = useState('')
      const [authLoading, setAuthLoading] = useState(false)
      const handleLogIn = async() => {
          if (authLoading) return
          try {
            setAuthLoading(true)
            const {status} = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/register`,
              loginOptions('POST', username, password)
            );
      
            if (status == 201) {
              setState('home')
              localStorage.setItem('username', username)
              localStorage.setItem('password', password)
            }
            setAuthLoading(false)
          }catch(error) {
            setAuthLoading(false)
            console.log(error)
          }
      }
      return (
        <div className="flex justify-center items-center min-h-[50vh] relative top-[50px]">
          <div className="flex flex-col items-center justify-center w-1/2 py-12 px-24 rounded-lg shadow-sm">
              <div className="text-5xl font-bold mb-12 text-blue-500">Register</div>
              <input type="text" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700  rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter email" value={username} onChange={(e) => setUsername(e.target.value)} required/>
              <input type="password" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 rounded-lg  focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
              <input type="password" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 rounded-lg  focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required/>
              <button className="flex items-center justify-center w-full cursor-pointer mb-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors" onClick={handleLogIn} disabled={authLoading}>
                  {authLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2">
                    </div>} 
                    <span>Register</span>
              </button>
              <div className="flex items-center justify-center">
                <span className="text-sm mr-2">Already have an account?</span> 
                <button className="cursor-pointer text-blue-500" onClick={() => setState('login')}> Login </button>
              </div>
          </div>
        </div>
      )
    }