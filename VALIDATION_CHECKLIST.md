# ✅ Validation Checklist

Use this checklist to verify all security improvements are working correctly.

## 🔧 Setup Verification

- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env` file created in `backend` directory with all required variables
- [ ] MongoDB is running and accessible
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors

---

## 🔒 Priority 1: Critical Security Tests

### Frontend Route Protection
- [ ] **Test 1:** Access `/admin` without logging in
  - Expected: Redirected to `/account` page
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 2:** Login as regular customer, then access `/admin`
  - Expected: Redirected to home page (`/`)
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 3:** Login as admin, then access `/admin`
  - Expected: Admin dashboard loads successfully
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 4:** Access `/admin/menu` directly without login
  - Expected: Redirected to `/account`
  - Status: ⬜ Pass / ⬜ Fail

### Backend Route Protection
- [ ] **Test 5:** Try DELETE `/api/v1/admin/remove-product/:id` without token
  - Expected: 401 Unauthorized error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 6:** Try DELETE `/api/v1/admin/remove-product/:id` with customer token
  - Expected: 403 Forbidden error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 7:** Try PUT `/api/v1/admin/toggle-stock/:id` without token
  - Expected: 401 Unauthorized error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 8:** Try PUT `/api/v1/admin/toggle-stock/:id` with customer token
  - Expected: 403 Forbidden error
  - Status: ⬜ Pass / ⬜ Fail

### Token Expiration Handling
- [ ] **Test 9:** Use expired token (manually expire or wait 1 day)
  - Expected: Automatic redirect to `/account` page
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 10:** Make API call with invalid token
  - Expected: 401 error, token cleared from localStorage
  - Status: ⬜ Pass / ⬜ Fail

### OTP Storage (Database)
- [ ] **Test 11:** Signup → Get OTP → Restart server → Verify OTP
  - Expected: OTP still works after server restart
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 12:** Signup → Wait 11 minutes → Verify OTP
  - Expected: OTP expired error message
  - Status: ⬜ Pass / ⬜ Fail

---

## 🛡️ Priority 2: Important Improvements Tests

### Input Validation
- [ ] **Test 13:** Try signup with invalid email format
  - Expected: Validation error, signup fails
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 14:** Try signup with password less than 6 characters
  - Expected: Validation error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 15:** Try signin with invalid email format
  - Expected: Validation error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 16:** Try place order with negative total amount
  - Expected: Validation error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 17:** Try place order with empty items array
  - Expected: Validation error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 18:** Try add product with negative price
  - Expected: Validation error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 19:** Try update order status with invalid status value
  - Expected: Validation error
  - Status: ⬜ Pass / ⬜ Fail

### Error Handling
- [ ] **Test 20:** Access non-existent route (e.g., `/api/v1/user/invalid`)
  - Expected: 404 error with consistent format
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 21:** Try to create duplicate user (same email)
  - Expected: Proper error message about duplicate entry
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 22:** Try to access order with invalid ID format
  - Expected: Proper error message about invalid ID
  - Status: ⬜ Pass / ⬜ Fail

### Environment Variable Validation
- [ ] **Test 23:** Remove `JWT_SECRET` from `.env` and restart server
  - Expected: Server exits with clear error message
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 24:** Remove `MONGO_URI` from `.env` and restart server
  - Expected: Server exits with clear error message
  - Status: ⬜ Pass / ⬜ Fail

### CORS Configuration
- [ ] **Test 25:** Set `FRONTEND_URL` to different origin in `.env`
  - Expected: CORS error when accessing from wrong origin
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 26:** Set correct `FRONTEND_URL` in `.env`
  - Expected: API calls work from frontend
  - Status: ⬜ Pass / ⬜ Fail

### Rate Limiting
- [ ] **Test 27:** Make 101 rapid requests to `/api/v1/user/menu`
  - Expected: 101st request gets rate limit error
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 28:** Make 6 rapid signin attempts
  - Expected: 6th attempt gets rate limit error
  - Status: ⬜ Pass / ⬜ Fail

### Request Logging
- [ ] **Test 29:** Check backend console for request logs
  - Expected: Each request is logged with method, path, status
  - Status: ⬜ Pass / ⬜ Fail

---

## 🎯 Functional Tests

### Authentication Flow
- [ ] **Test 30:** Complete signup flow (signup → verify OTP → auto-login)
  - Expected: User created, verified, and logged in
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 31:** Login with correct credentials
  - Expected: Token received, user logged in
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 32:** Login with incorrect credentials
  - Expected: Error message, not logged in
  - Status: ⬜ Pass / ⬜ Fail

### Order Flow
- [ ] **Test 33:** Place order as customer
  - Expected: Order created successfully
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 34:** Place order as admin (dine-in)
  - Expected: Order created with table number
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 35:** View orders as customer
  - Expected: Only own orders visible
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 36:** View all orders as admin
  - Expected: All orders visible
  - Status: ⬜ Pass / ⬜ Fail

### Admin Functions
- [ ] **Test 37:** Add new product as admin
  - Expected: Product added successfully
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 38:** Update order status as admin
  - Expected: Status updated successfully
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 39:** Toggle product stock as admin
  - Expected: Stock status toggled
  - Status: ⬜ Pass / ⬜ Fail

- [ ] **Test 40:** Delete product as admin
  - Expected: Product deleted successfully
  - Status: ⬜ Pass / ⬜ Fail

---

## 📊 Test Results Summary

**Total Tests:** 40
**Passed:** ___
**Failed:** ___
**Pass Rate:** ___%

---

## 🐛 Issues Found

Document any issues discovered during testing:

1. 
2. 
3. 

---

## ✅ Sign-off

- [ ] All Priority 1 tests passed
- [ ] All Priority 2 tests passed
- [ ] All functional tests passed
- [ ] Application ready for production use

**Tested by:** _________________  
**Date:** _________________  
**Notes:** _________________

