# MongoDB Atlas Setup Guide - Permanent Storage

## Problem
Vercel serverless functions have temporary storage. Data disappears after each request.

## Solution
Use MongoDB Atlas (FREE forever tier) for permanent storage.

---

## Step 1: Create MongoDB Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google, GitHub, or email
3. Choose "Shared Cluster" (FREE forever)

## Step 2: Create Database Cluster
1. Click "Build a Database"
2. Select "M0" (Free Tier)
3. Choose AWS/Google/Azure
4. Select region closest to you
5. Click "Create Cluster" (wait 1-2 minutes)

## Step 3: Security Setup
1. Create username: `ahmad`
2. Create password: `YourStrongPassword123`
3. IP Access List: Click "Add IP Address"
4. Choose "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Finish and Close"

## Step 4: Get Connection String
1. Click "Connect" button on your cluster
2. Click "Drivers"
3. Select "Node.js"
4. Copy this string:
```
mongodb+srv://ahmad:YourStrongPassword123@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
```

## Step 5: Add to Vercel
1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to "Settings" → "Environment Variables"
4. Add new variable:
   - Name: `MONGODB_URI`
   - Value: (paste your connection string)
5. Click "Save"

## Step 6: Add JWT_SECRET (for security)
1. In same Environment Variables page
2. Add:
   - Name: `JWT_SECRET`
   - Value: `your-super-secret-random-string-here`
3. Click "Save"

## Step 7: Redeploy
1. In Vercel dashboard
2. Click "Redeploy"
3. Wait for build to complete

---

## Test It
1. Visit: `https://your-site.vercel.app/admin.html`
2. Login with:
   - Username: `Ahmad`
   - Password: `$$dollar$$`
3. Add a blog post
4. Refresh page - data will be SAVED PERMANENTLY!

## Check Status
Visit: `https://your-site.vercel.app/api/health`

Should show:
```json
{"status":"OK","mongodb":true}
```

If `mongodb` is `false`, check your connection string.

---

## Need Help?
The code is already configured in `api/index.js` with MongoDB support.
Just add the `MONGODB_URI` environment variable in Vercel!
