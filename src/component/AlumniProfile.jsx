import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileHeader from './ProfileHeader';

const API_BASE_URL = 'http://localhost:5005';

const AlumniProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    currentJobTitle: "",
    company: "",
    graduationYear: "",
    skills: "",
    linkedinProfile: "",
    about: "",
    stats: { followers: 0, following: 0, posts: 0, connections: 0 },
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { profile } = response.data;

        setProfileData({
          name: profile.name || "",
          email: profile.email || "",
          currentJobTitle: profile.currentJobTitle || "",
          company: profile.company || "",
          graduationYear: profile.graduationYear || "",
          skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : (profile.skills || ""),
          linkedinProfile: profile.linkedinProfile || "",
          about: profile.about || "",
          stats: profile.stats || { followers: 0, following: 0, posts: 0, connections: 0 },
        });

        if (profile.profilePhotoUrl) {
          setProfilePhotoUrl(`${API_BASE_URL}${profile.profilePhotoUrl}`);
        }

        if (profile.coverPhotoUrl) {
          setCoverPhotoUrl(`${API_BASE_URL}${profile.coverPhotoUrl}`);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile. Please check server connection.");
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
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
        alert("Profile updated successfully!");
        const { profile } = response.data;
        if (profile.profilePhotoUrl) setProfilePhotoUrl(`${API_BASE_URL}${profile.profilePhotoUrl}`);
        if (profile.coverPhotoUrl) setCoverPhotoUrl(`${API_BASE_URL}${profile.coverPhotoUrl}`);
      } else {
        setError("Failed to save profile: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Save error:", error);
      setError("Save failed: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-indigo-300 text-gray-800">
      <ProfileHeader
        name={profileData.name}
        email={profileData.email}
        stats={profileData.stats}
        editable={true}
        onPhotoChange={handlePhotoChange}
        profilePhotoUrl={profilePhotoUrl}
        coverPhotoUrl={coverPhotoUrl}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mx-auto max-w-xl">
          <strong className="font-bold">Error:</strong>
          <span className="ml-1">{error}</span>
        </div>
      )}

      <div className="mt-8 p-8 max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl">
        <div className="space-y-6">
          {[
            "currentJobTitle",
            "company",
            "graduationYear",
            "skills",
            "linkedinProfile",
            "about"
          ].map((field) => (
            <div key={field}>
              <label className="block text-xl font-bold text-indigo-700 mb-2 capitalize">
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              {field === "about" ? (
                <textarea
                  name={field}
                  value={profileData[field]}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-3 border border-indigo-300 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                ></textarea>
              ) : (
                <input
                  type="text"
                  name={field}
                  value={profileData[field]}
                  onChange={handleChange}
                  className="w-full p-3 border border-indigo-300 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              )}
            </div>
          ))}

          <div className="flex justify-center mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold rounded-full shadow-xl hover:bg-gradient-to-l focus:outline-none focus:ring-4 focus:ring-indigo-300 transform transition hover:scale-105"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniProfile;
