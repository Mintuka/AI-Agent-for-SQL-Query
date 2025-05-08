'use client'
import ChatPage from "./components/ChatPage";
import NavBar from "./components/NavBar";
import {useState, useEffect} from 'react'
import { loginOptions } from "./utils/component-utils";
import { LoginPage, RegisterPage } from "./components/AuthPage";

export default function Home() {
  const [state, setState] = useState('login')
  useEffect(() => {
    const fetchData = async () => {
      try {
        const username = localStorage.getItem('username') || ''
        const password = localStorage.getItem('password') || ''
        const {status} = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,
        // const {status} = await fetch(`http://34.123.108.230:8080/login`, 
        // const {status} = await fetch(`http://localhost:8080/login`,
          loginOptions('POST', username, password)
        );
        if (status == 200 && state != 'home'){
          setState('home')
        }
      } catch (err) {
        console.log('uee',err)
      }
    };
    fetchData()
  })


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)]">
      {state == 'home' && <NavBar setState={setState}></NavBar>}
      {state == 'home' && <ChatPage></ChatPage>}
      {state == 'login' && <LoginPage setState={setState}></LoginPage>}
      {state == 'register' && <RegisterPage setState={setState}></RegisterPage>}
    </div>
  );
}
