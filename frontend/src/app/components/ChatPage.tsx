'use client'
import {useState, useEffect, useRef} from 'react'
import {Chat, ChatHistory} from '../types/compoent-types'
import { getFetchOptions } from '../utils/component-utils'
import Image from 'next/image';
import AddSchema from './AddSchema';
import Settings from './Settings';

type ChildProps = {
  setState: React.Dispatch<React.SetStateAction<string>>;
};

const ChatPage = ({setState}:ChildProps) => {
    const [question, setQuestion] = useState('');
    const [selectChat, setSelectChat] = useState<ChatHistory>({session_id: "", title: "", timestamp: 0, history: []});
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [loading, setLoading] = useState(false)
    const [isAddSchema, setAddSchema] = useState<boolean>(false)
    const [isSetting, setSettings] = useState<boolean>(false)
    const [isLiked, setLike] = useState<boolean>(false)
    const [isDisliked, setDislike] = useState<boolean>(false)
    const [isCopied, setCopy] = useState<boolean>(false)
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout[]>([])

    useEffect(() => {
      document.getElementById(`title-${selectChat?.session_id}`)
      console.log('his', chatHistory)
    },[chatHistory])

    // useEffect(() => {
    //   return () => {
    //     timerRef.current.forEach(timer => clearTimeout(timer));
    //     timerRef.current = [];
    //   };
    // }, [selectChat]);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }, [selectChat]);

    const addSchema = () => {
      setAddSchema(true)
    }

    const startNewChat = () => {
        setSelectChat({session_id:'', timestamp:0, title:'', history: []})
      }

    const handleSelectChat = (session: ChatHistory) => {
        setSelectChat({...session})
      }

    const handleResponseGeneration = (answer: string) => {
        const responseWords = answer.split(' ')
        responseWords.forEach((word, index) => {
          const timer = setTimeout(() => {
            setSelectChat((prevChat:ChatHistory) => {
              const lastChatIndex = prevChat.history.length - 1;
          
              const updatedHistory = [...prevChat.history];
              
              if (index === 0) {
                updatedHistory[lastChatIndex] = {
                  ...updatedHistory[lastChatIndex],
                  answer: word
                };
              } else {
                updatedHistory[lastChatIndex] = {
                  ...updatedHistory[lastChatIndex],
                  answer: `${updatedHistory[lastChatIndex]?.answer} ${word}`
                };
              }
              return {
                ...prevChat,
                history: updatedHistory
              }
            });
          }, 100 * index)
          timerRef.current.push(timer)
        });
      }

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;
    
        setLoading(true);
    
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/generate`,
            getFetchOptions('POST', question, selectChat?.session_id)
          );
    
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error getting answer');
          }
          
          const { answer, session_id } = await response.json();
    
          const timestamp = Date.now()
          let newTitle = ''
          if(question.length > 12) {
            newTitle = `${question.substring(0,12)}`
          }
          else {
            newTitle = `${question}`
          } 
          const parts = answer.split(/[a-zA-Z]:/).slice(1);
          const finalAnswer = parts.join(' ').trim()
          let newSessions:ChatHistory[] = [...chatHistory]
          let currentSession:ChatHistory = {session_id:'', timestamp:0, title:'', history: []}
          if (selectChat?.session_id) {
            newSessions = newSessions.map(session => {
              if (session.session_id == session_id) {
                currentSession = {...session, history: [...session.history, {question: question.trim(), answer: finalAnswer}]}
                return currentSession
              }
              return {...session}
            })
          } else {
            currentSession = {session_id, timestamp, title: newTitle, history: [{question: question.trim(), answer: finalAnswer}]}
            newSessions = [...newSessions, currentSession]
          }
          newSessions.sort((a,b) => b.timestamp - a.timestamp)
          setChatHistory(() => newSessions)
          const oldHistory:Chat[] = currentSession.history.map((chat:Chat, index:number) => {
            const lastIndex = currentSession.history.length - 1
            if (lastIndex == index) {
              return {...chat, answer: ''}
            }
            return chat
          })
          currentSession = {...currentSession, history: oldHistory}
          setSelectChat(() => currentSession)
          handleResponseGeneration(finalAnswer)
        } catch (error) {
          console.log(error)
        } finally {
          setLoading(false);
        }
      };

    const handleDelete = (e:React.MouseEvent, session_id:string) => {
      e.preventDefault()
      e.stopPropagation()
        setChatHistory((chatHistory:ChatHistory[]) => {
          const newChatHistory = chatHistory.filter((chat:ChatHistory) => chat.session_id != session_id)
          return newChatHistory
        })
      }

    const handleLogOut = () => {
      setState('login')
      localStorage.removeItem('username')
      localStorage.removeItem('password')
    }  

    const handleLike = () => {
      setLike(!isLiked)
      setDislike(false)
    }

    const handleDislike = () => {
      setDislike(!isDisliked)
      setLike(false)
    }

    const CopyToClipboard = (text: string): Promise<void> => {
      setCopy(true)
      setTimeout(() => {
        setCopy(false)
      },2000)
      return navigator.clipboard.writeText(text)
        .then(() => {
          console.log('Text copied to clipboard');
        })
        .catch((err: Error) => {
          console.error('Failed to copy text: ', err);
        });
    }

    return (
        <div className="w-full fixed">
            {isAddSchema && <AddSchema setAddSchema={setAddSchema}></AddSchema>}
            {isSetting && <Settings setSettings={setSettings} ></Settings>}
            <div className="flex">
                {/* Chat History */}
                <div className="fixed left-72 top-4 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors mx-1 mb-2 cursor-pointer" onClick={addSchema}>
                  <i className="fa-solid fa-plus mx-2"></i>
                  <span className="text-sm">Add Schema</span>
                </div>
                <div className="relative flex flex-col w-1/5 rounded-[20px] m-4 p-4 bg-white h-[calc(100vh_-_2rem)] overflow-y-scroll scrollbar-hide">
                    <div className="font-bold text-lg sticky top-0 mx-1 mb-8 p-1">GenSQL</div>
                    <div className="flex items-center justify-center w-4/5 bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded-full transition-colors mx-1 mb-2 cursor-pointer" onClick={startNewChat}>
                      <i className="fa-solid fa-plus mx-2"></i>
                      <span className="text-sm">New Chat</span>
                    </div>
                    <div className="flex justify-between text-[0.75rem] py-2 my-2 border-t-1 border-b-1 border-gray-300">
                      <div>Your Conversations</div>
                      <div className="text-blue-700 cursor-pointer">Clear All</div>
                    </div>
                    {
                        chatHistory.length > 0
                        ?
                        chatHistory.map((session, index) => 
                        <div id={`title-${selectChat?.session_id}`} key={`session-${index}`} className={`flex items-center justify-between relative hover:cursor-pointer text-sm my-1 py-1 px-2  ${selectChat?.session_id == session.session_id ? 'rounded-md bg-[#f2f5fa]' : 'hover:bg-gray-100' }`} onClick={() => handleSelectChat(session)}>
                            <div className="flex items-center justify-center">
                              <i className={`fa-regular fa-comment-dots mr-2 ${selectChat?.session_id == session.session_id ? 'text-blue-500' : ''}`}></i>
                              <span className={`${selectChat?.session_id == session.session_id ? 'text-blue-500' : ''}`}>{session.title}</span> 
                            </div>
                            {
                              selectChat?.session_id == session.session_id ?

                              <div className="flex items-center flex py-2 px-4" onClick={(e) => handleDelete(e, selectChat?.session_id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-red-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </div>
                              :
                              <div></div>
                            }
                        </div>
                        )
                        :
                        <div className="text-gray-500 mx-1 p-1">No history</div>
                    }
                    <div className="absolute bottom-0 text-sm w-4/5">
                      <div className="flex items-center shadow-sm w-full px-4 p-2 rounded-full my-1 cursor-pointer" onClick={() => setSettings(true)}>
                        <div className="w-[30px] h-[30px] flex items-center justify-center rounded-full bg-gray-200 mr-2">
                          <i className="fa-solid fa-gear text-md"></i>
                        </div>
                        <span>Settings</span>
                      </div>
                      <div className="flex items-center shadow-sm w-full px-4 p-2 rounded-full my-1 cursor-pointer" onClick={handleLogOut}>
                        <div className="w-[30px] h-[30px] flex items-center justify-center rounded-full bg-gray-200 mr-2">
                          <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        </div>
                        <span>Log Out</span>
                      </div>
                      <div className="flex items-center shadow-sm w-full px-4 p-2 rounded-full my-1 cursor-pointer">
                        <Image className="rounded-full mr-2" width={30} height={30} src="/man.png" alt="user"/>
                        <span>Minte Kassa</span>
                      </div>
                    </div>
                </div>
                <div className="w-3/5 h-[calc(100vh_-_2rem)] fixed right-0 bottom-0 m-4 px-4">
                    {/* Chat Messages */}
                    {selectChat?.history && (
                        <div className="mb-4 max-h-[400px] overflow-y-scroll scrollbar-hide">
                        {
                            selectChat?.history
                            .map((chat,index) => 
                            <div className="mb-8" key={index}>
                                <div className="relative flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-lg mb-2">
                                  <Image src="/man.png" className="mr-2" width={30} height={30} alt="user"/> 
                                  <p className="text-gray-700 text-sm dark:text-gray-400">{chat.question}</p>
                                  <i className="absolute right-1 top-1 fa-regular fa-pen-to-square text-sm text-gray-500 cursor-pointer"></i>
                                </div>
                                <div className="ml-4">
                                  <div className="text-blue-500 flex items-center mb-2">
                                    <span className="mr-2 text-sm">GenSQL</span>
                                    <Image src="/chatbot.png" width={20} height={20} alt="chatbot"/>
                                  </div>
                                  <p className="text-gray-700 text-justify text-sm dark:text-gray-300 mb-4">{chat.answer}</p>
                                </div>
                                <div className="flex items-center justify-between text-sm ml-4">
                                  <div className="relative flex p-2 rounded-full bg-white flex items-center justify-center">
                                    <i className={`fa-regular fa-thumbs-up ${isLiked ? 'text-blue-500' : 'text-gray-400'} cursor-pointer px-2 border-r-1 border-gray-300`} onClick={handleLike}></i>
                                    <i className={`fa-regular fa-thumbs-down ${isDisliked ? 'text-blue-500' : 'text-gray-400'} cursor-pointer px-2 border-r-1 border-gray-300`} onClick={handleDislike}></i>
                                    <i className={`fa-regular fa-copy ${isCopied ? 'text-blue-500' : 'text-gray-400'} cursor-pointer mx-2`} onClick={() => CopyToClipboard(chat.answer)}></i>
                                    {isCopied && <div className="absolute p-1 px-2 bg-white rounded-full text-blue-500 -right-18">Copied!</div>}
                                  </div>
                                  <div className="flex items-center p-2 bg-white rounded-full cursor-pointer text-sm hover:outline">
                                    <i className="fa-solid fa-rotate text-gray-500 mr-2"></i>
                                    <div className="text-sm text-gray-700">Regenerate</div>
                                  </div>
                                </div>
                            </div>
                            )
                        }
                        <div ref={messagesEndRef} />
                        </div>
                    )}
                    
                    {/* Question Input*/}
                    <form onSubmit={handleAskQuestion} className="w-3/4 space-y-4 absolute bottom-3">
                        <div className="relative flex gap-2">
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Write what you want fetch from the database..."
                                className="flex-1 border pl-4 pr-9 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg outline-none min-h-[100px] max-h-[200px] resize-y overflow-auto scrollbar-hide"
                            />
                            <div className="absolute right-3 bottom-3 flex items-center justify-center gap-2">
                              <button
                                  className="cursor-pointer hover:bg-gray-200 text-white font-semibold px-2 py-2 rounded-full transition-colors flex items-center justify-center gap-2"
                                  disabled={loading}
                              >
                                  {false ? (
                                  <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  </>
                                  ) : (
                                  <>
                                      <Image src="/smile.png" alt="emoji" width={20} height={20}/>
                                  </>
                                  )}
                              </button>
                              <button
                                  className={`cursor-pointer hover:bg-gray-200 text-white font-semibold px-2 py-2 rounded-full transition-colors flex items-center justify-center gap-2`}
                                  disabled={loading}
                              >
                                  {false ? (
                                  <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  </>
                                  ) : (
                                  <>
                                      <Image src="/attach.png" alt="file" width={20} height={20} />
                                  </>
                                  )}
                              </button>
                              <button
                                  type="submit"
                                  className={`cursor-pointer text-white font-semibold px-2 py-2 rounded-full transition-colors flex items-center justify-center gap-2 ${loading ? 'bg-gray-700' : 'hover:bg-gray-200'}`}
                                  disabled={loading}
                              >
                                  {loading ? (
                                  <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  </>
                                  ) : (
                                  <>
                                      <Image src="/send.png" alt="send" width={20} height={20} />
                                  </>
                                  )}
                              </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ChatPage