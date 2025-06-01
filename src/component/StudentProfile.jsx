// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import ProfileHeader from './ProfileHeader';

// // Set base URL for API requests
// const API_BASE_URL = 'http://localhost:5005'; // Make sure this matches your backend server port

// const StudentProfile = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState(null);
//   const [profileData, setProfileData] = useState({
//     name: "",
//     email: "",
//     branch: "Computer Science and Engineering",
//     yearOfStudy: "Third Year",
//     skills: "Java, React, Node.js",
//     resumeLink: "drive.google.com/ritika-resume",
//     about: "",
//     stats: { followers: 0, following: 0, posts: 0 }
//   });

//   const [profilePhoto, setProfilePhoto] = useState(null);
//   const [coverPhoto, setCoverPhoto] = useState(null);
//   const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
//   const [coverPhotoUrl, setCoverPhotoUrl] = useState("");

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const token = localStorage.getItem("token");
//         if (!token) {
//           navigate("/login");
//           return;
//         }

//         console.log("Fetching profile data...");
        
//         // Fetch profile data
//         const response = await axios.get(`${API_BASE_URL}/api/profiles/me`, {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });

//         console.log("Profile data received:", response.data);
        
//         const { profile } = response.data;
        
//         setProfileData({
//           name: profile.name || "",
//           email: profile.email || "",
//           branch: profile.branch || "Computer Science and Engineering",
//           yearOfStudy: profile.yearOfStudy || "Third Year",
//           skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "Java, React, Node.js",
//           resumeLink: profile.resumeLink || "drive.google.com/ritika-resume",
//           about: profile.about || "",
//           stats: profile.stats || { followers: 0, following: 0, posts: 0 }
//         });

//         if (profile.profilePhotoUrl) {
//           setProfilePhotoUrl(`${API_BASE_URL}${profile.profilePhotoUrl}`);
//         }

//         if (profile.coverPhotoUrl) {
//           setCoverPhotoUrl(`${API_BASE_URL}${profile.coverPhotoUrl}`);
//         }
//       } catch (error) {
//         console.error("Error fetching profile:", error);
//         setError("Failed to load profile data. Please try again later.");
        
//         if (error.response && error.response.status === 401) {
//           localStorage.removeItem("token");
//           navigate("/login");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setProfileData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handlePhotoChange = (type, file) => {
//     if (type === "profile") {
//       setProfilePhoto(file);
//     } else if (type === "cover") {
//       setCoverPhoto(file);
//     }
//   };

//   const handleSave = async () => {
//     try {
//       setSaving(true);
//       setError(null);
      
//       const token = localStorage.getItem("token");
//       if (!token) {
//         navigate("/login");
//         return;
//       }

//       const formData = new FormData();
//       formData.append("name", profileData.name);
//       formData.append("email", profileData.email);
//       formData.append("branch", profileData.branch);
//       formData.append("yearOfStudy", profileData.yearOfStudy);
//       formData.append("skills", profileData.skills);
//       formData.append("resumeLink", profileData.resumeLink);
//       formData.append("about", profileData.about);

//       if (profilePhoto) {
//         formData.append("profilePhoto", profilePhoto);
//       }

//       if (coverPhoto) {
//         formData.append("coverPhoto", coverPhoto);
//       }

//       console.log("Sending profile update request");
      
//       const response = await axios.post(`${API_BASE_URL}/api/profiles/update`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data'
//         }
//       });

//       console.log("Profile update response:", response.data);
      
//       if (response.data.success) {
//         alert("Profile saved successfully!");
        
//         // Update URLs if provided in response
//         if (response.data.profile.profilePhotoUrl) {
//           setProfilePhotoUrl(`${API_BASE_URL}${response.data.profile.profilePhotoUrl}`);
//         }
        
//         if (response.data.profile.coverPhotoUrl) {
//           setCoverPhotoUrl(`${API_BASE_URL}${response.data.profile.coverPhotoUrl}`);
//         }
//       } else {
//         setError("Failed to save profile: " + (response.data.message || "Unknown error"));
//       }
//     } catch (error) {
//       console.error("Error saving profile:", error);
//       setError("Failed to save profile: " + (error.response?.data?.message || error.message));
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//         <p className="ml-2">Loading profile...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-r from-green-100 to-blue-200 text-gray-800 font-sans">
//       <ProfileHeader
//         name={profileData.name}
//         email={profileData.email}
//         stats={profileData.stats}
//         editable={true}
//         onPhotoChange={handlePhotoChange}
//         profilePhotoUrl={profilePhotoUrl}
//         coverPhotoUrl={coverPhotoUrl}
//       />

