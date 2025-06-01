"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useUser } from "../contexts/UserContext"
import { Bell, MessageCircle, UserPlus, ThumbsUp } from "lucide-react"

const Navbar = ({ notifications = [], unreadCount = 0 }) => {
  const navigate = useNavigate()
  const { user, setUser } = useUser()
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await axios.get("http://localhost:5005/api/user", {
          headers: { Authorization: token },
        })
        setUser(response.data)
      } catch (error) {
        console.error("Error fetching user", error)
      }
    }

    fetchUser()
  }, [setUser])

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
    navigate("/login")
  }

  const handleNavigate = (path) => {
    navigate(path)
  }

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gray-700 px-6 py-4 text-white flex justify-between items-center shadow-lg">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {user && (
          <span className="text-white font-medium text-base flex items-center">
            👋 Hi, {user.name}
          </span>
        )}
        <input
          type="text"
          placeholder="Search..."
          className="bg-white border border-indigo-400 text-indigo-900 py-1 px-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
        />
      </div>

      {/* Right Section */}
      <div className="flex space-x-6 items-center text-base relative">
        <button onClick={() => handleNavigate("/home")} className="hover:text-indigo-300 font-semibold">
          Home
        </button>
        <button onClick={() => handleNavigate("/connect")} className="hover:text-indigo-300 font-semibold">
          Connect
        </button>
        <button onClick={() => handleNavigate("/chat")} className="hover:text-indigo-300 font-semibold">
          Chat
        </button>
        <button onClick={() => handleNavigate("/about")} className="hover:text-indigo-300 font-semibold">
          About
        </button>
        <button onClick={() => handleNavigate("/profile")} className="hover:text-indigo-300 font-semibold">
          Profile
        </button>
        <button onClick={() => handleNavigate("/contact")} className="hover:text-indigo-300 font-semibold">
          Contact
        </button>
        <button onClick={() => handleNavigate("/chatbot")} className="hover:text-indigo-300 font-semibold">
          Help
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative hover:text-yellow-400 transition-colors"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl text-gray-800 z-50 overflow-hidden">
              <div className="p-4 border-b font-semibold text-blue-600 bg-gray-100">Notifications</div>
              <ul className="divide-y text-sm max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <li
                      key={notification._id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        // Handle notification click
                        if (notification.type === 'new_message' || notification.type === 'new_conversation') {
                          handleNavigate('/chat');
                        } else if (notification.type === 'connection_request') {
                          handleNavigate('/connect');
                        }
                        setShowNotifications(false);
                      }}
                    >
                      {notification.type === 'new_message' || notification.type === 'new_conversation' ? (
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      ) : notification.type === 'connection_request' ? (
                        <UserPlus className="w-5 h-5 text-green-600" />
                      ) : (
                        <ThumbsUp className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="font-medium">{notification.message}</span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-center text-gray-500">No notifications</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Logout Button */}
        {user && (
          <button
            onClick={handleLogout}
            className="bg-indigo-800 text-white font-semibold px-4 py-1 rounded-full hover:bg-indigo-900 transition-colors shadow"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar