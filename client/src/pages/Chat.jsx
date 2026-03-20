import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import { showSuccess, showError } from '../utils/toast';
import './Chat.css';

function formatLastAt(date) {
  if (!date) return '';
  const d = new Date(date);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
}

export default function Chat() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [conversationsError, setConversationsError] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const loadConversations = (quiet = false) => {
    if (!quiet) {
      setConversationsError(null);
      setLoading(true);
    }
    api.get('/chat/conversations', { _silent: quiet })
      .then(res => setConversations(res.data || []))
      .catch(err => {
        if (!quiet) {
          setConversations([]);
          const msg = err?.userMessage || err?.response?.data?.message || err?.message || 'Failed to load conversations';
          setConversationsError(msg);
          showError(err);
        }
      })
      .finally(() => { if (!quiet) setLoading(false); });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const loadMessages = (userId, silent = false) => {
    if (!userId) return Promise.resolve();
    return api.get(`/chat/${userId}`, { _silent: silent })
      .then(res => setMessages(res.data || []))
      .catch(err => {
        if (!silent) {
          setMessages([]);
          showError(err.response?.data?.message || 'Failed to load messages');
        }
      });
  };

  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }
    setMessagesLoading(true);
    const userId = selectedUser._id != null ? String(selectedUser._id) : selectedUser._id;
    loadMessages(userId)
      .then(() => loadConversations(true))
      .finally(() => setMessagesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id]);

  useEffect(() => {
    if (!selectedUser || !socket) return;
    const userId = selectedUser._id != null ? String(selectedUser._id) : selectedUser._id;
    const onNewMessage = (msg) => {
      const receiverId = String(msg.receiver?._id || msg.receiver);
      const senderId = String(msg.sender?._id || msg.sender);
      if (receiverId === String(user?._id) && senderId === userId) {
        setMessages(m => [...m, msg]);
        loadConversations(true);
      }
    };
    socket.on('new_message', onNewMessage);
    return () => socket.off('new_message', onNewMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id, socket, user?._id]);

  useEffect(() => {
    if (!selectedUser || !socket) return;
    const receiverId = String(selectedUser._id);
    socket.on('typing', ({ userId: uid, name }) => {
      if (String(uid) === receiverId) setTypingUser(name);
    });
    socket.on('typing_stop', ({ userId: uid }) => {
      if (String(uid) === receiverId) setTypingUser(null);
    });
    return () => {
      socket.off('typing');
      socket.off('typing_stop');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id, socket]);

  useEffect(() => {
    if (!selectedUser) return;
    const userId = selectedUser._id != null ? String(selectedUser._id) : selectedUser._id;
    const interval = setInterval(() => loadMessages(userId, true), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id]);

  useEffect(() => {
    const interval = setInterval(() => loadConversations(true), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    if (!socket || !selectedUser) return;
    socket.emit('typing', { receiverId: String(selectedUser._id) });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId: String(selectedUser._id) });
    }, 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    if (socket) socket.emit('typing_stop', { receiverId: String(selectedUser._id) });
    setSending(true);
    try {
      const receiverId = selectedUser._id != null ? String(selectedUser._id) : selectedUser._id;
      const { data } = await api.post('/chat', {
        receiver: receiverId,
        text: newMessage.trim()
      });
      setMessages(m => [...m, data]);
      setNewMessage('');
      loadConversations(true);
      showSuccess('Message sent.');
    } catch (err) {
      showError(err);
    } finally {
      setSending(false);
    }
  };

  const isManager = user?.role === 'manager';
  const isAgent = user?.role === 'agent';

  if (!isManager && !isAgent) {
    return (
      <div className="chat-page">
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">Chat is available for Managers and Agents only.</p>
        </div>
      </div>
    );
  }

  if (loading) return <PageLoader message="Loading chat..." />;

  return (
    <div className="chat-page">
      <header className="chat-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Chat</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isManager ? 'Message your agents' : 'Message your manager'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadConversations}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </header>

      {conversationsError ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">{conversationsError}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ensure the server is running and you are logged in as Manager or Agent.</p>
          <button
            type="button"
            onClick={loadConversations}
            className="px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          message={isManager ? 'No agents assigned yet. Assign agents from Team Users.' : 'No manager assigned. Contact admin.'}
          buttonText={isManager ? 'Team Users' : undefined}
          to={isManager ? '/team-users' : undefined}
        />
      ) : (
        <div className="chat-layout">
          <aside className="chat-sidebar">
            <div className="chat-conversations">
              {conversations.map(c => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setSelectedUser(c)}
                  className={`chat-conv-item ${selectedUser?._id === c._id ? 'active' : ''}`}
                >
                  <span className="chat-conv-avatar">{c.name?.charAt(0) || '?'}</span>
                  <div className="chat-conv-info">
                    <div className="chat-conv-row">
                      <span className="chat-conv-name">{c.name}</span>
                      {c.lastAt && <span className="chat-conv-time">{formatLastAt(c.lastAt)}</span>}
                    </div>
                    {c.lastMessage && (
                      <span className="chat-conv-preview">{c.lastMessage}</span>
                    )}
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="chat-conv-unread">{c.unreadCount > 99 ? '99+' : c.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <main className="chat-main">
            {!selectedUser ? (
              <div className="chat-empty">
                <p className="text-slate-500 dark:text-slate-400">Select a conversation to start messaging</p>
              </div>
            ) : (
              <>
                <div className="chat-header-bar">
                  <span className="chat-header-avatar">{selectedUser.name?.charAt(0) || '?'}</span>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedUser.name}
                      {onlineUsers.has(String(selectedUser._id)) && (
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">Online</span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="chat-messages">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse text-slate-500 dark:text-slate-400 text-sm">Loading messages...</div>
                    </div>
                  ) : (
                  <>
                  {messages.map(m => {
                    const isMe = String(m.sender?._id || m.sender) === String(user?._id);
                    const isRead = !!m.readAt;
                    return (
                      <div key={m._id} className={`chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-them'}`}>
                        <div className="chat-msg-bubble">
                          <p className="chat-msg-text">{m.text}</p>
                          <div className="chat-msg-meta">
                            <span className="chat-msg-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              <span className="chat-msg-status" title={isRead ? 'Read' : 'Sent'}>
                                {isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUser && (
                    <div className="chat-msg chat-msg-them">
                      <div className="chat-msg-bubble chat-msg-typing">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{typingUser} is typing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                  </>
                  )}
                </div>

                <form onSubmit={handleSend} className="chat-input-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    placeholder="Type a message..."
                    className="chat-input"
                    disabled={sending}
                  />
                  <button type="submit" disabled={!newMessage.trim() || sending} className="chat-send-btn">
                    {sending ? '...' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
