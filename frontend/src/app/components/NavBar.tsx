'use client'
import React from 'react'

type ChildProps = {
  setState: React.Dispatch<React.SetStateAction<string>>;
};

const NavBar = ({setState}: ChildProps) => {
  const handleLogOut = () => {
    localStorage.clear()
    setState('login')
  }
  return (
    <div className="w-full h-[100px] fixed top-0 bg-blue-500 text-center">
      <div className="relative flex items-center h-full">
      <div className="ml-4 text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">QueryGPT</div>
        <button className="absolute text-white border cursor-pointer py-1 px-2 rounded-md right-4" onClick={handleLogOut}>Log Out</button>
      </div>
    </div>
  )
}

export default NavBar