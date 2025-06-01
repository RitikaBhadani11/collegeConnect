import { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../component/Navbar';
import { FiSearch, FiPaperclip, FiMic, FiSend, FiMoreVertical, FiUserX } from 'react-icons/fi';
import { BsEmojiSmile, BsCheck2All } from 'react-icons/bs';
import { IoMdClose } from 'react-icons/io';
import EmojiPicker from 'emoji-picker-react';

const ChatPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const socket = new WebSocket(`ws://localhost:5005?token=${localStorage.getItem('token')}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({
        type: 'join',
        userId: user._id
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'newMessage') {
        if (data.message.conversation === selectedConversation?._id) {
          setMessages(prev => [...prev, data.message]);
        }
        fetchConversations();
      } else if (data.type === 'newNotification') {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user, selectedConversation]);

  // Search users
  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:5005/api/chat/search?query=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSearchResults(data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Get user conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Start or select conversation
  const handleSelectUser = async (userId) => {
    try {
      const response = await fetch('http://localhost:5005/api/chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ participantId: userId })
      });
      const data = await response.json();
      setSelectedConversation(data.conversation);
      setSearchQuery('');
      setSearchResults([]);
      fetchMessages(data.conversation._id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`http://localhost:5005/api/chat/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;

    try {
      let messageData = {
        conversationId: selectedConversation._id
      };

      if (selectedFile) {
        // Handle file upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('conversationId', selectedConversation._id);

        const uploadResponse = await fetch('http://localhost:5005/api/chat/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        messageData = { ...messageData, ...uploadData };
        setSelectedFile(null);
      } else {
        // Regular text message
        messageData.content = newMessage;
      }

      const response = await fetch('http://localhost:5005/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();
      setMessages([...messages, data.message]);
      setNewMessage('');
      
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'sendMessage',
          message: data.message
        }));
      }

      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioFile = new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' });
        setSelectedFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Block user
  const blockUser = async (userId) => {
    try {
      await fetch(`http://localhost:5005/api/users/block/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchConversations();
      setSelectedConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  // Add emoji to message
  const onEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:5005/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchConversations();
      fetchNotifications();
    }
  }, [user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <Navbar notifications={notifications} unreadCount={unreadCount} />
      <div className="container mx-auto py-20 px-4">
        <div className="flex h-[calc(100vh-10rem)] rounded-xl overflow-hidden shadow-2xl">
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-800 border-r border-gray-700 flex flex-col">
            {/* Search Bar */}
            <div className="p-4 bg-gray-900">
              <h2 className="text-xl font-bold mb-4 text-indigo-400">Messages</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search users..."
                  className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border-b border-gray-700 p-2 bg-gray-800">
                <h3 className="font-semibold mb-2 px-2 text-gray-300">Search Results</h3>
                <div className="space-y-1">
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user._id)}
                      className="p-2 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center transition-colors"
                    >
                      <img
                        src={user.image || 'https://via.placeholder.com/40'}
                        alt={user.name}
                        className="w-8 h-8 rounded-full mr-3 object-cover"
                      />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {conversations.map((conversation) => {
                    const otherParticipant = conversation.participants.find(
                      (p) => p._id !== user._id
                    );
                    return (
                      <div
                        key={conversation._id}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          fetchMessages(conversation._id);
                        }}
                        className={`p-3 cursor-pointer flex items-center transition-colors ${selectedConversation?._id === conversation._id ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                      >
                        <img
                          src={otherParticipant?.image || 'https://via.placeholder.com/40'}
                          alt={otherParticipant?.name}
                          className="w-10 h-10 rounded-full mr-3 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium truncate">{otherParticipant?.name}</p>
                            {conversation.lastMessage && (
                              <span className="text-xs text-gray-400">
                                {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="w-2/3 flex flex-col bg-gray-900">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                  <div className="flex items-center">
                    {selectedConversation.participants
                      .filter((p) => p._id !== user._id)
                      .map((participant) => (
                        <div key={participant._id} className="flex items-center">
                          <img
                            src={participant.image || 'https://via.placeholder.com/40'}
                            alt={participant.name}
                            className="w-10 h-10 rounded-full mr-3 object-cover"
                          />
                          <div>
                            <p className="font-bold">{participant.name}</p>
                            <p className="text-xs text-gray-400">{participant.email}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowOptions(!showOptions)}
                      className="p-2 rounded-full hover:bg-gray-700"
                    >
                      <FiMoreVertical />
                    </button>
                    {showOptions && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10">
                        <button
                          onClick={() => {
                            const otherParticipant = selectedConversation.participants.find(
                              (p) => p._id !== user._id
                            );
                            blockUser(otherParticipant._id);
                            setShowOptions(false);
                          }}
                          className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 w-full text-left"
                        >
                          <FiUserX className="mr-2" /> Block User
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <p>No messages yet</p>
                      <p className="text-sm mt-2">Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender._id === user._id ? 'bg-indigo-600' : 'bg-gray-700'}`}
                          >
                            {message.fileUrl ? (
                              <div>
                                {message.fileType.startsWith('image/') ? (
                                  <img 
                                    src={message.fileUrl} 
                                    alt="Attachment" 
                                    className="max-w-full h-auto rounded"
                                  />
                                ) : message.fileType.startsWith('audio/') ? (
                                  <audio controls className="w-full">
                                    <source src={message.fileUrl} type={message.fileType} />
                                  </audio>
                                ) : (
                                  <a 
                                    href={message.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-indigo-300 hover:underline"
                                  >
                                    Download File
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p>{message.content}</p>
                            )}
                            <div className="flex items-center justify-end mt-1 space-x-1">
                              <p className="text-xs text-gray-300">
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {message.sender._id === user._id && (
                                <BsCheck2All className={`text-xs ${message.read ? 'text-blue-300' : 'text-gray-400'}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700 bg-gray-800">
                  {selectedFile && (
                    <div className="mb-2 flex items-center justify-between bg-gray-700 p-2 rounded-lg">
                      <div className="flex items-center">
                        <span className="truncate max-w-xs">{selectedFile.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <IoMdClose />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 rounded-full hover:bg-gray-700 mr-1"
                    >
                      <BsEmojiSmile className="text-xl" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,audio/*,video/*"
                    />
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="p-2 rounded-full hover:bg-gray-700 mr-1"
                    >
                      <FiPaperclip className="text-xl" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-700 text-white p-2 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {isRecording ? (
                      <button
                        onClick={stopRecording}
                        className="bg-red-500 text-white p-2 rounded-r-lg hover:bg-red-600 flex items-center"
                      >
                        <span className="w-3 h-3 bg-white rounded-full mr-1 animate-pulse"></span>
                        Stop
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={startRecording}
                          className="p-2 text-gray-400 hover:text-white"
                        >
                          <FiMic className="text-xl" />
                        </button>
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() && !selectedFile}
                          className="bg-indigo-600 text-white p-2 rounded-r-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiSend className="text-xl" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="bg-gray-800 p-8 rounded-xl text-center max-w-md">
                  <h3 className="text-xl font-bold mb-2">No conversation selected</h3>
                  <p className="mb-4">Select a conversation from the list or search for a user to start chatting</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Search Users
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;