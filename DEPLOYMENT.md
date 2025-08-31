# Vercel Deployment Guide

This guide will help you deploy your COT Charts application to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (free at [vercel.com](https://vercel.com))

## Step 1: Push to GitHub

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub and push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

## Step 3: Environment Variables (Optional)

If you want to use a different data source, you can set an environment variable:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add:
   - **Name**: `NEXT_PUBLIC_DATA_URL`
   - **Value**: `https://raw.githubusercontent.com/gptechnologies/COTData/refs/heads/main/cot.csv`
   - **Environment**: Production (and Preview if desired)

## Step 4: Verify Deployment

1. Your app will be available at `https://your-project-name.vercel.app`
2. The app should load the COT data from the GitHub CSV file
3. You can select different assets and date ranges

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check that all dependencies are in `package.json`
2. Ensure all import paths are correct
3. Verify TypeScript configuration

### Data Loading Issues

If the chart doesn't load data:

1. Check the browser console for CORS errors
2. Verify the CSV URL is accessible
3. Ensure the CSV format matches the expected structure

### Performance Issues

1. The app loads data client-side, so initial load time depends on CSV size
2. Consider implementing caching or data optimization for large datasets

## Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Follow the DNS configuration instructions

## Automatic Deployments

Vercel will automatically deploy when you push changes to your main branch. You can also:

- Set up preview deployments for pull requests
- Configure branch-specific deployments
- Set up deployment notifications

## Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Review the browser console for errors
3. Verify your local development environment works
4. Check the [Vercel documentation](https://vercel.com/docs)
