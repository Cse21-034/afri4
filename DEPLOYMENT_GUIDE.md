# LoadLink Africa Deployment Guide

This guide explains how to deploy the LoadLink Africa application using the separated backend and frontend architecture.

## Architecture Overview

- **Backend**: Express.js API deployed on Render
- **Frontend**: React/Vite SPA deployed on Vercel
- **Database**: PostgreSQL (Neon)

## Backend Deployment (Render)

### Prerequisites
1. A Render account
2. PostgreSQL database URL (from Neon or similar provider)
3. Environment variables configured

### Step 1: Setup Repository
```bash
git clone <your-repo>
cd your-repo
```

### Step 2: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New+" → "Web Service"
3. Connect your GitHub repository
4. Use the following configuration:

**Build & Deploy Settings:**
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Environment**: Node
- **Plan**: Starter (or higher for production)
- **Health Check Path**: `/health`

**Environment Variables:**
```
NODE_ENV=production
DATABASE_URL=<your-postgres-url>
JWT_SECRET=<your-jwt-secret-32-chars>

FRONTEND_URL=<your-vercel-domain>
SESSION_SECRET=<your-session-secret>
VERCEL_PROJECT_NAME=<your-project-name>
```

**Optional Email Variables:**
```
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
EMAIL_FROM=<from-email>
```

### Step 3: Database Migration
After deployment, run database migrations:
```bash
# In your local backend directory
npm run db:push
```

## Frontend Deployment (Vercel)

### Prerequisites
1. A Vercel account
2. Backend deployed and running on Render

### Step 1: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:

**Framework Preset**: Vite
**Root Directory**: `frontend`
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`

### Step 2: Environment Variables
In Vercel dashboard, add these environment variables:

```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_STRIPE_PUBLIC_KEY=<your-stripe-public-key>
```

### Step 3: Domain Configuration
1. Your app will be available at `https://your-app.vercel.app`
2. Update the `FRONTEND_URL` environment variable in Render with this URL
3. Configure custom domain if needed

## Environment Variables Reference

### Backend (Render)
| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `FRONTEND_URL` | Frontend domain URL | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |

### Frontend (Vercel)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |

## Local Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure `FRONTEND_URL` is correctly set in backend
- Check that API requests use the correct backend URL

**Authentication Issues:**
- Verify JWT_SECRET is consistent
- Check token storage and transmission

**Database Connection:**
- Validate DATABASE_URL format
- Ensure database is accessible from Render

**Build Failures:**
- Check all dependencies are installed
- Verify TypeScript compilation
- Review build logs for specific errors

### Logs and Monitoring
- **Backend logs**: Available in Render dashboard
- **Frontend errors**: Check browser console and Vercel functions logs
- **Database**: Monitor through your database provider's dashboard

## Performance Optimization

### Backend
- Enable gzip compression
- Implement caching for static content
- Optimize database queries
- Use connection pooling

### Frontend
- Enable asset compression
- Implement code splitting
- Use lazy loading for components
- Optimize images and assets

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Validate all environment variables
- [ ] Enable CORS with specific origins
- [ ] Use secure JWT secrets (32+ characters)
- [ ] Implement rate limiting
- [ ] Sanitize user inputs
- [ ] Keep dependencies updated

## Support

For deployment issues:
1. Check the application logs
2. Verify environment variables
3. Test API endpoints directly
4. Review network connectivity

For feature issues, refer to the application documentation or contact the development team.