# 🚀 Shree Krishna Bakers - Setup & Security Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Environment Variables](#environment-variables)
5. [Security Features](#security-features)
6. [Production Deployment](#production-deployment)

---

## Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (Local installation or MongoDB Atlas account)
- **Git**
- **Email Account** (Gmail recommended for OTP)

---

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/krishna_bakers
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/krishna_bakers

# JWT Secret (Generate a strong random string)
# Generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (comma-separated for multiple origins)
FRONTEND_URL=http://localhost:5173
```

### 4. Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as your `JWT_SECRET` value.

### 5. Gmail App Password Setup (for OTP emails)
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Use this password as `EMAIL_PASS` in your `.env` file

### 6. Start the backend server
```bash
npm start
# OR for development with auto-reload:
npx nodemon server.js
```

The server will start on `http://localhost:5001`

---

## Frontend Setup

### 1. Navigate to project root
```bash
cd ..
```

### 2. Install dependencies
```bash
npm install
```

### 3. Update API base URL (if needed)
If your backend runs on a different port, update `src/utils/api.js`:
```javascript
baseURL: "http://localhost:5001/api/v1"
```

### 4. Start the development server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## Environment Variables

### Required Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/krishna_bakers` |
| `JWT_SECRET` | Secret key for JWT tokens | Random 64-byte hex string |
| `EMAIL_USER` | Email address for sending OTPs | `your-email@gmail.com` |
| `EMAIL_PASS` | Email app password | Gmail app password |
| `PORT` | Server port (optional) | `5001` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Allowed frontend origins | `http://localhost:5173` |

---

## Security Features

### ✅ Implemented Security Measures

1. **Frontend Route Protection**
   - Admin routes are protected with `ProtectedRoute` component
   - Unauthorized users are redirected to login
   - Admin-only routes check user role

2. **Backend Route Protection**
   - All admin routes require authentication (`auth` middleware)
   - Admin routes require admin role (`adminCheck` middleware)
   - User routes for orders require authentication

3. **Input Validation**
   - All endpoints use Zod schema validation
   - Prevents invalid data from reaching database
   - Provides clear error messages

4. **Token Management**
   - JWT tokens with 1-day expiration
   - Automatic token expiration handling
   - Token stored securely (consider httpOnly cookies for production)

5. **Rate Limiting**
   - General API: 100 requests per 15 minutes per IP
   - Auth endpoints: 5 requests per 15 minutes per IP
   - Prevents brute force attacks

6. **Error Handling**
   - Centralized error handling middleware
   - Sensitive errors hidden in production
   - Consistent error response format

7. **OTP Security**
   - OTP stored in database (not memory)
   - OTP expires after 10 minutes
   - Email verification required before login

8. **CORS Protection**
   - Only allowed origins can access API
   - Configurable via environment variables

---

## Production Deployment

### Checklist Before Deployment

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Set up proper email service (not Gmail for production)
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up environment variables on hosting platform
- [ ] Update CORS origins to production domains
- [ ] Review and test all security features
- [ ] Set up monitoring and logging
- [ ] Configure backup for database

### Recommended Changes for Production

1. **Use httpOnly Cookies Instead of localStorage**
   - More secure against XSS attacks
   - Update `src/utils/api.js` to handle cookies

2. **Add Helmet.js for Security Headers**
   ```bash
   npm install helmet
   ```
   Add to `server.js`:
   ```javascript
   const helmet = require("helmet");
   app.use(helmet());
   ```

3. **Use Environment-Specific Config**
   - Different rate limits for production
   - More restrictive CORS in production

4. **Add Database Indexes**
   - Index on `User.email` (already unique)
   - Index on `Order.userId` and `Order.createdAt`
   - Index on `Product.category`

5. **Set Up Logging Service**
   - Use services like Winston, Pino, or external logging
   - Log errors, authentication attempts, etc.

---

## Testing Security Features

### Test Frontend Route Protection
1. Try accessing `/admin` without logging in → Should redirect to `/account`
2. Login as regular user → Try accessing `/admin` → Should redirect to home
3. Login as admin → Should access `/admin` successfully

### Test Backend Route Protection
1. Try API calls without token → Should return 401
2. Try admin endpoints with customer token → Should return 403
3. Try expired token → Should return 401 and redirect to login

### Test Rate Limiting
1. Make multiple rapid requests → Should be rate limited after threshold
2. Auth endpoints should have stricter limits

---

## Troubleshooting

### Backend won't start
- Check if all environment variables are set
- Verify MongoDB connection string
- Check if port 5001 is available

### OTP emails not sending
- Verify Gmail app password is correct
- Check if 2-Step Verification is enabled
- Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`

### CORS errors
- Check `FRONTEND_URL` in backend `.env`
- Ensure frontend URL matches exactly (including port)
- Restart backend after changing CORS settings

### Token errors
- Verify `JWT_SECRET` is set correctly
- Check token expiration (1 day)
- Clear localStorage and login again

---

## Support

For issues or questions:
1. Check error logs in console
2. Verify all environment variables are set
3. Ensure MongoDB is running and accessible
4. Check network connectivity

---

## License

This project is proprietary software for Shree Krishna Bakers.

