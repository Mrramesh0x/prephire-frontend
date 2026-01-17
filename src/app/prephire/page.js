"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send } from "lucide-react"
  import { ChevronDown } from "lucide-react"
import { useRef } from "react"

export default function PrepHireChat() {
  

const chatEndRef = useRef(null)
const chatBodyRef = useRef(null)
const [showScrollBtn, setShowScrollBtn] = useState(false)

  const [mode, setMode] = useState("greet") // greet | interview
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Are you ready for the interview?"
  )
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [interviewCompleted, setInterviewCompleted] = useState(false)

  /* ---------------- GREET MODE ---------------- */
  useEffect(() => {
  if (!showScrollBtn) {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
}, [messages, loading])

const handleScroll = () => {
  const el = chatBodyRef.current
  if (!el) return

  const isBottom =
    el.scrollHeight - el.scrollTop - el.clientHeight < 100

  setShowScrollBtn(!isBottom)
}


  const handleGreet = async () => {
    if (!input.trim()) return
    setWelcomeMessage("")

    const userMsg = { role: "user", text: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await axios.post("https://prephire-backend-ewe3.onrender.com/api/greet", {
        userPrompt: userMsg.text,
      })

      setMessages(prev => [
        ...prev,
        { role: "ai", text: res.data.message },
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- INTERVIEW MODE ---------------- */

  const loadQuestion = async () => {
    try {
      setLoading(true)

      const res = await axios.get(
        "https://prephire-backend-ewe3.onrender.com/api/questions",
        { withCredentials: true }
      )

      if (!res.data.question) {
        setInterviewCompleted(true)
        setMessages(prev => [
          ...prev,
          { role: "ai", text: "Interview Completed 🎉" },
        ])
        return
      }

      const q = res.data.question.question
      setCurrentQuestion(q)

      setMessages(prev => [
        ...prev,
        { role: "ai", text: q },
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInterviewAnswer = async () => {
    if (!input.trim() || loading || interviewCompleted) return

    const answer = input
    setInput("")

    setMessages(prev => [
      ...prev,
      { role: "user", text: answer },
    ])

    try {
      setLoading(true)

      const res = await axios.post(
        "https://prephire-backend-ewe3.onrender.com/api/evaluate",
        {
          que: currentQuestion,
          answer,
        }
      )

      setMessages(prev => [
        ...prev,
        { role: "ai", text: res.data.feedback },
      ])

      setTimeout(() => {
        loadQuestion()
      }, 800)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  const handleSend = () => {
    if (mode === "greet") handleGreet()
    if (mode === "interview") handleInterviewAnswer()
  }


const startInterview = async () => {
   await axios.post(
    "https://prephire-backend-ewe3.onrender.com/api/reset-interview",
    {},
    { withCredentials: true }
  )

  setMode("interview")
  setInterviewCompleted(false)
  setCurrentQuestion("")
  setMessages([
    { role: "ai", text: "Great! Let's begin your interview." }
  ])
  loadQuestion()
}


  return (
    <div className="chat-page">
      <header className="chat-header">PrepHire AI</header>

      {welcomeMessage && messages.length === 0 && (
        <div className="welcome-wrapper">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="welcome-text"
          >
            {welcomeMessage}
          </motion.div>
        </div>
      )}

    <main
  className="chat-body"
  ref={chatBodyRef}
  onScroll={handleScroll}
>

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`chat-message ${
                msg.role === "user" ? "user-msg" : "ai-msg"
              }`}
            >
              {msg.text}
                <div ref={chatEndRef} />
            </motion.div>
            
          ))}


          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="chat-message ai-msg thinking-msg"
            >
              <span className="thinking-text">PrepHire AI is thinking</span>
              <span className="typing">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!interviewCompleted && (
        <div className="chat-input-box">
          <div className="chat-input-inner">
            <input
              className="chat-input"
              placeholder={
                mode === "greet"
                  ? "Type your message..."
                  : "Type your answer..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="send-btn" onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>

          {mode === "greet" && messages.length > 0 && !loading && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="start-inline-btn"
              onClick={startInterview}
            >
              Start Interview →
            </motion.button>
          )}
        </div>
      )}
      {showScrollBtn && (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="scroll-bottom-btn"
    onClick={() =>
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  >
    <ChevronDown size={20} />
  </motion.button>
)}
    </div>
  )
}
