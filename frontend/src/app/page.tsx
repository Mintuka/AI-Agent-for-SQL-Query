'use client'
import ChatPage from "./components/ChatPage";
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
        if (username && password){
        const {status} = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,
          loginOptions('POST', username, password));
        if (status == 200 && state != 'home'){
          setState('home')
        }}
      } catch (err) {
        console.log('uee',err)
      }
    };
    fetchData()
  })


  return (
    <div className="min-h-screen">
      {state == 'home' && <ChatPage setState={setState}></ChatPage>}
      {state == 'login' && <LoginPage setState={setState}></LoginPage>}
      {state == 'register' && <RegisterPage setState={setState}></RegisterPage>}
    </div>
  );
}
