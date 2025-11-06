import React, { useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Added this
import { RiImageAddFill } from "react-icons/ri";
import Card from '../components/Card';
import { userDataContext } from '../context/UserContext';
import { IoMdArrowRoundBack } from "react-icons/io";

import image1 from "../assets/image1.png";
import image2 from "../assets/image2.png";
import image3 from "../assets/image3.png";
import image4 from "../assets/image4.png";
import image5 from "../assets/image5.png";
import image6 from "../assets/image6.png";
import image7 from "../assets/image7.png";
import image8 from "../assets/image8.png";
import image9 from "../assets/image9.png";
import image13 from "../assets/image13.png";
import image14 from "../assets/image14.jpeg";
import image15 from "../assets/image15.jpeg";
import image16 from "../assets/authBG.png";

function Customize() {
  const {
    frontendImage,
    setFrontendImage,
    setBackendImage,
    selectedImage,
    setSelectedImage
  } = useContext(userDataContext);

  const navigate = useNavigate(); // ✅ This was missing
  const inputImage = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      const objectUrl = URL.createObjectURL(file);
      setFrontendImage(objectUrl);
      setSelectedImage(objectUrl); // select uploaded image
    }
  };

  return (
    <div className='w-full min-h-[100vh] 
    bg-gradient-to-t from-black to-green-900 
    flex justify-center items-center flex-col 
    py-10'>
        <IoMdArrowRoundBack className='absolute top-[30px] 
            left-[30px] text-white cursor-pointer 
            w-[25px] h-[25px]'
            onClick={()=>navigate("/")}/>
      <h1 className='text-white mb-10 text-[50px] text-center'>
        Select your <span className='text-green-200'>Assistant Image</span>
      </h1>

      <div className='w-[90%] max-w-[60%] flex justify-center items-center flex-wrap gap-[20px]'>

        {/* Predefined images */}
        <Card image={image1} />
        <Card image={image2} />
        <Card image={image3} />
        <Card image={image4} />
        <Card image={image5} />
        <Card image={image6} />
        <Card image={image7} />
        <Card image={image8} />
        <Card image={image9} />
        <Card image={image13} />
        <Card image={image14} />
        <Card image={image15} />
        <Card image={image16} />

        {/* Upload custom image card */}
        <div
          className={`w-[70px] h-[140px] 
          lg:w-[150px] lg:h-[250px] 
          bg-[#020220] 
          border-2 border-[#00ff0066] 
          rounded-2xl 
          overflow-hidden 
          hover:shadow-2xl hover:shadow-green-800 
          cursor-pointer 
          hover:border-4 hover:border-white 
          flex items-center justify-center 
          ${selectedImage === "input" ? "border-4 border-white shadow-2xl shadow-green-800" : ""}`}
          onClick={() => {
            inputImage.current.click();
            setSelectedImage("input");
          }}
        >
          {!frontendImage ? (
            <RiImageAddFill className='text-white w-[30px] h-[30px]' />
          ) : (
            <img src={frontendImage} alt="Uploaded" className="h-full w-full object-cover" />
          )}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept='image/*'
          ref={inputImage}
          hidden
          onChange={handleImage}
        />
      </div>

      {selectedImage && (
        <button
          className='min-w-[150px] h-[60px] 
          text-black font-semibold cursor-pointer 
          bg-white rounded-full text-[19px] mt-8'
          onClick={() => navigate("/customize2")}
        >
          Next
        </button>
      )}
    </div>
  );
}

export default Customize;
