import React, { useContext } from 'react';
import { userDataContext } from '../context/UserContext';

function Card({ image }) {
  const { selectedImage, setSelectedImage, setBackendImage, setFrontendImage } = useContext(userDataContext);
  const isSelected = selectedImage === image;

  return (
    <div
      className={`
        w-[80px] h-[160px] 
        lg:w-[150px] lg:h-[250px] 
        bg-[#030326] 
        rounded-2xl 
        overflow-hidden 
        cursor-pointer
        ${isSelected ? 'border-4 border-white shadow-2xl shadow-green-800' : 'border-2 border-green-500'}
        hover:shadow-2xl hover:shadow-green-800 
        hover:border-4 hover:border-white
      `}
      onClick={() =>{ 
        setSelectedImage(image)
        setBackendImage(null)
        setFrontendImage(null)
      }}
    >
      <img src={image} alt="card" className="w-full h-full object-cover" />
    </div>
  );
}

export default Card;
