import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from "./Navbar";
import { useUser } from '../contexts/UserContext';

const backendUrl = "http://localhost:5005";

const ProfileHeader = ({
  name,
  email,
  stats = { connections: 0, posts: 0 },
  editable,
  onPhotoChange,
  profilePhotoUrl,
  coverPhotoUrl,
  onConnectionsUpdate
}) => {
  const { user } = useUser();
  const token = localStorage.getItem('token');

  const [showConnections, setShowConnections] = useState(false);
  const [profileStats, setProfileStats] = useState(stats);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    setProfileStats(stats);
  }, [stats]);

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const response = await axios.get(`${backendUrl}/api/profiles/${user._id}/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(response.data.connections);
      setProfileStats(prev => ({ ...prev, connections: response.data.connections.length }));
      onConnectionsUpdate?.(response.data.connections.length);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const removeConnection = async (connectionId) => {
    try {
      await axios.delete(`${backendUrl}/api/profiles/connections/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(prev => prev.filter(conn => conn._id !== connectionId));
      setProfileStats(prev => ({ ...prev, connections: prev.connections - 1 }));
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const toggleConnections = () => setShowConnections(prev => !prev);

  useEffect(() => {
    if (showConnections) fetchConnections();
  }, [showConnections]);

  useEffect(() => {
    if (profilePhotoUrl) {
      setProfilePhoto(profilePhotoUrl.startsWith("/uploads") ? `${backendUrl}${profilePhotoUrl}` : profilePhotoUrl);
    }
    if (coverPhotoUrl) {
      setCoverPhoto(coverPhotoUrl.startsWith("/uploads") ? `${backendUrl}${coverPhotoUrl}` : coverPhotoUrl);
    }
  }, [coverPhotoUrl, profilePhotoUrl]);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPhoto(URL.createObjectURL(file));
      onPhotoChange?.("cover", file);
    }
  };

  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(URL.createObjectURL(file));
      onPhotoChange?.("profile", file);
    }
  };

  return (
    <>
      <Navbar />
      <div className="relative w-full bg-white text-gray-800 pb-16 shadow-sm">
        {/* Cover Photo */}
        <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
          {coverPhoto ? (
            <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" draggable="false" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          )}
          {editable && (
            <div className="absolute bottom-4 right-4">
              <label htmlFor="coverUpload" className="flex items-center gap-2 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg shadow-md cursor-pointer text-sm font-medium transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Change Cover
              </label>
              <input id="coverUpload" type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                <img src={profilePhoto || "/default-profile.png"} alt="Profile" className="w-full h-full object-cover" draggable="false" />
              </div>
              {editable && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <label htmlFor="profileUpload" className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </label>
                  <input id="profileUpload" type="file" accept="image/*" onChange={handleProfileUpload} className="hidden" />
                </div>
              )}
            </div>

            <div className="text-center md:text-left flex-1 mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{name}</h1>
              <p className="text-gray-600 mt-1">{email}</p>
              <div className="flex gap-8 justify-center md:justify-start mt-6">
                <div className="text-center cursor-pointer hover:text-indigo-700 transition-colors duration-200" onClick={toggleConnections}>
                  <h2 className="text-2xl font-bold text-indigo-600">{profileStats.connections}</h2>
                  <p className="text-sm text-gray-500">Connections</p>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-indigo-600">{profileStats.posts}</h2>
                  <p className="text-sm text-gray-500">Posts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connections Modal */}
      {showConnections && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh]">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-xl font-semibold text-gray-800">Your Connections</h3>
              <button onClick={toggleConnections} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[65vh]">
              {loadingConnections ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : connections.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {connections.map((connection) => (
                    <li key={connection._id} className="py-4 hover:bg-gray-50 px-2 rounded-lg transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={connection.user.profilePhotoUrl ? `${backendUrl}${connection.user.profilePhotoUrl}` : "/default-profile.png"}
                            alt={connection.user.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{connection.user.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{connection.user.role}</p>
                          </div>
                        </div>
                        <button onClick={() => removeConnection(connection._id)} className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2" title="Remove connection">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h4 className="mt-4 text-lg font-medium text-gray-700">No connections yet</h4>
                  <p className="mt-1 text-gray-500">Start connecting with other users to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileHeader;
