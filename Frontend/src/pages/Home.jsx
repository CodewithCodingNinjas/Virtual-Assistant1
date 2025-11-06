import React, { useContext, useEffect, useRef, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import aiImage from "../assets/ai.gif";
import userImage from "../assets/user.gif";
import { CgMenuRight } from "react-icons/cg";
import { RxCross2 } from "react-icons/rx";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const navigate = useNavigate();
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");

  const [listening, setListening] = useState(false);
  const isSpeakingRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const recognitionRef = useRef(null);
  const [ham, setHam] = useState(false);
  const synth = window.speechSynthesis;

  const handleLogOut = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      console.log(result.data);
      setUserData(null);
      navigate('/signin');
    } catch (error) {
      console.log(error);
      setUserData(null);
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
        console.log("Recognition requested to start");
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Start error:", error);
        }
      }
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    utterance.lang = 'hi-IN';
    const hindiVoice = voices.find(v => v.lang === 'hi-IN');
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    isSpeakingRef.current = true;
    utterance.onend = () => {
      setAiText("");
      isSpeakingRef.current = false;
      setTimeout(() => {
        startRecognition();
      }, 800);
    };
    synth.cancel();
    synth.speak(utterance);
  };

  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response);

    const query = encodeURIComponent(userInput);

    switch (type) {
      case 'google-search':
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
        break;
      case 'calculator-open':
        window.open('https://www.google.com/search?q=calculator', '_blank');
        break;
      case 'instagram-open':
        window.open('https://www.instagram.com/', '_blank');
        break;
      case 'facebook-open':
        window.open('https://www.facebook.com/', '_blank');
        break;
      case 'weather-show':
        window.open('https://www.google.com/search?q=weather', '_blank');
        break;
      case 'youtube-search':
      case 'youtube-play':
        window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
        break;
      default:
        console.log('Unknown command:', type);
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    let isMounted = true;

    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
          console.log("Recognition requested to start");
        } catch (e) {
          if (e.name !== 'InvalidStateError') {
            console.error(e);
          }
        }
      }
    }, 1000);

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);

      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
              console.log("Recognition restarted");
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e);
            }
          }
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);

      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
              console.log("Recognition restarted after error");
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e);
            }
          }
        }, 1000);
      }
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log("Heard:", transcript);

      if (transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
        setAiText("");
        setUserText(transcript);

        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);

        const data = await getGeminiResponse(transcript);
        console.log(data);
        handleCommand(data);
        setAiText(data.response);
        setUserText("");
      }
    };

    if (userData?.name) {
      const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, what can I help you with?`);
      greeting.lang = 'hi-IN';
      synth.speak(greeting);
    }

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
    };
  }, []);

  return (
    <div className="w-full min-h-[100vh] bg-gradient-to-t from-black to-green-900 flex flex-col justify-center items-center py-10 text-white overflow-hidden">

      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(true)} />

      <div className={`absolute top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <RxCross2 className='text-green absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(false)} />

        <button className="min-w-[150px] h-[50px] text-green-400 font-semibold bg-green rounded-full cursor-pointer text-[18px]" onClick={handleLogOut}>Log Out</button>

        <button className="min-w-[150px] h-[50px] text-green-400 font-semibold bg-green rounded-full cursor-pointer text-[18px]" onClick={() => navigate('/customize')}>Customize Your Assistant</button>

        <div className='w-full h-[2px] bg-gray-400'></div>
        <h1 className='text-green-400 font-semibold text-[19px]'>History</h1>

        <div className='w-full h-[60%] overflow-y-auto flex flex-col'>
          {userData.history ? userData.history.map((his, index) => (
            <span key={index} className='text-green-400 text-[18px] truncate mt-[2px]'>{his}</span>
          )) : null}
        </div>
      </div>

      <button
        className="min-w-[150px] h-[50px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-green rounded-full cursor-pointer text-[18px]"
        onClick={handleLogOut}
      >
        Log Out
      </button>

      <button
        className="min-w-[200px] h-[50px] text-black font-semibold absolute hidden lg:block top-[80px] right-[20px] bg-green rounded-full cursor-pointer text-[18px]"
        onClick={() => navigate('/customize')}
      >
        Customize Your Assistant
      </button>

      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-2xl shadow-lg shadow-green-800 border-4 border-white">
        {userData?.assistantImage ? (
          <img
            src={userData.assistantImage}
            alt="assistant"
            className="w-full h-full object-cover"
          />
        ) : (
          <p>Loading assistant...</p>
        )}
      </div>

      <h1 className="text-3xl mt-8 text-center">
        Welcome, I’m{' '}
        <span className="text-green-400">{userData?.assistantName}</span>
      </h1>

      {!aiText && (
        <img src={userImage} alt="user" className="w-[200px]" />
      )}
      {aiText && (
        <img src={aiImage} alt="ai speaking" className="w-[200px]" />
      )}

      <h1 className='text-green text-[18px] font-semibold text-wrap'>
        {userText ? userText : aiText ? aiText : null}
      </h1>
    </div>
  );
}

export default Home;