//       {/* Error message */}
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 mx-auto max-w-xl" role="alert">
//           <strong className="font-bold">Error: </strong>
//           <span className="block sm:inline">{error}</span>
//         </div>
//       )}

//       {/* Form Section */}
//       <div className="mt-10 p-6 max-w-xl mx-auto bg-white rounded-xl shadow-xl transform transition duration-500 hover:scale-105">
//         <div className="space-y-6">
//           <div>
//             <label className="block text-xl font-medium text-green-600 mb-2">Branch</label>
//             <input
//               type="text"
//               name="branch"
//               value={profileData.branch}
//               onChange={handleChange}
//               className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
//             />
//           </div>
//           <div>
//             <label className="block text-xl font-medium text-green-600 mb-2">Year of Study</label>
//             <input
//               type="text"
//               name="yearOfStudy"
//               value={profileData.yearOfStudy}
//               onChange={handleChange}
//               className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
//             />
//           </div>
//           <div>
//             <label className="block text-xl font-medium text-green-600 mb-2">Skills</label>
//             <input
//               type="text"
//               name="skills"
//               value={profileData.skills}
//               onChange={handleChange}
//               className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
//             />
//           </div>
//           <div>
//             <label className="block text-xl font-medium text-green-600 mb-2">Resume Link</label>
//             <input
//               type="text"
//               name="resumeLink"
//               value={profileData.resumeLink}
//               onChange={handleChange}
//               className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
//             />
//           </div>
//           <div>
//             <label className="block text-xl font-medium text-green-600 mb-2">About</label>
//             <textarea
//               name="about"
//               value={profileData.about}
//               onChange={handleChange}
//               className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
//               rows="4"
//             />
//           </div>

//           {/* Save Button */}
//           <div className="flex justify-center mt-8">
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:bg-gradient-to-l focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-300"
//             >
//               {saving ? "Saving..." : "Save"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StudentProfile;
  

"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import ProfileHeader from "./ProfileHeader"

// Set base URL for API requests - this should match your backend server
const API_BASE_URL = "http://localhost:5005" // This must match your backend PORT in .env

const StudentProfile = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("Checking...")
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    branch: "Computer Science and Engineering",
    yearOfStudy: "Third Year",
    skills: "Java, React, Node.js",
    resumeLink: "drive.google.com/ritika-resume",
    about: "",
    stats: { followers: 0, following: 0, posts: 0 },
  })

  const [profilePhoto, setProfilePhoto] = useState(null)
  const [coverPhoto, setCoverPhoto] = useState(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("")
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("")

  // Test connection to backend
  const testConnection = async () => {
    try {
      await axios.get(`${API_BASE_URL}/api/test`, { timeout: 5000 })
      setConnectionStatus("Connected")
      return true
    } catch (error) {
      console.error("Connection test failed:", error)
      setConnectionStatus("Disconnected")
      return false
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token")
        if (!token) {
          navigate("/login")
          return
        }

        console.log("Testing connection to backend...")
        const isConnected = await testConnection()

        if (!isConnected) {
          setError("Cannot connect to the server. Please make sure the backend is running at " + API_BASE_URL)
          setLoading(false)
          return
        }

        console.log("Fetching profile data...")
        const response = await axios.get(`${API_BASE_URL}/api/profiles/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("Profile data received:", response.data)

        const { profile } = response.data

        setProfileData({
          name: profile.name || "",
          email: profile.email || "",
          branch: profile.branch || "Computer Science and Engineering",
          yearOfStudy: profile.yearOfStudy || "Third Year",
          skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "Java, React, Node.js",
          resumeLink: profile.resumeLink || "drive.google.com/ritika-resume",
          about: profile.about || "",
          stats: profile.stats || { followers: 0, following: 0, posts: 0 },
        })

        if (profile.profilePhotoUrl) {
          setProfilePhotoUrl(`${API_BASE_URL}${profile.profilePhotoUrl}`)
        }

        if (profile.coverPhotoUrl) {
          setCoverPhotoUrl(`${API_BASE_URL}${profile.coverPhotoUrl}`)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)

        if (error.code === "ERR_NETWORK") {
          setError(
            "Network error: Cannot connect to the server. Please make sure the backend is running at " + API_BASE_URL,
          )
        } else {
          setError("Failed to load profile data: " + (error.response?.data?.message || error.message))
        }

        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token")
          navigate("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    // Set up periodic connection testing
    const connectionInterval = setInterval(testConnection, 10000)
    return () => clearInterval(connectionInterval)
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePhotoChange = (type, file) => {
    if (type === "profile") {
      setProfilePhoto(file)
    } else if (type === "cover") {
      setCoverPhoto(file)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      // Test connection before saving
      const isConnected = await testConnection()
      if (!isConnected) {
        setError("Cannot connect to the server. Please make sure the backend is running at " + API_BASE_URL)
        setSaving(false)
        return
      }

      const formData = new FormData()
      formData.append("name", profileData.name)
      formData.append("email", profileData.email)
      formData.append("branch", profileData.branch)
      formData.append("yearOfStudy", profileData.yearOfStudy)
      formData.append("skills", profileData.skills)
      formData.append("resumeLink", profileData.resumeLink)
      formData.append("about", profileData.about)

      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto)
      }

      if (coverPhoto) {
        formData.append("coverPhoto", coverPhoto)
      }

      console.log("Sending profile update request")

      const response = await axios.post(`${API_BASE_URL}/api/profiles/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Profile update response:", response.data)

      if (response.data.success) {
        alert("Profile saved successfully!")

        // Update URLs if provided in response
        if (response.data.profile.profilePhotoUrl) {
          setProfilePhotoUrl(`${API_BASE_URL}${response.data.profile.profilePhotoUrl}`)
        }

        if (response.data.profile.coverPhotoUrl) {
          setCoverPhotoUrl(`${API_BASE_URL}${response.data.profile.coverPhotoUrl}`)
        }
      } else {
        setError("Failed to save profile: " + (response.data.message || "Unknown error"))
      }
    } catch (error) {
      console.error("Error saving profile:", error)

      if (error.code === "ERR_NETWORK") {
        setError(
          "Network error: Cannot connect to the server. Please make sure the backend is running at " + API_BASE_URL,
        )
      } else {
        setError("Failed to save profile: " + (error.response?.data?.message || error.message))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-100 to-blue-200 text-gray-800 font-sans">
      <ProfileHeader
        name={profileData.name}
        email={profileData.email}
        stats={profileData.stats}
        editable={true}
        onPhotoChange={handlePhotoChange}
        profilePhotoUrl={profilePhotoUrl}
        coverPhotoUrl={coverPhotoUrl}
      />

      {/* Connection Status */}
      <div className={`text-center py-2 ${connectionStatus === "Connected" ? "bg-green-100" : "bg-red-100"}`}>
        <p className={`text-sm font-medium ${connectionStatus === "Connected" ? "text-green-700" : "text-red-700"}`}>
          Server Status: {connectionStatus} to {API_BASE_URL}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 mx-auto max-w-xl"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Form Section */}
      <div className="mt-10 p-6 max-w-xl mx-auto bg-white rounded-xl shadow-xl transform transition duration-500 hover:scale-105">
        <div className="space-y-6">
          <div>
            <label className="block text-xl font-medium text-green-600 mb-2">Branch</label>
            <input
              type="text"
              name="branch"
              value={profileData.branch}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
            />
          </div>
          <div>
            <label className="block text-xl font-medium text-green-600 mb-2">Year of Study</label>
            <input
              type="text"
              name="yearOfStudy"
              value={profileData.yearOfStudy}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
            />
          </div>
          <div>
            <label className="block text-xl font-medium text-green-600 mb-2">Skills</label>
            <input
              type="text"
              name="skills"
              value={profileData.skills}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
            />
          </div>
          <div>
            <label className="block text-xl font-medium text-green-600 mb-2">Resume Link</label>
            <input
              type="text"
              name="resumeLink"
              value={profileData.resumeLink}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
            />
          </div>
          <div>
            <label className="block text-xl font-medium text-green-600 mb-2">About</label>
            <textarea
              name="about"
              value={profileData.about}
              onChange={handleChange}
              className="w-full p-3 border border-green-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-200"
              rows="4"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSave}
              disabled={saving || connectionStatus !== "Connected"}
              className={`px-8 py-3 text-white font-semibold rounded-full shadow-lg focus:outline-none focus:ring-4 transition duration-300 ${
                connectionStatus === "Connected"
                  ? "bg-gradient-to-r from-green-500 to-blue-500 hover:bg-gradient-to-l focus:ring-green-300"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? "Saving..." : connectionStatus !== "Connected" ? "Server Disconnected" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentProfile
