// "use client"
// import { useState } from "react"
// import { Link } from "react-router-dom"

// const UserCard = ({ user, onFollow, isFollowing = false }) => {
//   const [followState, setFollowState] = useState(isFollowing ? "Following" : "Connect")
  
//   const getRoleBadgeColor = (role) => {
//     switch (role) {
//       case "student":
//         return "bg-blue-200 text-blue-900"
//       case "faculty":
//         return "bg-purple-200 text-purple-900"
//       case "alumni":
//         return "bg-green-200 text-green-900"
//       default:
//         return "bg-gray-300 text-gray-700"
//     }
//   }

//   const formatRole = (role) => {
//     return role.charAt(0).toUpperCase() + role.slice(1)
//   }

//   const getAdditionalInfo = (user) => {
//     switch (user.role) {
//       case "student":
//         return user.batch ? `Batch: ${user.batch}` : ""
//       case "faculty":
//         return user.department ? `Dept: ${user.department}` : ""
//       case "alumni":
//         return user.company ? `Company: ${user.company}` : ""
//       default:
//         return ""
//     }
//   }
  
//   const handleFollow = () => {
//     if (followState === "Connect") {
//       setFollowState("Requested")
//       onFollow(user._id)
//     }
//   }

//   return (
//     <div className="bg-gray-400 rounded-2xl shadow-lg overflow-hidden transition-transform hover:shadow-xl hover:-translate-y-1 duration-200">
//       <div className="p-5 flex flex-col items-center">
//         {/* Profile Image */}
//         <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300 mb-4 shadow-sm">
//           <img
//             src={user.profilePhotoUrl || "https://tse1.mm.bing.net/th?id=OIP.4j4jNaPU3bIzDJHBj6HDSwHaHa&pid=Api&rs=1&c=1&qlt=95&w=120&h=120"}
//             alt={`${user.name}'s profile`}
//             className="w-full h-full object-cover"
//             onError={(e) => {
//               e.target.onerror = null
//               e.target.src = "https://tse1.mm.bing.net/th?id=OIP.4j4jNaPU3bIzDJHBj6HDSwHaHa&pid=Api&rs=1&c=1&qlt=95&w=120&h=120"
//             }}
//           />
//         </div>

//         {/* User Info */}
//         <h3 className="font-semibold text-xl text-gray-800">{user.name}</h3>

//         {/* Role Badge */}
//         <span className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getRoleBadgeColor(user.role)}`}>
//           {formatRole(user.role)}
//         </span>

//         {/* Additional Info */}
//         <p className="text-gray-900 text-sm mt-2 italic">{getAdditionalInfo(user)}</p>

//         {/* Actions */}
//         <div className="mt-5 flex space-x-3 w-full">
//           <Link
//             to={`/profile/${user._id}`}
//             className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium text-center hover:bg-gray-400 transition"
//           >
//             View Profile
//           </Link>
//           <button
//             onClick={handleFollow}
//             className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
//               followState === "Following" 
//                 ? "bg-green-500 text-white hover:bg-green-600" 
//                 : followState === "Requested"
//                 ? "bg-yellow-500 text-white hover:bg-yellow-600"
//                 : "bg-blue-500 text-white hover:bg-blue-600"
//             }`}
//           >
//             {followState}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default UserCard
//new
// "use client";

// const UserCard = ({ user, onFollow }) => {
//   return (
//     <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
//       <div className="p-4">
//         <div className="flex items-center space-x-4">
//           <div className="flex-shrink-0">
//             <img
//               className="h-12 w-12 rounded-full object-cover"
//               src={user.profilePhotoUrl || "/default-profile.jpg"}
//               alt={user.name}
//               onError={(e) => {
//                 e.target.onerror = null;
//                 e.target.src = "/default-profile.jpg";
//               }}
//             />
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-sm font-medium text-gray-900 truncate">
//               {user.name}
//             </p>
//             <p className="text-sm text-gray-500 truncate">
//               {user.role === "student" ? user.batch : user.department}
//             </p>
//           </div>
//         </div>
//       </div>
//       <div className="bg-gray-50 px-4 py-3 flex justify-end">
//         <button
//           onClick={() => onFollow(user._id)}
//           className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-700 active:bg-blue-700 transition duration-150 ease-in-out"
//         >
//           Connect
//         </button>
//       </div>
//     </div>
//   );
// };

// export default UserCard;"use client";

import { useState } from "react";
import ViewProfile from "./ViewProfile";

const UserCard = ({ user, onFollow }) => {
  const [showProfile, setShowProfile] = useState(false);

  const name = user?.name || "Unnamed User";
  const role = user?.role || "User";
  const profilePhoto = user?.profilePhotoUrl || user?.profilePhoto || "/default-profile.jpg";
  const batch = user?.batch;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        {/* Profile Info */}
        <div className="flex items-center">
          <img
            src={profilePhoto}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="ml-3">
            <h3 className="font-semibold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-600 capitalize">{role}</p>
          </div>
        </div>

        {/* Optional Batch Display */}
        {batch && (
          <p className="text-sm text-gray-500 mt-2">Batch: {batch}</p>
        )}

        {/* Actions */}
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

      {/* View Profile Modal */}
      {showProfile && user?._id && (
        <ViewProfile userId={user._id} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default UserCard;
