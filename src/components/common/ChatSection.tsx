import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User, MessageCircle, LogOut, Circle, CheckCheck } from 'lucide-react';
import { chatAPI } from '../../services/api';
// import { webSocketService } from '../../services/websocket';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage, User as UserType } from '../../types';
import toast from 'react-hot-toast';

interface ConversationUser {
  userId: string;
  username: string;
  email: string;
  role: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSenderId?: string;
  unreadCount: number;
}

const ChatSection: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversations();
      
      // Connect to WebSocket
      // webSocketService.connect(user.id);
      
      // Listen for new messages
      const handleNewMessage = (message: ChatMessage) => {
        // Update messages if this is the current conversation
        if (selectedUser && 
            ((message.senderId === user.id && message.receiverId === selectedUser.id) ||
             (message.senderId === selectedUser.id && message.receiverId === user.id))) {
          setMessages(prev => [...prev, message]);
        }
        
        // Always refresh conversations to update last message and unread count
        loadConversations();
      };
      
      // webSocketService.onMessage(handleNewMessage);
      
      // Refresh conversations every 30 seconds to keep them updated
      const intervalId = setInterval(() => {
        loadConversations();
      }, 30000);
      
      return () => {
        // webSocketService.removeMessageCallback(handleNewMessage);
        clearInterval(intervalId);
      };
    }
  }, [user, selectedUser]); // Added selectedUser as dependency

  const loadConversations = async () => {
    try {
      const response = await chatAPI.getConversations(user!.id);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations');
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await chatAPI.findUser(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (targetUser: UserType) => {
    setSelectedUser(targetUser);
    setSearchResults([]);
    setSearchQuery('');
    setShowSearch(false);
    
    try {
      const response = await chatAPI.getMessages(user!.id, targetUser.id);
      setMessages(response.data);
      
      // Refresh conversations to update read status
      loadConversations();
      
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      // Send via API
      await chatAPI.sendMessage({
        senderId: user!.id,
        receiverId: selectedUser.id,
        message: newMessage.trim()
      });

      // Send via WebSocket for real-time delivery
      // webSocketService.sendMessage(user!.id, selectedUser.id, newMessage.trim());
      setNewMessage('');
      
      // Refresh messages
      const response = await chatAPI.getMessages(user!.id, selectedUser.id);
      setMessages(response.data);
      loadConversations();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="p-8 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button
          onClick={logout}
          className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
      
      <div className="h-full bg-white rounded-lg shadow-md overflow-hidden flex">
        {/* Left Panel - Chat List and Search */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            
            {showSearch && (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search username or email"
                    />
                  </div>
                  <button
                    onClick={searchUsers}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Search
                  </button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map((searchUser) => (
                      <button
                        key={searchUser.id}
                        onClick={() => startChat(searchUser)}
                        className="w-full text-left p-2 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{searchUser.username}</p>
                            <p className="text-xs text-gray-600">{searchUser.role}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              <div className="space-y-1 p-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.userId}
                    onClick={() => startChat({
                      id: conversation.userId,
                      username: conversation.username,
                      email: conversation.email,
                      role: conversation.role as any,
                      isVerified: true
                    })}
                    className={`w-full text-left p-3 rounded-lg transition-colors relative ${
                      selectedUser?.id === conversation.userId
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        {/* Online indicator */}
                        <Circle className="w-3 h-3 bg-green-400 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">{conversation.username}</p>
                          <div className="flex items-center space-x-1">
                            {conversation.unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse">
                                {conversation.unreadCount}
                              </span>
                            )}
                            {conversation.lastMessageTime && (
                              <span className="text-xs text-gray-400">
                                {new Date(conversation.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate flex-1">
                            {conversation.lastMessage ? (
                              <>
                                {conversation.lastMessageSenderId === user!.id && (
                                  <span className="flex items-center">
                                    <CheckCheck className="w-3 h-3 text-blue-600 mr-1" />
                                    You: 
                                  </span>
                                )}
                                <span className={`${conversation.unreadCount > 0 && conversation.lastMessageSenderId !== user!.id ? 'font-semibold text-gray-900' : ''}`}>
                                  {conversation.lastMessage}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">`${conversation.role} • Start a conversation`</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <p className="text-gray-400 text-xs mt-1">Use the search button to find users</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedUser.username}</h3>
                    <p className="text-sm text-gray-600">{selectedUser.role}</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user!.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user!.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user!.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose from existing conversations or search for new users</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSection;