"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import Navbar from "../component/Navbar";
import UserCard from "../component/UserCard";
import ConnectionRequest from "../component/ConnectionRequest";

const ConnectPeople = () => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState({
    suggestions: true,
    requests: true,
    search: false,
  });

  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: token,
    },
  };

  const isSearching = searchQuery.trim().length > 0;

  const fetchConnectionRequests = async () => {
    try {
      setLoading((prev) => ({ ...prev, requests: true }));
      const res = await axios.get("http://localhost:5005/api/users/requests", config);
      setConnectionRequests(res.data.requests || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading((prev) => ({ ...prev, requests: false }));
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      setLoading((prev) => ({ ...prev, suggestions: true }));
      const res = await axios.get("http://localhost:5005/api/users/suggested", config);
      setSuggestedUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoading((prev) => ({ ...prev, suggestions: false }));
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading((prev) => ({ ...prev, search: true }));
      const res = await axios.get(
        `http://localhost:5005/api/users/search?query=${searchQuery}`,
        config
      );
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  const handleFollow = async (userId) => {
    try {
      await axios.post(
        `http://localhost:5005/api/users/follow/${userId}`,
        {},
        config
      );

      if (isSearching) {
        setSearchResults((prev) => prev.filter((u) => u._id !== userId));
      } else {
        setSuggestedUsers((prev) => prev.filter((u) => u._id !== userId));
      }
    } catch (err) {
      console.error("Error sending follow request:", err);
    }
  };

  const handleRequestResponse = async (requestId, action) => {
    try {
      await axios.put(
        `http://localhost:5005/api/users/request/${requestId}`,
        { action },
        config
      );

      setConnectionRequests((prev) => prev.filter((r) => r._id !== requestId));

      if (action === "accept") {
        fetchSuggestedUsers();
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    if (user) {
      fetchConnectionRequests();
      fetchSuggestedUsers();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Find & Connect with People
        </h1>

        {/* Search Bar */}
        <div className="mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchUsers();
            }}
            className="flex w-full max-w-3xl mx-auto"
          >
            <input
              type="text"
              placeholder="Search users..."
              className="flex-grow px-4 py-3 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-colors"
              disabled={loading.search}
            >
              {loading.search ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Search Results</h2>
              <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800">
                Clear Results
              </button>
            </div>

            {loading.search ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    profilePhotoUrl={
                      user.profile?.profilePhotoUrl || "/default-profile.jpg"
                    }
                    onFollow={() => handleFollow(user._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-600">No users found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* Requests & Suggestions */}
        {!isSearching && (
          <div className="space-y-10">
            {/* Connection Requests */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Connection Requests</h2>

              {loading.requests ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading requests...</p>
                </div>
              ) : connectionRequests.length > 0 ? (
                <div className="space-y-4">
                  {connectionRequests.map((request) => (
                  <ConnectionRequest
  key={request._id}
  request={request}
  profilePhotoUrl={
    request.requester?.profilePhotoUrl || "/default-profile.jpg"
  }
                      onAccept={() => handleRequestResponse(request._id, "accept")}
                      onReject={() => handleRequestResponse(request._id, "reject")}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">You don't have any pending connection requests.</p>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                People You May Know
              </h2>

              {loading.suggestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading suggestions...</p>
                </div>
              ) : suggestedUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestedUsers.map((user) => (
                    <UserCard
                      key={user._id}
                      user={user}
                      profilePhotoUrl={
                        user.profile?.profilePhotoUrl || "/default-profile.jpg"
                      }
                      onFollow={() => handleFollow(user._id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No suggestions available at the moment.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectPeople;
