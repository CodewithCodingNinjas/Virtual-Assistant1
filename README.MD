Virtual Voice Assistant



A smart virtual voice assistant built with the MERN stack and Gemini AI. It listens to voice commands, speaks responses in Hindi or English, and performs actions like Google/YouTube searches. Users can customize assistant name \& avatar, view history, and sign in with JWT-backed authentication. Cloudinary handles images.



Features



Real-time voice recognition (SpeechRecognition) and speech synthesis (SpeechSynthesis)



Gemini AI integration for intent parsing \& responses



Google / YouTube / social quick actions (open/search/play)



User signup / signin with JWT + cookie auth



Customize assistant name and image (Cloudinary)



Persistent user data \& history (MongoDB)



Frontend built with React + Tailwind CSS



Tech stack



Frontend: React, React Router, TailwindCSS



Backend: Node.js, Express



DB: MongoDB (Mongoose)



Auth: JWT (cookies)



Image hosting: Cloudinary



AI: Gemini API (via gemini.js helper)



Misc: Multer for uploads, Moment for date/time formatting



Repo structure (high level)

/client          # React app

&nbsp; /src

&nbsp;   /components

&nbsp;   /context

&nbsp;   /pages

&nbsp;   App.jsx

/server          # Express API

&nbsp; /config

&nbsp;   db.js

&nbsp;   cloudinary.js

&nbsp;   token.js

&nbsp; /controllers

&nbsp;   auth.controller.js

&nbsp;   user.controller.js

&nbsp; /middlewares

&nbsp;   isAuth.js

&nbsp;   multer.js

&nbsp; /models

&nbsp;   user.model.js

&nbsp; gemini.js

&nbsp; index.js



Getting started (local)

Prerequisites



Node.js (v16+ recommended)



MongoDB (local or Atlas)



Cloudinary account (for image uploads)



Gemini API endpoint/key (as used in gemini.js)



Backend (server)



cd server



Install dependencies:



npm install





Create .env in /server with:



PORT=2108

MONGODB\_URL=<your\_mongo\_uri>

JWT\_SECRET=<your\_jwt\_secret>

CLOUDINARY\_CLOUD\_NAME=<cloud\_name>

CLOUDINARY\_CLOUD\_KEY=<api\_key>

CLOUDINARY\_CLOUD\_SECRET=<api\_secret>

GEMINI\_API\_URL=<your\_gemini\_api\_url>





Run server:



npm run dev

\# or

node index.js



Frontend (client)



cd client



Install:



npm install





Update serverUrl in src/context/UserContext.jsx (default used in code: http://localhost:2108)



Run:



npm run dev

\# or

npm start





Open the frontend (e.g., http://localhost:5173) and the backend port (default 2108) should be running.



API Endpoints (summary)



POST /api/auth/signup — register (returns user + sets token cookie)



POST /api/auth/signin — login (returns user + sets token cookie)



GET /api/auth/logout — clear cookie



GET /api/user/current — get current user (requires cookie)



POST /api/user/update — update assistant name/image (multipart/form-data)



POST /api/user/asktoassistant — send voice command, returns structured response (type, userInput, response)



Notes \& Troubleshooting



Ensure user.model.js defines history as an array:



history: { type: \[String], default: \[] }





Save history with:



user.history.push(command);

await user.save();





If frontend fails destructuring data.type, check the backend response; handle missing responses on frontend:



if (!data || !data.type) {

&nbsp; console.warn("Invalid assistant response:", data);

&nbsp; return;

}





Browser voice APIs require HTTPS or localhost and user permission. Some browsers have different voice/voice-language availability—check speechSynthesis.getVoices().



Contribution



Contributions welcome — please open issues or PRs. Suggested improvements:



Add more intent types and richer Gemini prompts



Better error handling \& retries for Gemini API



Add automated tests and CI/CD



License



MIT

