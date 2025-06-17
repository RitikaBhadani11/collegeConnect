import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { FiMessageCircle, FiUserPlus, FiLink, FiX, FiMapPin, FiBriefcase, FiBook, FiAward } from "react-icons/fi";
import { FaGraduationCap, FaUniversity, FaRegBuilding } from "react-icons/fa";
import { RiContactsBookLine } from "react-icons/ri";

const ViewProfile = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5005/api/profile/${userId}`, {
          headers: {
            Authorization: token,
          },
        });
        setProfile(res.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchProfile();
  }, [userId]);

  const handleMessageClick = () => {
    navigate(`/chat?userId=${userId}`);
    if (onClose) onClose();
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5005/api/users/connect/${userId}`, {}, {
        headers: {
          Authorization: token,
        }
      });
      toast.success("Connection request sent!");
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast.error("Failed to send connection request");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex justify-center items-center z-50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-800">Loading profile...</h3>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex justify-center items-center z-50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center border border-gray-200">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Profile not found</h3>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex justify-center items-start p-4 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 border border-gray-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-all p-2 rounded-full hover:bg-gray-100"
        >
          <FiX size={20} />
        </button>

        <div className="p-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden mx-auto md:mx-0">
              <img
                src={profile.profilePhotoUrl || "https://via.placeholder.com/150"}
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150";
                }}
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{profile.name}</h1>
                  <div className="flex items-center mt-2 gap-3 justify-center md:justify-start">
                    <span className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${
                      profile.role === "student"
                        ? "bg-blue-100 text-blue-800"
                        : profile.role === "faculty"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </span>
                    {profile.role === "student" && profile.batch && (
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <FiAward size={14} /> Batch: {profile.batch}
                      </span>
                    )}
                    {profile.location && (
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <FiMapPin size={14} /> {profile.location}
                      </span>
                    )}
                  </div>
                </div>

                {currentUser && currentUser._id !== userId && (
                  <div className="flex gap-3 justify-center md:justify-start">
                    <button 
                      onClick={handleConnect}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-all"
                    >
                      <FiUserPlus size={18} /> Connect
                    </button>
                    <button
                      onClick={handleMessageClick}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 transition-all"
                    >
                      <FiMessageCircle size={18} /> Message
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-6 mt-6 justify-center md:justify-start">
                {["followers", "following", "posts"].map((key) => (
                  <div key={key} className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{profile.stats?.[key] || 0}</p>
                    <p className="text-gray-500 text-sm capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* About Section */}
          {profile.about && (
            <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 flex items-center gap-2">
                <RiContactsBookLine /> About
              </h3>
              <p className="text-gray-600">{profile.about}</p>
            </div>
          )}

          {/* Information Sections */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Info */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                {profile.role === "student" && <FiBook />}
                {profile.role === "faculty" && <FiBriefcase />}
                {profile.role === "alumni" && <FaRegBuilding />}
                {profile.role === "student" && "Academic Information"}
                {profile.role === "faculty" && "Professional Information"}
                {profile.role === "alumni" && "Career Information"}
              </h3>

              {profile.role === "student" && (
                <>
                  <Info label="Branch" value={profile.branch} icon={<FiBook size={16} />} />
                  <Info label="Year of Study" value={profile.yearOfStudy} icon={<FiAward size={16} />} />
                  <Info label="Registration No." value={profile.regNumber} icon={<FiLink size={16} />} />
                  {profile.resumeLink && (
                    <div className="mt-4">
                      <a
                        href={profile.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-2 transition-all"
                      >
                        <FiLink size={16} /> View Resume
                      </a>
                    </div>
                  )}
                </>
              )}

              {profile.role === "faculty" && (
                <>
                  <Info label="Department" value={profile.department} icon={<FaUniversity size={16} />} />
                  <Info label="Designation" value={profile.designation} icon={<FiBriefcase size={16} />} />
                  <Info label="Faculty ID" value={profile.facultyId} icon={<FiLink size={16} />} />
                  {profile.researchInterests?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                        <FiBook size={16} /> Research Interests
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.researchInterests.map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-100 text-purple-800 px-3 py-1 text-sm rounded-full"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {profile.role === "alumni" && (
                <>
                  <Info label="Company" value={profile.company} icon={<FaRegBuilding size={16} />} />
                  <Info label="Job Title" value={profile.jobTitle} icon={<FiBriefcase size={16} />} />
                  <Info label="Experience" value={profile.experience} icon={<FiAward size={16} />} />
                  {profile.linkedin && (
                    <div className="mt-4">
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-2 transition-all"
                      >
                        <FiLink size={16} /> LinkedIn Profile
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <FiBriefcase /> Additional Information
              </h3>
              
              <Info label="Email" value={profile.email} icon={<FiLink size={16} />} />
              <Info label="Phone" value={profile.phone || "Not specified"} icon={<FiLink size={16} />} />
              
              {profile.skills?.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                    <FiAward size={16} /> Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value, icon }) => (
  <div className="mb-4">
    <p className="text-sm text-gray-500 flex items-center gap-2">
      {icon} {label}
    </p>
    <p className="text-gray-800 font-medium mt-1">{value || "Not specified"}</p>
  </div>
);

export default ViewProfile;