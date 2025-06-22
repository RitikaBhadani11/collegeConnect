const ConnectionRequest = ({ request, profilePhotoUrl, onAccept, onReject }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border rounded shadow-sm">
      <div className="flex items-center gap-4">
        <img
          src={profilePhotoUrl}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <p className="text-gray-800 font-medium">{request.requester.name}</p>
          <p className="text-gray-500 text-sm">{request.requester.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default ConnectionRequest;
