'use client'
import React from 'react'

type ChildProps = {
  setAddSchema: React.Dispatch<React.SetStateAction<boolean>>;
};

const AddSchema = ({setAddSchema}:ChildProps) => {

  const handleAddSchema = () => {
    setAddSchema(false)
  }

  return (
    <div className="absolute z-5 min-w-screen min-h-screen bg-gray-200 flex items-center justify-center opacity-[0.75]">
      <div className="flex flex-col w-1/2 opacity-[1] bg-white p-4 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <button className="p-2 bg-blue-500 cursor-pointer rounded-full text-white min-w-[100px]" onClick={() => setAddSchema(false)}>save</button>
          <i className="fa-solid fa-xmark cursor-pointer text-lg" onClick={handleAddSchema}></i>
        </div>
        <textarea name="schema" id="realTextarea" placeholder="paste your schema here" className="p-2 border outline-none rounded-xl font-mono"/>
      </div>
    </div>
  )
}

export default AddSchema