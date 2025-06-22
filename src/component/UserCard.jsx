"use client";

import { useState } from "react";
import ViewProfile from "./ViewProfile";

const UserCard = ({ user, onFollow }) => {
  const [showProfile, setShowProfile] = useState(false);

  const getProfilePhoto = () => {
    if (user?.profilePhotoUrl) {
      return user.profilePhotoUrl.startsWith("http")
        ? user.profilePhotoUrl
        : `http://localhost:5005${user.profilePhotoUrl}`;
    }
    return "/default-profile.jpg";
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-center">
          <div className="relative w-12 h-12 flex-shrink-0">
            <img
              src={getProfilePhoto()}
              alt={user?.name || "User"}
              className="w-full h-full rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-profile.jpg";
              }}
            />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-800">
              {user?.name || "Unnamed User"}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {user?.role || "User"}
            </p>
          </div>
        </div>

        {user?.batch && (
          <p className="text-sm text-gray-500 mt-2">Batch: {user.batch}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            View Profile
          </button>
          <button
            onClick={() => onFollow(user._id)}
            className={`flex-1 px-3 py-2 rounded-md ${
              user?.requestSent
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            disabled={user?.requestSent}
          >
            {user?.requestSent ? "Request Sent" : "Connect"}
          </button>
        </div>
      </div>

      {showProfile && user?._id && (
        <ViewProfile userId={user._id} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default UserCard;
