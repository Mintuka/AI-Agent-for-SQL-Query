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
          // const {status} = await fetch(`http://34.123.108.230:8080/login`,
          // const {status} = await fetch(`http://localhost:8080/login`, 
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
      <div className="flex justify-center items-center min-h-[50vh] relative top-[250px]">
        <div className="flex flex-col items-center justify-center w-full py-12 px-24 border border-1 border-gray-500 rounded-lg shadow-md">
            <div className="text-5xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">LogIn</div>
            <input type="text" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter email" value={username} onChange={(e) => setUsername(e.target.value)} required/>
            <input type="password" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
            <button className="w-full cursor-pointer mb-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors" onClick={handleLogIn} disabled={authLoading}>
                {authLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>} LogIn
            </button>
            <div className="flex">
              Dont have an account? <button className="text-blue-500 cursor-pointer" onClick={() => setState('register')}> ` Register`</button>
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
              // const {status} = await fetch(`http://34.123.108.230:8080/register`,
            // const {status} = await fetch(`http://localhost:8080/register`,
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
        <div className="flex justify-center items-center min-h-[50vh] relative top-[250px]">
          <div className="flex flex-col items-center justify-center w-full py-12 px-24 border border-1 border-gray-500 rounded-lg shadow-md">
              <div className="text-5xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">Register</div>
              <input type="text" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter email" value={username} onChange={(e) => setUsername(e.target.value)} required/>
              <input type="password" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
              <input type="password" className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required/>
              <button className="w-full cursor-pointer mb-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors" onClick={handleLogIn} disabled={authLoading}>
                  {authLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>} Register
              </button>
              <div className="flex">
                Already have an account? <button className="cursor-pointer text-blue-500" onClick={() => setState('login')}> ` Login here`</button>
              </div>
          </div>
        </div>
      )
    }