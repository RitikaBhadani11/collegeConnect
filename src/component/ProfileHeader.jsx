import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from "./Navbar";
import { useUser } from '../contexts/UserContext';

const ProfileHeader = ({
  name,
  email,
  stats = { connections: 0, posts: 0 },
  editable,
  onPhotoChange,
  profilePhotoUrl,
  coverPhotoUrl,
  onConnectionsUpdate // NEW
}) => {

  const { user } = useUser();
  const token = localStorage.getItem('token');

  const [showConnections, setShowConnections] = useState(false);
  const [profileStats, setProfileStats] = useState(stats);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Initialize with props.stats
  useEffect(() => {
    setProfileStats(stats);
  }, [stats]);

  const fetchConnections = async () => {
  try {
    setLoadingConnections(true);
    const response = await axios.get(`http://localhost:5005/api/profiles/${user._id}/connections`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setConnections(response.data.connections);
    setProfileStats(prev => ({
      ...prev,
      connections: response.data.connections.length
    }));

    // 🟢 Update parent
    if (onConnectionsUpdate) {
      onConnectionsUpdate(response.data.connections.length);
    }
  } catch (error) {
    console.error('Error fetching connections:', error);
  } finally {
    setLoadingConnections(false);
  }
};


  const removeConnection = async (connectionId) => {
    try {
      await axios.delete(`http://localhost:5005/api/profiles/connections/${connectionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Update local state
      setConnections(prev => prev.filter(conn => conn._id !== connectionId));
      setProfileStats(prev => ({
        ...prev,
        connections: prev.connections - 1
      }));
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const toggleConnections = () => {
    setShowConnections(prev => !prev);
  };

  useEffect(() => {
    if (showConnections) {
      fetchConnections();
    }
  }, [showConnections]);

  useEffect(() => {
    if (coverPhotoUrl) setCoverPhoto(coverPhotoUrl);
    if (profilePhotoUrl) setProfilePhoto(profilePhotoUrl);
  }, [coverPhotoUrl, profilePhotoUrl]);

  const handleCoverUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverPhoto(URL.createObjectURL(file));
      if (onPhotoChange) onPhotoChange("cover", file);
    }
  };

  const handleProfileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(URL.createObjectURL(file));
      if (onPhotoChange) onPhotoChange("profile", file);
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative w-full bg-gradient-to-r from-blue-100 to-indigo-200 text-gray-800 pb-16">
        {/* Cover Photo */}
        <div className="w-full h-64 bg-gray-300 relative">
          {coverPhoto ? (
            <div className="w-full h-full relative">
              <img
                src={coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
                draggable="false"
              />
              {editable && (
                <div className="absolute bottom-2 right-2">
                  <label htmlFor="coverUpload" className="bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full cursor-pointer shadow-md">
                    📷
                  </label>
                  <input
                    id="coverUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-600">
              {editable ? (
                <label htmlFor="coverUpload" className="cursor-pointer">Click to upload cover photo</label>
              ) : (
                <div>No cover photo</div>
              )}
              {editable && (
                <input
                  id="coverUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              )}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 px-6">
          <div className="relative -mt-20">
            <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-white shadow-lg">
              {profilePhoto ? (
                <div className="relative w-full h-full">
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                  {editable && (
                    <div className="absolute bottom-0 right-0 p-2">
                      <label htmlFor="profileUpload" className="bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full cursor-pointer shadow-md">
                        📷
                      </label>
                      <input
                        id="profileUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-white">
                  {editable ? (
                    <label htmlFor="profileUpload" className="cursor-pointer">Upload</label>
                  ) : (
                    <div>No profile photo</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-indigo-700">{name}</h1>
              <p className="text-gray-600">{email}</p>
            </div>
            <div className="flex gap-8 justify-center md:justify-start mt-4">
              <div className="text-center cursor-pointer hover:text-indigo-800 transition-colors" onClick={toggleConnections}>
                <h2 className="text-xl font-semibold text-indigo-600">{profileStats.connections}</h2>
                <p className="text-gray-500">Connections</p>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-indigo-600">{profileStats.posts}</h2>
                <p className="text-gray-500">Posts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connections Modal */}
      {showConnections && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Your Connections ({connections.length})
              </h3>
              <button onClick={toggleConnections} className="text-gray-500 hover:text-gray-700">
                ❌
              </button>
            </div>
            <div className="p-4">
              {loadingConnections ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : connections.length > 0 ? (
                <ul className="space-y-3">
                  {connections.map((connection) => (
                    <li key={connection._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          {connection.user.profilePhoto && (
                            <img
                              src={connection.user.profilePhoto}
                              alt={connection.user.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{connection.user.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{connection.user.role}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeConnection(connection._id)} 
                        className="text-red-500 hover:text-red-700 p-1" 
                        title="Remove connection"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-4">No connections yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileHeader;