'use client'
import {useState, useEffect, useRef} from 'react'
import {Chat, ChatHistory} from '../types/compoent-types'
import { getFetchOptions } from '../utils/component-utils'

const ChatPage = () => {
    const [question, setQuestion] = useState('');
    const [selectChat, setSelectChat] = useState<ChatHistory>({session_id: "", title: "", timestamp: 0, history: []});
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
        {
          session_id: "1",
          title: "First Tech Support Query",
          timestamp: Date.now() - 3600000, // 1 hour ago
          history: [
            {
              question: "How do I reset my password?",
              answer: "You can reset it by clicking 'Forgot Password' on the login page."
            },
            {
              question: "Where is the forgot password button?",
              answer: "It's below the email field, colored in blue."
            }
          ]
        },
        {
          session_id: "2",
          title: "Product Inquiry",
          timestamp: Date.now() - 86400000, // 1 day ago
          history: [
            {
              question: "What's the difference between Pro and Basic plans?",
              answer: "The Pro plan includes advanced analytics and priority support."
            }
          ]
        }
      ])
    const [loading, setLoading] = useState(false)
    const [hideOption, setHideOption] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout[]>([])

    useEffect(() => {
      document.getElementById(`title-${selectChat?.session_id}`)
      console.log('his', chatHistory)
    },[chatHistory])

    useEffect(() => {
      return () => {
        timerRef.current.forEach(timer => clearTimeout(timer));
        timerRef.current = [];
      };
    }, []);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }, [selectChat]);

    const startNewChat = () => {
        setSelectChat({session_id:'', timestamp:0, title:'', history: []})
      }

    const handleSelectChat = (session: ChatHistory) => {
        setSelectChat({...session})
        if (hideOption != '') {
          setHideOption('')
        }
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
                  answer: `${updatedHistory[lastChatIndex].answer} ${word}`
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

    const handleMenu = (e:React.MouseEvent, session_id:string) => {
      e.preventDefault()
      e.stopPropagation()
      if (hideOption == session_id) {
        setHideOption('')  
      }
      else {
        setHideOption(session_id)
      }
    }

    return (
        <div className="w-full fixed top-[100px]">
            <div className="flex">
                {/* Chat History */}
                <div className="relative flex flex-col w-1/4 h-[calc(100vh_-_100px)] overflow-y-scroll scrollbar-history ">
                    <div className="font-bold sticky top-0 bg-gray-100 dark:bg-gray-800 rounded-md mx-1 p-1">Q&A History</div>
                    <div className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-2 py-2 rounded-lg transition-colors flex items-center mx-1 mb-2 w-fit cursor-pointer" onClick={startNewChat}>New Chat</div>
                    {
                        chatHistory.length > 0
                        ?
                        chatHistory.map((session, index) => 
                        <div id={`title-${selectChat?.session_id}`} key={`session-${index}`} className={`flex items-center relative m-1 p-1 hover:cursor-pointer  ${selectChat?.session_id == session.session_id ? 'text-gray-100 rounded-md bg-gray-700' : 'text-gray-500 hover:bg-gray-100' }`} onClick={() => handleSelectChat(session)}>
                            <span>{session.title}</span> <span className="absolute right-4 z-1" onClick={(e) => handleMenu(e, session.session_id)}>...</span>
                            {
                            hideOption == session.session_id
                            ?
                            <div className="flex items-center shadow-md absolute top-6 right-4 z-50 flex py-2 px-4 bg-white rounded-md" onClick={(e) => handleDelete(e, selectChat?.session_id)}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-red-500">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                              <span className="ml-1 text-red-500">Delete</span>
                            </div>
                            :
                            <div></div>
                            }
                        </div>
                        )
                        :
                        <div className="text-gray-500 mx-1 p-1">No history</div>
                    }
                </div>
                <div className="w-3/4 h-[calc(100vh_-_100px)] fixed right-0 bottom-0 ml-4">
                    {/* Chat Messages */}
                    {selectChat?.history && (
                        <div className="mb-4 max-h-[350px] overflow-y-scroll scrollbar-hide">
                        {
                            selectChat?.history
                            .map((chat,index) => 
                            <div key={index}>
                                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                                  <p className="text-gray-700 dark:text-gray-400">{chat.question}</p>
                                </div>
                                <p className="text-gray-700 text-justify dark:text-gray-300 mb-4">{chat.answer}</p>
                            </div>
                            )
                        }
                        <div ref={messagesEndRef} />
                        </div>
                    )}
                    
                    {/* Question Input*/}
                    <form onSubmit={handleAskQuestion} className="w-full space-y-4 absolute right-1 bottom-1">
                        <div className="relative flex gap-2">
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask a question about the content..."
                                className="flex-1 pl-4 pr-9 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] max-h-[200px] resize-y overflow-auto scrollbar-custom"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 bottom-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-2 py-2 rounded-lg transition-colors flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                </>
                                ) : (
                                <>
                                    {/* <ArrowUpIcon strokeWidth={2} className="h-5 w-5" /> */}Go
                                </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ChatPage