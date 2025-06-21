"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProfileHeader from "./ProfileHeader";

const API_BASE_URL = "http://localhost:5005";

const FacultyProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Checking...");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    researchInterests: "",
    about: "",
    stats: { followers: 0, following: 0, posts: 0 },
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");

  const testConnection = async () => {
    try {
      await axios.get(`${API_BASE_URL}/api/test`, { timeout: 5000 });
      setConnectionStatus("Connected");
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("Disconnected");
      return false;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const isConnected = await testConnection();
        if (!isConnected) {
          setError(`Cannot connect to backend at ${API_BASE_URL}`);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { profile } = response.data;

        setProfileData({
          name: profile.name || "",
          email: profile.email || "",
          department: profile.department || "",
          designation: profile.designation || "",
          researchInterests: Array.isArray(profile.researchInterests)
            ? profile.researchInterests.join(", ")
            : profile.researchInterests || "",
          about: profile.about || "",
          stats: profile.stats || { followers: 0, following: 0, posts: 0 },
        });

        if (profile.profilePhotoUrl)
          setProfilePhotoUrl(`${API_BASE_URL}${profile.profilePhotoUrl}`);
        if (profile.coverPhotoUrl)
          setCoverPhotoUrl(`${API_BASE_URL}${profile.coverPhotoUrl}`);
      } catch (error) {
        console.error("Profile fetch error:", error);
        if (error.code === "ERR_NETWORK") {
          setError("Cannot connect to server. Please ensure the backend is running.");
        } else {
          setError("Failed to fetch profile: " + (error.response?.data?.message || error.message));
        }
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    const interval = setInterval(testConnection, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (type, file) => {
    if (type === "profile") setProfilePhoto(file);
    else if (type === "cover") setCoverPhoto(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const isConnected = await testConnection();
      if (!isConnected) {
        setError("Cannot connect to server. Save aborted.");
        return;
      }

      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (profilePhoto) formData.append("profilePhoto", profilePhoto);
      if (coverPhoto) formData.append("coverPhoto", coverPhoto);

      const response = await axios.post(`${API_BASE_URL}/api/profiles/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        alert("Profile saved successfully!");
        const { profile } = response.data;
        if (profile.profilePhotoUrl)
          setProfilePhotoUrl(`${API_BASE_URL}${profile.profilePhotoUrl}`);
        if (profile.coverPhotoUrl)
          setCoverPhotoUrl(`${API_BASE_URL}${profile.coverPhotoUrl}`);
      } else {
        setError("Failed to save profile: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Save error:", error);
      if (error.code === "ERR_NETWORK") {
        setError("Cannot connect to server. Please ensure the backend is up.");
      } else {
        setError("Save failed: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-yellow-100 to-orange-200 text-gray-800">
      <ProfileHeader
        name={profileData.name}
        email={profileData.email}
        stats={profileData.stats}
        editable={true}
        onPhotoChange={handlePhotoChange}
        profilePhotoUrl={profilePhotoUrl}
        coverPhotoUrl={coverPhotoUrl}
      />

      <div className={`text-center py-2 ${connectionStatus === "Connected" ? "bg-green-100" : "bg-red-100"}`}>
        <p className={`text-sm font-medium ${connectionStatus === "Connected" ? "text-green-700" : "text-red-700"}`}>
          Server Status: {connectionStatus} to {API_BASE_URL}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 max-w-xl mx-auto">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="mt-10 p-6 max-w-xl mx-auto bg-white rounded-xl shadow-xl transform transition duration-500 hover:scale-105">
        <div className="space-y-6">
          {[
            { label: "Department", name: "department" },
            { label: "Designation", name: "designation" },
            { label: "Research Interests", name: "researchInterests", textarea: true },
            { label: "About", name: "about", textarea: true },
          ].map(({ label, name, textarea }) => (
            <div key={name}>
              <label className="block text-xl font-medium text-yellow-600 mb-2">{label}</label>
              {textarea ? (
                <textarea
                  rows="3"
                  name={name}
                  value={profileData[name]}
                  onChange={handleChange}
                  className="w-full p-3 border border-yellow-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                ></textarea>
              ) : (
                <input
                  type="text"
                  name={name}
                  value={profileData[name]}
                  onChange={handleChange}
                  className="w-full p-3 border border-yellow-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              )}
            </div>
          ))}

          <div className="flex justify-center mt-8">
            <button
              onClick={handleSave}
              disabled={saving || connectionStatus !== "Connected"}
              className={`px-8 py-3 text-white font-semibold rounded-full shadow-lg focus:outline-none focus:ring-4 transition duration-300 ${
                connectionStatus === "Connected"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:bg-gradient-to-l focus:ring-yellow-300"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? "Saving..." : connectionStatus !== "Connected" ? "Server Disconnected" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfile;
