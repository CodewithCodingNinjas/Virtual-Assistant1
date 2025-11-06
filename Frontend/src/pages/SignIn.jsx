import React, { useState, useContext } from 'react';
import { IoEye, IoEyeOff } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import bg from '../assets/authBG.png';
import { userDataContext } from '../context/UserContext';
import axios from 'axios';

function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const { serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email, password },
        { withCredentials: true }
      );
      setUserData(result.data);
      setLoading(false);
      navigate("/home");
    } catch (error) {
      console.log(error);
      setUserData(null)
      setLoading(false);
      if (error.response && error.response.data && error.response.data.message) {
        setErr(error.response.data.message);
      } else {
        setErr("Something went wrong");
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div
      className='w-full h-[100vh] bg-cover flex justify-center items-center'
      style={{ backgroundImage: `url(${bg})` }}
    >
      <form
        className='w-[90%] h-[600px] max-w-[500px] bg-[#00000062] backdrop-blur shadow-lg shadow-black flex flex-col items-center justify-center gap-[20px] px-[20px] rounded-xl'
        onSubmit={handleSignIn}
      >
        <h1 className='text-white text-[30px] font-semibold mb-[30px]'>
          Sign In to <span className='text-green-400'>Virtual Assistant</span>
        </h1>

        <input
          type="email"
          name="email"
          placeholder='Enter your Mail Id'
          className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]'
          required
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <div className='w-full h-[60px] relative'>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder='Password'
            className='w-full h-full outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]'
            required
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
          <span
            className='absolute top-1/2 right-5 transform -translate-y-1/2 text-white cursor-pointer text-xl'
            onClick={togglePasswordVisibility}
          >
            {showPassword ? <IoEyeOff /> : <IoEye />}
          </span>
        </div>

        {err.length > 0 && (
          <p className='text-red-500 text-[17px]'>*{err}</p>
        )}

        <button
          className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px]'
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>

        <p
          className='text-[white] text-[18px] cursor-pointer'
          onClick={() => navigate("/signup")}
        >
          Don't have an account? <span className='text-green-400'>Sign Up</span>
        </p>
      </form>
    </div>
  );
}

export default SignIn;
