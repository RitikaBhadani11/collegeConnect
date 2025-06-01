"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import { useUser } from "../contexts/UserContext"

const HomePage = () => {
  const [postText, setPostText] = useState("")
  const [postImages, setPostImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [posts, setPosts] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [achievements, setAchievements] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState("")
  const [modalType, setModalType] = useState("") // 'announcement' or 'achievement'
  const [loading, setLoading] = useState({
    posts: false,
    announcements: false,
    achievements: false,
  })
  const [error, setError] = useState({
    posts: null,
    announcements: null,
    achievements: null,
  })

  const { user } = useUser()
  const navigate = useNavigate()
  const [showComments, setShowComments] = useState({})
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch data from backend on component mount
  useEffect(() => {
    fetchAnnouncements()
    fetchAchievements()
    fetchPosts()
  }, [])

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    setLoading((prev) => ({ ...prev, announcements: true }))
    setError((prev) => ({ ...prev, announcements: null }))

    try {
      const response = await fetch("http://localhost:5005/api/announcements")
      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.statusText}`)
      }
      const data = await response.json()
      setAnnouncements(data.map((item) => `📌 ${item.description}`))
    } catch (err) {
      setError((prev) => ({ ...prev, announcements: err.message }))
      console.error("Error fetching announcements:", err)
    } finally {
      setLoading((prev) => ({ ...prev, announcements: false }))
    }
  }

  // Fetch achievements from API
  const fetchAchievements = async () => {
    setLoading((prev) => ({ ...prev, achievements: true }))
    setError((prev) => ({ ...prev, achievements: null }))

    try {
      const response = await fetch("http://localhost:5005/api/achievements")
      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`)
      }
      const data = await response.json()
      setAchievements(data.map((item) => `🎉 ${item.description}`))
    } catch (err) {
      setError((prev) => ({ ...prev, achievements: err.message }))
      console.error("Error fetching achievements:", err)
    } finally {
      setLoading((prev) => ({ ...prev, achievements: false }))
    }
  }

  // Add announcement API call
  const addAnnouncementAPI = async (description) => {
    try {
      const response = await fetch("http://localhost:5005/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add announcement: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error("Error adding announcement:", error)
      return null
    }
  }

  // Add achievement API call
  const addAchievementAPI = async (description) => {
    try {
      const response = await fetch("http://localhost:5005/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add achievement: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error("Error adding achievement:", error)
      return null
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB limit

      if (!isImage) {
        alert(`File "${file.name}" is not an image.`)
      }
      if (!isValidSize) {
        alert(`File "${file.name}" exceeds 5MB size limit.`)
      }

      return isImage && isValidSize
    })

    setPostImages(validFiles)

    // Create preview URLs for the selected images
    const imagePreviewUrls = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))

    setSelectedImages(imagePreviewUrls)
  }

  const removeSelectedImage = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(selectedImages[index].url)

    // Remove the image from both arrays
    const newSelectedImages = [...selectedImages]
    newSelectedImages.splice(index, 1)
    setSelectedImages(newSelectedImages)

    const newPostImages = [...postImages]
    newPostImages.splice(index, 1)
    setPostImages(newPostImages)
  }

  const handleExploreEvents = () => {
    navigate("/events")
  }

  const openModal = (type) => {
    setModalType(type)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalContent("")
  }

  const submitModal = async () => {
    if (!modalContent.trim()) return

    try {
      if (modalType === "announcement") {
        await addAnnouncementAPI(modalContent)
        await fetchAnnouncements()
      } else {
        await addAchievementAPI(modalContent)
        await fetchAchievements()
      }
      closeModal()
    } catch (error) {
      console.error("Error: Submission failed.", error)
    }
  }

  const fetchPosts = async () => {
    setLoading((prev) => ({ ...prev, posts: true }))
    setError((prev) => ({ ...prev, posts: null }))

    try {
      const res = await fetch("http://localhost:5005/api/posts")
      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.statusText}`)
      }
      const data = await res.json()
      setPosts(data)
    } catch (err) {
      setError((prev) => ({ ...prev, posts: err.message }))
      console.error("Error fetching posts:", err)
    } finally {
      setLoading((prev) => ({ ...prev, posts: false }))
    }
  }

  const createPost = async () => {
    if (!postText.trim() && postImages.length === 0) return

    if (!user) {
      alert("Please log in to create a post")
      return
    }

    setLoading((prev) => ({ ...prev, posts: true }))

    const formData = new FormData()
    formData.append("content", postText)
    formData.append("userId", user._id)
    formData.append("username", user.name)

    // Add each image to the formData
    postImages.forEach((img) => {
      formData.append("images", img)
    })

    try {
      const response = await fetch("http://localhost:5005/api/posts", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create post: ${response.status}`)
      }

      // Increment post count
      await fetch(`http://localhost:5005/api/profiles/${user._id}/increment-post-count`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      })

      // Refresh posts after successful creation
      await fetchPosts()
      setPostText("")
      setPostImages([])
      setSelectedImages([])
    } catch (err) {
      console.error("Error creating post:", err)
      alert("Failed to create post: " + err.message)
    } finally {
      setLoading((prev) => ({ ...prev, posts: false }))
    }
  }

  const handleLikePost = async (postId) => {
    if (!user) {
      alert("Please log in to like posts")
      return
    }

    try {
      const res = await fetch(`http://localhost:5005/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      })

      if (!res.ok) {
        throw new Error("Failed to like post")
      }

      const updatedPost = await res.json()

      // Update the post in the state
      setPosts((prevPosts) => prevPosts.map((post) => (post._id === postId ? updatedPost : post)))
    } catch (err) {
      console.error("Error liking post:", err)
    }
  }

  const handleDislikePost = async (postId) => {
    if (!user) {
      alert("Please log in to dislike posts")
      return
    }

    try {
      const res = await fetch(`http://localhost:5005/api/posts/${postId}/dislike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      })

      if (!res.ok) {
        throw new Error("Failed to dislike post")
      }

      const updatedPost = await res.json()

      // Update the post in the state
      setPosts((prevPosts) => prevPosts.map((post) => (post._id === postId ? updatedPost : post)))
    } catch (err) {
      console.error("Error disliking post:", err)
    }
  }

  const handleAddComment = async (postId, text) => {
    if (!user) {
      alert("Please log in to comment")
      return
    }

    if (!text.trim()) return

    try {
      const res = await fetch(`http://localhost:5005/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          userId: user._id,
          username: user.name,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to add comment")
      }

      const updatedPost = await res.json()

      // Update the post in the state
      setPosts((prevPosts) => prevPosts.map((post) => (post._id === postId ? updatedPost : post)))
    } catch (err) {
      console.error("Error adding comment:", err)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!user) return

    if (!window.confirm("Are you sure you want to delete this post?")) {
      return
    }

    setIsDeleting(true)

    try {
      const res = await fetch(`http://localhost:5005/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete post")
      }

      // Decrement post count
      await fetch(`http://localhost:5005/api/profiles/${user._id}/decrement-post-count`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      })

      // Remove the post from state
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId))
    } catch (err) {
      console.error("Error deleting post:", err)
      alert("Failed to delete post: " + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Navbar />
      <div className="container mx-auto py-20 px-4 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {/* Left Sidebar - Announcements & Achievements (STICKY) */}
        <div className="hidden md:block md:col-span-1 sticky top-20 self-start max-h-screen overflow-y-auto">
          {/* Announcements Section */}
          <div className="bg-indigo-700 p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">📢 Announcements</h3>
              {user && (
                <button
                  onClick={() => openModal("announcement")}
                  className="text-white bg-indigo-800 hover:bg-indigo-900 px-2 py-1 rounded text-sm transition-colors"
                >
                  Add
                </button>
              )}
            </div>
            {loading.announcements ? (
              <p className="text-white mt-2">Loading announcements...</p>
            ) : error.announcements ? (
              <p className="text-red-300 mt-2">Error: {error.announcements}</p>
            ) : (
              <ul className="mt-2 text-white">
                {announcements.map((item, index) => (
                  <li key={index} className="py-1">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Achievements Section */}
          <div className="bg-purple-700 mt-6 p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">🏆 Achievements</h3>
              {user && (
                <button
                  onClick={() => openModal("achievement")}
                  className="text-white bg-purple-800 hover:bg-purple-900 px-2 py-1 rounded text-sm transition-colors"
                >
                  Add
                </button>
              )}
            </div>
            {loading.achievements ? (
              <p className="text-white mt-2">Loading achievements...</p>
            ) : error.achievements ? (
              <p className="text-red-300 mt-2">Error: {error.achievements}</p>
            ) : (
              <ul className="mt-2 text-white">
                {achievements.map((item, index) => (
                  <li key={index} className="py-1">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Explore Events Section */}
          <div
            className="bg-indigo-600 mt-6 p-5 rounded-lg shadow-md cursor-pointer hover:bg-indigo-700 transition-colors"
            onClick={handleExploreEvents}
          >
            <h3 className="text-lg font-semibold text-white">🌟 Explore Events</h3>
            <p className="mt-2 text-white">Check out the latest events happening!</p>
          </div>
        </div>

        {/* Main Feed - Center (Posts Section) */}
        <div className="md:col-span-2">
          {loading.posts ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-300"></div>
            </div>
          ) : error.posts ? (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-4">Error loading posts: {error.posts}</div>
          ) : posts.length === 0 ? (
            <div className="bg-indigo-800 p-5 rounded-lg shadow-md mb-5 text-center">
              <p className="text-indigo-200">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            /* Displaying Posts */
            posts.map((post) => (
              <div
                key={post._id}
                className="bg-gray-700 p-5 rounded-lg shadow-md mb-5 max-w-[90%] mx-auto hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 mr-3 flex items-center justify-center overflow-hidden">
                    {post.userId && post.userId.image ? (
                      <img
                        src={post.userId.image || "/placeholder.svg"}
                        alt={post.userId.name || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src =
                            "https://tse1.mm.bing.net/th?id=OIP.MoLuogvKSS_uEhep5nvcuQHaID&pid=Api&P=0&h=180"
                        }}
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{post.userId?.name || post.username || "User"}</p>
                    <p className="text-xs text-indigo-300">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>

                  {user && (
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      disabled={isDeleting}
                      style={{
                        display:
                          // Check all possible ways the userId could be compared
                          (post.userId && typeof post.userId === "object" && post.userId._id === user._id) ||
                          (post.userId && typeof post.userId === "string" && post.userId === user._id) ||
                          (post.username && post.username === user.name)
                            ? "block"
                            : "none",
                      }}
                      className="text-red-300 hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                {post.title && <h3 className="text-lg font-semibold mb-2">{post.title}</h3>}
                <p className="text-indigo-100 whitespace-pre-line">{post.content}</p>

                {/* Display images */}
                {post.images && post.images.length > 0 && (
                  <div className={`mt-3 grid gap-2 ${post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {post.images.map((img, imgIndex) => (
                      <div key={imgIndex} className="relative">
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`Post image ${imgIndex + 1}`}
                          className="rounded-lg w-full max-h-96 object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src =
                              "https://tse1.mm.bing.net/th?id=OIP.MoLuogvKSS_uEhep5nvcuQHaID&pid=Api&P=0&h=180"
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Like, dislike, comment buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleLikePost(post._id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded ${
                      post.likes?.includes(user?._id)
                        ? "bg-indigo-500 text-white"
                        : "text-indigo-300 hover:text-indigo-200"
                    } transition-colors`}
                  >
                    👍 {post.likes?.length || 0}
                  </button>

                  <button
                    onClick={() => handleDislikePost(post._id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded ${
                      post.dislikes?.includes(user?._id) ? "bg-red-600 text-white" : "text-red-300 hover:text-red-200"
                    } transition-colors`}
                  >
                    👎 {post.dislikes?.length || 0}
                  </button>

                  <button
                    onClick={() =>
                      setShowComments((prev) => ({
                        ...prev,
                        [post._id]: !prev[post._id],
                      }))
                    }
                    className="text-indigo-300 hover:text-indigo-200 flex items-center gap-1 transition-colors"
                  >
                    💬 {post.comments?.length || 0} Comments
                  </button>
                </div>

                {/* Comments section */}
                {showComments[post._id] && (
                  <div className="mt-4 bg-gray-600 p-3 rounded-lg">
                    <h4 className="text-white mb-2 font-medium">Comments</h4>
                    {post.comments && post.comments.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {post.comments.map((comment, cIndex) => (
                          <div key={cIndex} className="bg-gray-800 p-2 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-white">{comment.username || "User"}</span>
                              <span className="text-xs text-indigo-100">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-white text-sm font-thin">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-indigo-300 text-sm">No comments yet</p>
                    )}

                    {user ? (
                      <form
                        className="mt-3"
                        onSubmit={(e) => {
                          e.preventDefault()
                          const form = e.target
                          const commentInput = form.elements.commentText
                          handleAddComment(post._id, commentInput.value)
                          commentInput.value = ""
                        }}
                      >
                        <div className="flex gap-2">
                          <input
                            name="commentText"
                            className="flex-1 bg-indigo-900 border border-indigo-600 rounded-lg p-2 text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="Add a comment..."
                            required
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors"
                          >
                            Post
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-red-300 mt-2 text-sm">Log in to comment.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Sidebar - Profile Section (STICKY) & Create Post Box */}
        <div className="hidden md:block md:col-span-1">
          {/* Profile Section (STICKY) */}
          <div className="sticky top-20 self-start max-h-screen overflow-y-auto mb-6">
            <div className="bg-gradient-to-br from-indigo-200 to-purple-400 p-6 rounded-lg shadow-lg text-center">
              {user ? (
                <>
                  <div className="flex justify-center">
                    <img
                      src={
                        user.image || "https://tse1.mm.bing.net/th?id=OIP.MoLuogvKSS_uEhep5nvcuQHaID&pid=Api&P=0&h=180"
                      }
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-300 shadow-md"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "https://tse1.mm.bing.net/th?id=OIP.MoLuogvKSS_uEhep5nvcuQHaID&pid=Api&P=0&h=180"
                      }}
                    />
                  </div>
                  <h3 className="text-2xl font-extrabold text-indigo-900 mt-4">{user.name}</h3>
                  <p className="text-indigo-700 text-sm font-bold mt-1">
                    {user.role === "student"
                      ? `Student at ${user.department || "VIT Bhopal University"}`
                      : user.role === "faculty"
                        ? `Faculty at ${user.department || "VIT Bhopal University"}`
                        : `Alumni from ${user.passedOutBatch || ""} batch`}
                  </p>
                  <p className="text-indigo-600 text-xs font-bold">{user.branch || ""}</p>

                  {user.skills && user.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {user.skills.map((skill, idx) => (
                        <span key={idx} className="bg-indigo-400 text-indigo-900 text-xs px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-indigo-800 font-bold">Log in to see your profile.</p>
              )}
            </div>
          </div>

          {/* Create a Post Section (NOT STICKY) */}
          <div className="bg-gray-700 p-5 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-indigo-100">Create a Post</h3>
            <textarea
              className="w-full bg-indigo-700 border border-indigo-600 rounded-lg p-3 text-indigo-100 mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="What's on your mind?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />

            {/* Image upload section */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-indigo-300 mb-1">Add Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="text-indigo-400 text-sm"
                disabled={selectedImages.length >= 5}
              />
            </div>

            {/* Selected images preview */}
            {selectedImages.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-indigo-300 mb-2">Selected images:</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img.url || "/placeholder.svg"}
                        alt={`Preview ${idx}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={createPost}
              disabled={loading.posts || (!postText.trim() && selectedImages.length === 0)}
              className={`${
                loading.posts || (!postText.trim() && selectedImages.length === 0)
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600"
              } text-white px-4 py-2 mt-3 rounded-lg w-full flex items-center justify-center transition-colors`}
            >
              {loading.posts ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal for adding announcements/achievements */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-indigo-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              Add {modalType === "announcement" ? "Announcement" : "Achievement"}
            </h3>
            <textarea
              className="w-full bg-indigo-700 border border-indigo-600 rounded-lg p-3 text-indigo-100 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder={`Enter ${modalType === "announcement" ? "announcement" : "achievement"} description...`}
              value={modalContent}
              onChange={(e) => setModalContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitModal}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage