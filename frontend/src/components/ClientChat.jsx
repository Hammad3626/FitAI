import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

// ─── Timestamp helper ────────────────────────────────────────────────────────
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return timeStr;
  if (isYesterday) return `Yesterday ${timeStr}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
}

// ─── Day separator label (e.g. "Today", "Yesterday", "Sep 19") ──────────────
function dayLabel(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Main ClientChat component ────────────────────────────────────────────────
export function ClientChat({ trainer, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch messages from the server
  const fetchMessages = useCallback(async (markRead = false) => {
    try {
      const data = await api.get('/user-trainer/messages');
      if (Array.isArray(data)) {
        setMessages(data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Could not load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + mark read
  useEffect(() => {
    fetchMessages(true);

    // Also call the mark-read endpoint explicitly
    api.put('/user-trainer/messages/read').catch(() => {});

    // Poll every 10 seconds for new messages
    pollRef.current = setInterval(() => {
      fetchMessages();
    }, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');

    try {
      const newMsg = await api.post('/user-trainer/messages', { content: text });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore input if send fails
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key (Shift+Enter = newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by day for separators
  const renderMessages = () => {
    let lastDay = null;
    return messages.map((msg, i) => {
      const msgDay = new Date(msg.createdAt).toDateString();
      const showDayLabel = msgDay !== lastDay;
      lastDay = msgDay;

      // Is this message sent by the logged-in user (the client)?
      const isMe = msg.sender?._id === userId || msg.sender === userId;

      return (
        <React.Fragment key={msg._id || i}>
          {/* Day separator */}
          {showDayLabel && (
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider px-2">
                {dayLabel(msg.createdAt)}
              </span>
              <div className="flex-1 h-px bg-border/30" />
            </div>
          )}

          {/* Message bubble */}
          <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            {!isMe && (
              <>
                {trainer?.profileImage ? (
                  <img
                    src={trainer.profileImage}
                    alt={trainer.displayName}
                    className="h-7 w-7 rounded-full object-cover border border-primary/30 shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                    {trainer?.displayName?.[0] || 'T'}
                  </div>
                )}
              </>
            )}

            {/* Bubble */}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                isMe
                  ? 'bg-gradient-primary text-primary-foreground rounded-br-sm shadow-glow'
                  : 'glass border border-border/40 text-foreground rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <p
                className={`text-[10px] mt-1 ${
                  isMe ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
                }`}
              >
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Loading conversation…</p>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => { setLoading(true); fetchMessages(true); }}
          className="px-4 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Main chat UI ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: '420px' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-2 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-40" />
            <p className="text-sm">No messages yet. Say hello to your coach!</p>
          </div>
        ) : (
          renderMessages()
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="mt-3 flex items-end gap-2 border-t border-border/30 pt-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 bg-input/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 text-foreground resize-none max-h-24 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
