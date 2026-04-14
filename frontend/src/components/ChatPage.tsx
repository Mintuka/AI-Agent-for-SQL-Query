import { useState, useEffect, useRef } from 'react'
import { Chat, ChatHistory } from '../types/component-types'
import { getFetchOptions } from '../utils/component-utils'
import AddSchema from './AddSchema'
import Settings from './Settings'

type ChildProps = {
  setState: React.Dispatch<React.SetStateAction<string>>;
};

const ChatPage = ({ setState }: ChildProps) => {
    const [question, setQuestion] = useState('');
    const [selectChat, setSelectChat] = useState<ChatHistory>({ session_id: "", title: "", timestamp: 0, history: [] });
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [loading, setLoading] = useState(false)
    const [isAddSchema, setAddSchema] = useState<boolean>(false)
    const [isSetting, setSettings] = useState<boolean>(false)
    const [isLiked, setLike] = useState<boolean>(false)
    const [isDisliked, setDislike] = useState<boolean>(false)
    const [isCopied, setCopy] = useState<boolean>(false)
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      console.log('his', chatHistory)
    }, [chatHistory, selectChat?.session_id])

    const formatResults = (results: any) => {
      if (!results) return ''
      if (results.error) return ''
      if (!Array.isArray(results.rows)) return ''
      const columns: string[] = results.columns || []
      const rows: any[] = results.rows
      if (rows.length === 0) return 'No rows returned.'

      const previewRows = rows.slice(0, 10)
      return previewRows
        .map((row, idx) => {
          const parts = columns.map((c) => `${c}: ${row?.[c]}`)
          return `${idx + 1}. ${parts.join(', ')}`
        })
        .join('\n')
    }

    const buildResultSummary = (explanation: string, results: any) => {
      if (results?.error) {
        return `Execution failed: ${results.error}`
      }
      const n = Array.isArray(results?.rows) ? results.rows.length : 0
      const countLine = `There are ${n} row${n === 1 ? '' : 's'} returned.`
      const exp = (explanation || '').trim()
      return exp ? `${countLine}\n\n${exp}` : countLine
    }

    const chatCopyText = (chat: Chat) => {
      if (chat.sql || chat.resultSummary) {
        const parts: string[] = []
        if (chat.sql) parts.push(`Query\n${chat.sql.trim()}`)
        if (chat.resultSummary) parts.push(`Result\n${chat.resultSummary}`)
        if (chat.resultDetails) parts.push(chat.resultDetails)
        return parts.join('\n\n')
      }
      return chat.answer
    }

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }, [selectChat]);

    const addSchema = () => {
      setAddSchema(true)
    }

    const startNewChat = () => {
      setSelectChat({ session_id: '', timestamp: 0, title: '', history: [] })
    }

    const handleSelectChat = (session: ChatHistory) => {
      setSelectChat({ ...session })
    }

    const handleAskQuestion = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!question.trim()) return;

      setLoading(true);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/generate`,
          getFetchOptions('POST', question, selectChat?.session_id)
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error getting answer');
        }

        const { explanation, sql, results, session_id } = await response.json();

        const sqlClean = (sql || '').trim().replace(/;+\s*$/g, '')
        const resultDetails = formatResults(results)
        const resultSummary = buildResultSummary(explanation, results)
        const newChat: Chat = {
          question: question.trim(),
          answer: '',
          sql: sqlClean || undefined,
          resultSummary,
          resultDetails: resultDetails || undefined,
        }

        const timestamp = Date.now()
        let newTitle = ''
        if (question.length > 12) {
          newTitle = `${question.substring(0, 12)}`
        } else {
          newTitle = `${question}`
        }
        let newSessions: ChatHistory[] = [...chatHistory]
        let currentSession: ChatHistory = { session_id: '', timestamp: 0, title: '', history: [] }
        if (selectChat?.session_id) {
          newSessions = newSessions.map(session => {
            if (session.session_id == session_id) {
              currentSession = { ...session, history: [...session.history, newChat] }
              return currentSession
            }
            return { ...session }
          })
        } else {
          currentSession = { session_id, timestamp, title: newTitle, history: [newChat] }
          newSessions = [...newSessions, currentSession]
        }
        newSessions.sort((a, b) => b.timestamp - a.timestamp)
        setChatHistory(() => newSessions)
        setSelectChat(() => currentSession)
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false);
      }
    };

    const handleDelete = (e: React.MouseEvent, session_id: string) => {
      e.preventDefault()
      e.stopPropagation()
      setChatHistory((chatHistory: ChatHistory[]) => {
        return chatHistory.filter((chat: ChatHistory) => chat.session_id != session_id)
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
      }, 2000)
      return navigator.clipboard.writeText(text)
        .then(() => {
          console.log('Text copied to clipboard');
        })
        .catch((err: Error) => {
          console.error('Failed to copy text: ', err);
        });
    }

    return (
      <div className="w-full h-screen flex">
        {isAddSchema && <AddSchema setAddSchema={setAddSchema} />}
        {isSetting && <Settings setSettings={setSettings} />}
        <div className="flex w-full">
          {/* Sidebar */}
          <div className="relative flex flex-col w-[280px] min-w-[280px] rounded-2xl m-3 p-4 h-[calc(100vh_-_1.5rem)] overflow-y-auto scrollbar-hide" style={{ background: 'var(--color-bg-sidebar)' }}>
            <div className="font-bold text-lg mb-6 px-1" style={{ color: 'var(--color-primary)' }}>GenSQL</div>

            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
                onClick={startNewChat}
              >
                <i className="fa-solid fa-plus"></i>
                <span>New Chat</span>
              </button>
              <button
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium cursor-pointer border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={addSchema}
              >
                <i className="fa-solid fa-database"></i>
              </button>
            </div>

            <div className="flex justify-between text-xs py-2 my-2 border-t border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              <span>Your Conversations</span>
              <span className="cursor-pointer font-medium" style={{ color: 'var(--color-text-link)' }}>Clear All</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {
                chatHistory.length > 0
                  ?
                  chatHistory.map((session, index) =>
                    <div
                      id={`title-${selectChat?.session_id}`}
                      key={`session-${index}`}
                      className="flex items-center justify-between rounded-lg text-sm my-0.5 py-2 px-3 cursor-pointer"
                      style={{
                        background: selectChat?.session_id == session.session_id ? 'var(--color-bg-active)' : 'transparent',
                        color: selectChat?.session_id == session.session_id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={e => { if (selectChat?.session_id !== session.session_id) e.currentTarget.style.background = 'var(--color-bg-hover)' }}
                      onMouseLeave={e => { if (selectChat?.session_id !== session.session_id) e.currentTarget.style.background = 'transparent' }}
                      onClick={() => handleSelectChat(session)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <i className="fa-regular fa-comment-dots text-xs"></i>
                        <span className="truncate">{session.title}</span>
                      </div>
                      {
                        selectChat?.session_id == session.session_id &&
                        <div className="flex items-center p-1 rounded-md cursor-pointer" style={{ color: 'var(--color-danger)' }} onClick={(e) => handleDelete(e, selectChat?.session_id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </div>
                      }
                    </div>
                  )
                  :
                  <div className="text-sm px-1 py-4" style={{ color: 'var(--color-text-muted)' }}>No conversations yet</div>
              }
            </div>

            <div className="mt-auto pt-3 border-t text-sm space-y-1" style={{ borderColor: 'var(--color-border)' }}>
              <button className="flex items-center w-full px-3 py-2 rounded-lg cursor-pointer" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => setSettings(true)}>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg mr-3" style={{ background: 'var(--color-bg-hover)' }}>
                  <i className="fa-solid fa-gear text-sm"></i>
                </div>
                <span>Settings</span>
              </button>
              <button className="flex items-center w-full px-3 py-2 rounded-lg cursor-pointer" style={{ color: 'var(--color-danger)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={handleLogOut}>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg mr-3" style={{ background: 'var(--color-bg-hover)' }}>
                  <i className="fa-solid fa-arrow-right-from-bracket text-sm"></i>
                </div>
                <span>Log Out</span>
              </button>
              <div className="flex items-center px-3 py-2 rounded-lg" style={{ color: 'var(--color-text-primary)' }}>
                <img className="rounded-full mr-3 w-8 h-8" src="/man.png" alt="user" />
                <span className="font-medium">Minte Kassa</span>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col h-[calc(100vh_-_1.5rem)] m-3 ml-0">
            {/* Chat Messages */}
            {selectChat?.history && selectChat.history.length > 0 ? (
              <div className="flex-1 overflow-y-auto scrollbar-hide px-8 py-4">
                {
                  selectChat?.history
                    .map((chat, index) =>
                      <div className="mb-6 max-w-3xl mx-auto" key={index}>
                        {/* User message */}
                        <div className="flex items-start gap-3 rounded-xl p-3 mb-3" style={{ background: 'var(--color-bg-user-msg)' }}>
                          <img src="/man.png" className="rounded-full mt-0.5 w-7 h-7" alt="user" />
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{chat.question}</p>
                        </div>
                        {/* Bot response */}
                        <div className="ml-2 p-3 rounded-xl" style={{ background: 'var(--color-bg-bot-msg)' }}>
                          <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-primary)' }}>
                            <img src="/chatbot.png" className="w-5 h-5" alt="chatbot" />
                            <span className="text-sm font-medium">GenSQL</span>
                          </div>
                          {chat.sql || chat.resultSummary ? (
                            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                              {chat.sql ? (
                                <div>
                                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-primary)' }}>Query</div>
                                  <pre
                                    className="p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words font-mono border"
                                    style={{
                                      background: 'var(--color-bg-input)',
                                      borderColor: 'var(--color-border)',
                                      color: 'var(--color-text-primary)',
                                    }}
                                  >
                                    {chat.sql}
                                  </pre>
                                </div>
                              ) : null}
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-primary)' }}>Result</div>
                                <p className="whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>{chat.resultSummary}</p>
                                {chat.resultDetails ? (
                                  <pre
                                    className="mt-3 p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-words font-mono border"
                                    style={{
                                      background: 'var(--color-bg-input)',
                                      borderColor: 'var(--color-border)',
                                      color: 'var(--color-text-muted)',
                                    }}
                                  >
                                    {chat.resultDetails}
                                  </pre>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed text-justify" style={{ color: 'var(--color-text-secondary)' }}>{chat.answer}</p>
                          )}
                        </div>
                        {/* Action bar */}
                        <div className="flex items-center justify-between text-sm ml-2 mt-2">
                          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--color-bg-action-bar)' }}>
                            <button className="p-1.5 rounded-md cursor-pointer" style={{ color: isLiked ? 'var(--color-primary)' : 'var(--color-text-muted)' }} onClick={handleLike}>
                              <i className="fa-regular fa-thumbs-up"></i>
                            </button>
                            <div className="w-px h-4" style={{ background: 'var(--color-border)' }}></div>
                            <button className="p-1.5 rounded-md cursor-pointer" style={{ color: isDisliked ? 'var(--color-primary)' : 'var(--color-text-muted)' }} onClick={handleDislike}>
                              <i className="fa-regular fa-thumbs-down"></i>
                            </button>
                            <div className="w-px h-4" style={{ background: 'var(--color-border)' }}></div>
                            <button className="relative p-1.5 rounded-md cursor-pointer" style={{ color: isCopied ? 'var(--color-primary)' : 'var(--color-text-muted)' }} onClick={() => CopyToClipboard(chatCopyText(chat))}>
                              <i className="fa-regular fa-copy"></i>
                              {isCopied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-md whitespace-nowrap" style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary)' }}>Copied!</span>}
                            </button>
                          </div>
                          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <i className="fa-solid fa-rotate text-xs"></i>
                            <span className="text-xs">Regenerate</span>
                          </button>
                        </div>
                      </div>
                    )
                }
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-center mb-8">
                  <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>GenSQL</div>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Ask me to generate SQL queries from natural language</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-lg">
                  {['Show all users created this month', 'Find orders with total > $100', 'Count products by category', 'Join users with their orders'].map((suggestion, i) => (
                    <button
                      key={i}
                      className="text-left text-sm p-3 rounded-xl border cursor-pointer"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => setQuestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Input */}
            <form onSubmit={handleAskQuestion} className="px-8 pb-4 pt-2 max-w-3xl mx-auto w-full">
              <div className="relative rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg-input)', borderColor: 'var(--color-border)' }}>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Describe the data you want to query..."
                  className="w-full pl-4 pr-4 pt-3 pb-12 outline-none min-h-[80px] max-h-[180px] resize-y overflow-auto scrollbar-hide text-sm"
                  style={{ background: 'transparent', color: 'var(--color-text-primary)' }}
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-1">
                  <button
                    type="button"
                    className="p-2 rounded-lg cursor-pointer"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    disabled={loading}
                  >
                    <img src="/attach.png" alt="file" className="w-[18px] h-[18px]" />
                  </button>
                  <button
                    type="submit"
                    className="p-2 rounded-lg cursor-pointer flex items-center justify-center"
                    style={{
                      background: loading ? 'var(--color-text-muted)' : 'var(--color-primary)',
                      color: 'var(--color-text-on-primary)'
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--color-primary-hover)' }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--color-primary)' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <i className="fa-solid fa-arrow-up text-sm"></i>
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
