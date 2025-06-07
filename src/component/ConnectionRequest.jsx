// "use client"

// const ConnectionRequest = ({ request, onAccept, onReject }) => {
//   const { follower } = request

//   // Format role for display
//   const formatRole = (role) => {
//     return role.charAt(0).toUpperCase() + role.slice(1)
//   }

//   return (
//     <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
//       <div className="flex items-center space-x-3">
//         {/* Profile Image */}
//         <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
//           <img
//             src={follower.profilePhotoUrl || "/default-profile.jpg"}
//             alt={`${follower.name}'s profile`}
//             className="w-full h-full object-cover"
//             onError={(e) => {
//               e.target.onerror = null
//               e.target.src = "/default-profile.jpg"
//             }}
//           />
//         </div>

//         {/* User Info */}
//         <div>
//           <h3 className="font-medium text-gray-800">{follower.name}</h3>
//           <p className="text-sm text-gray-600">{formatRole(follower.role)}</p>
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="flex space-x-2">
//         <button
//           onClick={onAccept}
//           className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
//         >
//           Accept
//         </button>
//         <button
//           onClick={onReject}
//           className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
//         >
//           Ignore
//         </button>
//       </div>
//     </div>
//   )
// }

// export default ConnectionRequest
//new
"use client";

const ConnectionRequest = ({ request, onAccept, onReject }) => {
  const { requester } = request;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-4">
        <img
          className="h-10 w-10 rounded-full object-cover"
          src={requester.profilePhotoUrl || "/default-profile.jpg"}
          alt={requester.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/default-profile.jpg";
          }}
        />
        <div>
          <p className="text-sm font-medium text-gray-900">{requester.name}</p>
          <p className="text-sm text-gray-500">
            {requester.role.charAt(0).toUpperCase() + requester.role.slice(1)}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onAccept}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default ConnectionRequest;