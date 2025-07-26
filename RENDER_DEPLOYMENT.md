# Render Deployment Guide

## 🚀 Deploy E-commerce API to Render

### Prerequisites

1. GitHub repository with your code
2. MongoDB Atlas cluster set up
3. Render account

### Step 1: Prepare MongoDB Atlas

1. **Create MongoDB Atlas Account** (if not done)

   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster

2. **Get Connection String**

   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

3. **Whitelist Render IPs**
   - In Atlas, go to Network Access
   - Add IP Address: `0.0.0.0/0` (allows all IPs)
   - Or add specific Render IP ranges

### Step 2: Deploy to Render

1. **Create New Web Service**

   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**

   - **Name**: `ecommerce-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Set Environment Variables**
   Add these environment variables in Render:

   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://e-commerce:YOUR_NEW_PASSWORD@cluster0.h8xyx.mongodb.net/ecommerce_api?retryWrites=true&w=majority
   JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long
   JWT_EXPIRES_IN=24h
   PORT=3000
   ```

   **⚠️ IMPORTANT**:

   - Change your MongoDB password first!
   - Use a strong JWT secret (32+ characters)

### Step 3: Test Deployment

1. **Health Check**

   ```
   GET https://your-app-name.onrender.com/health
   ```

2. **Register Admin User**

   ```bash
   curl -X POST https://your-app-name.onrender.com/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "fullName": "Admin User",
       "email": "admin@example.com",
       "password": "securepassword123",
       "role": "admin"
     }'
   ```

3. **Update Postman Collection**
   - Change `baseUrl` to your Render URL
   - Test all endpoints

### Step 4: Custom Domain (Optional)

1. **Add Custom Domain**
   - In Render dashboard, go to Settings
   - Add your custom domain
   - Update DNS records as instructed

### Troubleshooting

#### Common Issues:

1. **Build Fails**

   - Check Node.js version compatibility
   - Ensure all dependencies are in `package.json`

2. **Database Connection Fails**

   - Verify MongoDB URI is correct
   - Check Atlas network access settings
   - Ensure password doesn't contain special characters

3. **Environment Variables**

   - Double-check all required env vars are set
   - No spaces around `=` in env vars

4. **JWT Issues**
   - Ensure JWT_SECRET is set and long enough
   - Check token expiration settings

### Security Checklist

- ✅ Changed MongoDB Atlas password
- ✅ Strong JWT secret (32+ characters)
- ✅ Environment variables set in Render (not in code)
- ✅ CORS configured for your frontend domain
- ✅ MongoDB Atlas network access configured

### Monitoring

- Check Render logs for errors
- Monitor MongoDB Atlas metrics
- Set up alerts for downtime

### Cost Optimization

- Render free tier: 750 hours/month
- MongoDB Atlas free tier: 512MB storage
- Consider upgrading for production use

---

## 🎉 Your API is now live!

Your e-commerce API should now be accessible at:
`https://your-app-name.onrender.com`

Update your frontend applications to use this new URL.
