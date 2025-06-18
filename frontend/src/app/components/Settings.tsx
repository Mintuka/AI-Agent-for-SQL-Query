import React from 'react'

type ChildProps = {
    setSettings: React.Dispatch<React.SetStateAction<boolean>>;
  };

const Settings = ({setSettings}:ChildProps) => {

    const handleSave = () => {
        setSettings(false)
    }

    const handleDelete = () => {
        setSettings(false)
    }

  return (
    <div className="fixed z-5 w-full min-h-screen bg-gray-300 opacity-[0.75] flex items-center justify-center">
        <div className="p-4 bg-white rouned-full w-1/2 flex flex-col rounded-lg opacity-[1]">
            <div className="flex justify-between items-center mb-8">
                <div className="text-lg font-bold">Settings</div>
                <i className="fa-solid fa-xmark cursor-pointer text-lg" onClick={() => setSettings(false)}></i>
            </div>
            <label htmlFor="apikey" className="mb-2 text-sm">OpenAI API KEY</label>
            <input type="text" className="border outline-none mb-8 rounded-md p-2"/>
            <div className="flex justify-between items-center">
                <button className="bg-blue-500 px-6 py-1 rounded-full text-white cursor-pointer hover:bg-blue-700" onClick={handleSave}>save</button>
                <button className="bg-red-500 px-6 py-1 rounded-full text-white cursor-pointer hover:bg-red-700" onClick={handleDelete}>delete</button>
            </div>
        </div>
    </div>
  )
}

export default Settings