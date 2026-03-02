# Deployment Guide

## Option 1: Vercel (Recommended - Fastest)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy from project root:
   ```bash
   vercel
   ```

3. Follow prompts, then run for production:
   ```bash
   vercel --prod
   ```

**Live URL**: Will be provided after deployment (e.g., `nammaway.vercel.app`)

## Option 2: GitHub Pages

1. Go to repository settings: https://github.com/Harish-0412/AMD-ConsumerServices/settings/pages

2. Under "Build and deployment":
   - Source: GitHub Actions
   - The workflow is already configured in `.github/workflows/deploy.yml`

3. Push changes to main branch:
   ```bash
   git add .
   git commit -m "Add deployment config"
   git push origin main
   ```

4. Check Actions tab for deployment progress

**Live URL**: `https://harish-0412.github.io/AMD-ConsumerServices/`

## Option 3: Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

## Important Notes

- Ensure `.env` variables are set in deployment platform
- Backend API must be deployed separately (FastAPI)
- Update API endpoints in production build
