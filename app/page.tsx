"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const fallbackText =
      "Sorry, I couldn't find any books for you. Please try again later.";

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
    <main className="max-w-2xl mx-auto p-4 flex flex-col h-screen">
      <h1 className="text-2xl font-bold mb-4 mx-auto">
        Your Book Recommendation Assistant{" "}
      </h1>

      <div className="flex-1 overflow-y-auto border border-slate-200 p-4 rounded-xl space-y-4 mb-4 bg-white shadow-inner">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <span className="text-4xl">📖</span>
            <p className="text-sm">
              Enter the type of books you're looking for, e.g., "Recommend me
              some mystery novels" or "Books on time management"
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-3.5 rounded-2xl max-w-lg shadow-sm text-sm leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-br-xs" : "bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-xs"}`}
            >
              <div className="prose prose-slate text-sm leading-relaxed max-w-none">
                {" "}
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        {...props}
                        className="font-bold text-base mt-3 mb-1 text-slate-900"
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        {...props}
                        className="list-disc pl-4 space-y-1 my-2"
                      />
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 p-2 bg-slate-100 rounded-lg w-fit animate-pulse">
            <span>Searching for books you might like...</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
        <input
          type="text"
          className="flex-1 bg-white border-0 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 text-sm"
          placeholder="What books are you looking for? "
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </main>
  );
}
