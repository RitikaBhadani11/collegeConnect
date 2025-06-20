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