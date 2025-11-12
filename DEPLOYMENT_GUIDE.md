# 🚀 Vercel Deployment Guide for Virtual Assistant

## Overview
This guide walks you through deploying both Frontend and Backend of Virtual Assistant on Vercel.

---

## 📌 Part 1: Deploy Frontend on Vercel

### Step 1: Login to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up" or "Log In" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub repositories

### Step 2: Create a New Project
1. Click "Add New" → "Project"
2. Find your repository "Virtual-Assistant1" and click "Import"

### Step 3: Configure Frontend Settings
1. **Project Name**: `virtual-assistant-frontend` (or any name you prefer)
2. **Framework Preset**: Select "Vite" (should be auto-detected)
3. **Root Directory**: Set to `Frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Install Command**: `npm install`

### Step 4: Add Environment Variables for Frontend
Click "Environment Variables" section:
- Add new variable:
  - Name: `VITE_API_URL`
  - Value: `http://localhost:5000` (for now, we'll update this after Backend deployment)
  - Environment: Select all (Production, Preview, Development)

### Step 5: Deploy Frontend
1. Click "Deploy"
2. Wait for deployment to complete
3. You'll get a URL like: `https://virtual-assistant-frontend-xyz.vercel.app`
4. **Save this URL** - you'll need it for Backend configuration

✅ **Frontend is now live!**

---

## 📌 Part 2: Deploy Backend on Vercel

Vercel has two ways to deploy Node.js backends:

### Option A: Deploy as Serverless Functions (Recommended for simplicity)

#### Step 1: Create Vercel Config File
Create a file `vercel.json` in your project root:

```json
{
  "builds": [
    { "src": "Backend/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "Backend/index.js" }
  ],
  "env": {
    "PORT": "3000"
  }
}
```

#### Step 2: Create a new Backend Project on Vercel
1. Go to Vercel Dashboard
2. Click "Add New" → "Project"
3. Import the same "Virtual-Assistant1" repository
4. **Project Name**: `virtual-assistant-backend`
5. **Framework Preset**: "Other"
6. **Root Directory**: Leave blank (uses repository root)
7. **Build Command**: `cd Backend && npm install`
8. **Output Directory**: `Backend`
9. **Start Command**: `cd Backend && npm start`

#### Step 3: Add Environment Variables for Backend
Click "Environment Variables" and add:

| Key | Value | Environment |
|-----|-------|-------------|
| `MONGODB_URI` | Your MongoDB connection string | All |
| `JWT_SECRET` | Your JWT secret key | All |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | All |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | All |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | All |
| `ALLOWED_ORIGINS` | Your Vercel Frontend URL | All |
| `PORT` | `3000` | All |

#### Step 4: Deploy Backend
1. Click "Deploy"
2. Wait for completion
3. Get your Backend URL: `https://virtual-assistant-backend-xyz.vercel.app`

✅ **Backend is now deployed!**

---

### Option B: Deploy Backend Separately on Render/Railway (Alternative)

If you prefer to keep Backend on a different platform:

#### On Render.com:
1. Go to [render.com](https://render.com)
2. Click "New Web Service"
3. Select your GitHub repository
4. Configure:
   - **Name**: `virtual-assistant-api`
   - **Root Directory**: `Backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Add all environment variables from Part 2, Step 3
6. Deploy and get your URL

---

## 📌 Part 3: Connect Frontend to Backend

### Step 1: Update Frontend Environment Variable
1. Go to your **Frontend** Vercel project
2. Go to Settings → Environment Variables
3. Update `VITE_API_URL`:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://virtual-assistant-backend-xyz.vercel.app` (your Backend URL)
   - **Environment**: Production, Preview, Development

### Step 2: Trigger Frontend Redeployment
1. Go to "Deployments"
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Wait for new deployment with updated Backend URL

✅ **Frontend and Backend are now connected!**

---

## 📌 Part 4: Test Your Deployment

### Test Frontend:
1. Open your Frontend URL in browser
2. Go to Sign Up page
3. Create a new account
4. Verify user data loads
5. Test assistant features
6. Test file uploads to Cloudinary

### Troubleshooting:

#### CORS Errors:
If you see CORS errors in browser console:
- Go to Backend Vercel/Render project settings
- Update `ALLOWED_ORIGINS` environment variable to include your Frontend URL

#### 404 on API calls:
- Verify Backend URL is correct in Frontend environment variables
- Check if Backend is actually running on Vercel/Render dashboard

#### Database Connection Failed:
- Verify `MONGODB_URI` is correct
- Check if your MongoDB allows connections from Vercel IPs
- Add `0.0.0.0/0` to MongoDB Atlas IP Whitelist (Not recommended for production, use VPN IP)

---

## 🔐 Security Checklist

- [ ] Never commit `.env` file (it's in `.gitignore`)
- [ ] Use strong JWT_SECRET
- [ ] Don't expose sensitive keys in version control
- [ ] Regularly rotate Cloudinary API keys
- [ ] Monitor your Vercel/Render deployments for errors

---

## 📞 Quick Reference

| Component | Provider | URL Format |
|-----------|----------|-----------|
| Frontend | Vercel | `https://<project>.vercel.app` |
| Backend | Vercel/Render | `https://<project>.vercel.app` or similar |
| Database | MongoDB Atlas | Connection string in .env |

---

## 🎉 Deployment Complete!

Your Virtual Assistant is now live and accessible from anywhere! 🚀

Monitor your deployments regularly and check logs for any issues.

Happy coding! 💻
