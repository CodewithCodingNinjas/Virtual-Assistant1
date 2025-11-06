import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { userDataContext } from '../context/UserContext';
import { IoMdArrowRoundBack } from "react-icons/io";

function Customize2() {
  const {
    userData,
    backendImage,
    selectedImage,
    serverUrl,
    setUserData
  } = useContext(userDataContext);

  const [assistantName, setAssistantName] = useState(userData?.assistantName || "");
  const navigate = useNavigate();
  const [loading,setLoading]=useState(false)

  const handleUpdateAssistant = async () => {
    try {
      const formData = new FormData();
      formData.append("assistantName", assistantName);

      if (backendImage) {
        formData.append("assistantImage", backendImage);
      } else {
        formData.append("imageUrl", selectedImage);
      }

      const result = await axios.post(`${serverUrl}/api/user/update`, formData, {
        withCredentials: true,
      });

      console.log(result.data);
      setUserData(result.data);
      navigate("/"); // ✅ Redirect to Home after update
    } catch (error) {
      console.error("Failed to update assistant:", error);
    }
  };

  return (
    <div className="w-full min-h-[100vh] 
    bg-gradient-to-t from-black to-green-900 flex 
    justify-center items-center flex-col py-10 relative">
      <IoMdArrowRoundBack className='absolute top-[30px] 
      left-[30px] text-white cursor-pointer 
      w-[25px] h-[25px]'
      onClick={()=>navigate("/customize")}/>
      <h1 className="text-white mb-10 text-[50px] text-center">
        Enter Your <span className="text-green-200">Assistant Name</span>
      </h1>

      <input
        type="text"
        placeholder="Enter your Assistant's Name"
        className="w-full max-w-[600px] h-[60px] 
        outline-none border-2 border-white 
        bg-transparent text-white 
        placeholder-gray-300 px-[20px] py-[10px] 
        rounded-full text-[18px]"
        value={assistantName}
        onChange={(e) => setAssistantName(e.target.value)}
      />

      {assistantName && (
        <button
          className="min-w-[200px] h-[60px] 
          text-black font-semibold cursor-pointer 
          bg-white rounded-full text-[19px] mt-8"
          disabled={loading}
          onClick={handleUpdateAssistant}
        >
          {! loading? "Enjoy Your Assistant":"loading"}
        </button>
      )}
    </div>
  );
}

export default Customize2;
