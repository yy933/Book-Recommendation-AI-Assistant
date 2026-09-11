"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types";

const SUGGESTIONS = [
  "🔍 Thriller & Mystery Novels",
  "⏱️ Best Time Management Books",
  "🚀 Fast-paced Sci-Fi Classic",
  "🧠 Psychology for Daily Life",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (customQuery?: string) => {
    const textToSend = customQuery || input;
    if (!textToSend.trim() || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: textToSend },
    ];
    setMessages(newMessages);
    if (!customQuery) setInput("");
    setLoading(true);

    const fallbackText =
      "Sorry, I couldn't find any matching books for you right now. Please try again or rephrase your request!";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();

      if (res.ok && data.result) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.result },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: fallbackText },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: fallbackText },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto w-full p-4 md:p-6 flex flex-col h-screen font-sans bg-[#FBF9F5]">
      {/* Header Area */}
      <header className="text-center my-3 space-y-1.5">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2C2A29]">
          What to Read Next?
        </h1>
        <p className="text-sm text-[#786F66] max-w-sm mx-auto">
          Your personal AI librarian for tailored book recommendations.
        </p>
      </header>

      {/* Main Chat Container */}
      <div className="flex-1 overflow-y-auto border border-[#E8E2D9] p-4 md:p-6 rounded-2xl space-y-5 my-3 bg-white/80 backdrop-blur-sm shadow-sm flex flex-col">
        {messages.length === 0 && (
          <div className="my-auto flex flex-col items-center justify-center space-y-4 px-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-[#F5ECE0] border border-[#EADAC8] flex items-center justify-center text-3xl shadow-xs">
              📖
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-[#2C2A29] text-base">
                Looking for your next great read?
              </h3>
              <p className="text-xs text-[#8C827A] max-w-xs">
                Describe a genre, mood, or topic you're interested in, or click
                a suggestion below.
              </p>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-md">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-[#F5F0E8] hover:bg-[#EADAC8] text-[#544C45] hover:text-[#2C2A29] px-3.5 py-1.5 rounded-lg border border-[#E2D8CC] transition-all cursor-pointer font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-4 rounded-2xl max-w-[85%] md:max-w-[75%] text-sm leading-relaxed shadow-xs ${
                m.role === "user"
                  ? "bg-[#2C2A29] text-[#FBF9F5] rounded-br-none font-medium"
                  : "bg-[#F3EFEA] border border-[#E5DFD5] text-[#2C2A29] rounded-bl-none"
              }`}
            >
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C26D38] font-semibold underline underline-offset-2 hover:text-[#9E5224] transition-colors"
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      {...props}
                      className="font-bold text-base mt-3 mb-1.5 text-[#2C2A29] border-b border-[#E0D8CC] pb-1"
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      {...props}
                      className="list-disc pl-4 space-y-1.5 my-2"
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li {...props} className="marker:text-[#C26D38]" />
                  ),
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-[#786F66] p-3 bg-[#F3EFEA] border border-[#E5DFD5] rounded-2xl w-fit shadow-xs">
            <span className="animate-spin text-[#C26D38]">🌀</span>
            <span className="font-medium text-[#544C45]">
              Curating recommendations...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <div className="bg-white p-2 border border-[#E2D8CC] rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-[#C26D38]/20 focus-within:border-[#C26D38] transition-all flex items-center gap-2">
        <input
          type="text"
          className="flex-1 bg-transparent px-3 py-2 text-[#2C2A29] placeholder-[#A3988E] focus:outline-none text-sm"
          placeholder="e.g., Fast-paced sci-fi with mind-bending plots..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-[#C26D38] hover:bg-[#A85A2B] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:bg-[#E8DFD5] disabled:text-[#B5A99D] disabled:cursor-not-allowed disabled:active:scale-100 shadow-xs"
        >
          Send
        </button>
      </div>
    </main>
  );
}
