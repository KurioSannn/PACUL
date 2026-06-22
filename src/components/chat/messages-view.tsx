"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Send, Truck, Package } from "lucide-react";
import { useState } from "react";

import { mockChatThreads } from "@/data/mock-household";
import type { ChatThread } from "@/types/household";

export function MessagesView() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(mockChatThreads[0]?.id || null);
  const [draftMessage, setDraftMessage] = useState("");
  
  // Local state to simulate sending messages
  const [threads, setThreads] = useState<ChatThread[]>(mockChatThreads);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftMessage.trim() || !activeThread) return;

    const newMessage = {
      id: `msg-new-${Date.now()}`,
      threadId: activeThread.id,
      senderRole: "household" as const,
      senderName: "Bu Rina Astuti",
      type: "text" as const,
      content: draftMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    setThreads(prev => prev.map(thread => {
      if (thread.id === activeThread.id) {
        return {
          ...thread,
          lastMessage: draftMessage.trim(),
          lastMessageAt: newMessage.createdAt,
          messages: [...thread.messages, newMessage]
        };
      }
      return thread;
    }));
    
    setDraftMessage("");
  };

  return (
    <div className="page-shell grow py-8 h-[calc(100vh-72px)] flex flex-col">
      <div className="flex flex-col gap-1 mb-6 shrink-0">
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-[var(--color-leaf-700)]">Pesan</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-forest-900)] sm:text-3xl">Chat dengan Mitra</h1>
      </div>

      <div className="flex flex-1 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-panel)]">
        
        {/* Thread List Sidebar */}
        <div className={`w-full md:w-80 shrink-0 flex flex-col border-r border-[var(--color-line)] ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-[var(--color-line)]">
            <h2 className="font-semibold text-[var(--color-forest-900)]">Percakapan ({threads.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--color-ink-500)]">Belum ada percakapan.</div>
            ) : (
              <ul className="divide-y divide-[var(--color-line)]">
                {threads.map(thread => (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => setActiveThreadId(thread.id)}
                      className={`w-full text-left p-4 transition-colors hover:bg-[var(--color-sage-50)] ${activeThreadId === thread.id ? 'bg-[var(--color-mint-100)]/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-[var(--color-forest-900)] truncate">{thread.carrierName}</h3>
                        <span className="shrink-0 text-[10px] text-[var(--color-ink-500)]">
                          {new Date(thread.lastMessageAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-ink-500)] truncate">{thread.materialTitle}</p>
                      <p className={`mt-1.5 text-xs truncate ${thread.unreadCount > 0 ? 'font-semibold text-[var(--color-forest-900)]' : 'text-[var(--color-ink-700)]'}`}>
                        {thread.lastMessage}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex-col bg-[#fdfdfd] relative ${!activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="shrink-0 p-4 border-b border-[var(--color-line)] bg-white flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveThreadId(null)}
                  className="md:hidden inline-flex size-8 items-center justify-center rounded-full text-[var(--color-ink-500)] hover:bg-[var(--color-sage-50)]"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
                <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-mint-100)] shrink-0">
                  <Truck className="size-5 text-[var(--color-leaf-700)]" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm text-[var(--color-forest-900)] truncate">{activeThread.carrierName}</h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-ink-500)] truncate">
                    <Package className="size-3" aria-hidden="true" /> {activeThread.materialTitle}
                    <span className="rounded-full bg-[var(--color-sage-50)] px-1.5 py-0.5 border border-[var(--color-line)]">{activeThread.pickupStatus}</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {activeThread.messages.map((msg, idx) => {
                  const isHousehold = msg.senderRole === "household";
                  const isSystem = msg.type !== "text";
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-6">
                        <div className="rounded-full bg-[var(--color-sage-50)] border border-[var(--color-mint-200)] px-4 py-1.5 text-xs text-[var(--color-leaf-700)] font-medium text-center shadow-sm">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isHousehold ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] ${isHousehold ? 'bg-[var(--color-leaf-600)] text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-[var(--color-line)] text-[var(--color-forest-900)] rounded-2xl rounded-tl-sm'} p-3 shadow-sm`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isHousehold ? 'text-white/70' : 'text-[var(--color-ink-500)]'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="shrink-0 p-4 border-t border-[var(--color-line)] bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder="Tulis pesan ke mitra..."
                    className="flex-1 min-h-12 rounded-full border border-[var(--color-line)] bg-[var(--color-sage-50)] px-5 text-sm outline-none focus:border-[var(--color-leaf-500)] focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!draftMessage.trim()}
                    className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-forest-900)] text-white transition-colors hover:bg-[var(--color-forest-800)] disabled:opacity-50 disabled:hover:bg-[var(--color-forest-900)]"
                  >
                    <Send className="size-4 ml-1" aria-hidden="true" />
                    <span className="sr-only">Kirim pesan</span>
                  </button>
                </form>
                <p className="mt-2 text-center text-[10px] text-[var(--color-ink-500)]">Fitur chat ini adalah mock/demo. Pesan hanya tersimpan di local state saat ini.</p>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <MessageCircle className="size-12 text-[var(--color-mint-200)]" aria-hidden="true" />
              <p className="mt-4 font-medium text-[var(--color-forest-900)]">Pilih percakapan</p>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">Pilih mitra di panel kiri untuk mulai mengobrol.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
