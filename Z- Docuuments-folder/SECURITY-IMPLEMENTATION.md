# Enhanced User CRUD Security Implementation

## 🔒 Security Features Implemented

### 1. **Rate Limiting & DDoS Protection**
- **Authentication Rate Limiting**: 5 attempts per 15 minutes per IP
- **API Rate Limiting**: 100 requests per hour per IP  
- **Sensitive Operations**: 10 requests per hour per IP
- **Headers**: Proper rate limit headers with retry-after information

### 2. **Input Validation & Sanitization**
- **XSS Prevention**: Sanitizes all string inputs, removes script tags and event handlers
- **SQL Injection Protection**: Validates against malicious patterns
- **Enhanced Zod Validation**: Extended schemas with security checks
- **Email Validation**: RFC-compliant email validation with additional security checks
- **Password Strength**: Comprehensive password strength validation
- **ObjectId Validation**: Validates MongoDB ObjectId format

### 3. **Role-Based Access Control (RBAC)**
- **Permission System**: Granular permissions for different operations
- **Role Hierarchy**: Admin > Manager > User with proper validation
- **Resource-Based Access**: Fine-grained control over resource access
- **Self-Management**: Users can only modify their own profiles (except admins/managers)

### 4. **Comprehensive Audit Logging**
- **User Operations**: All CRUD operations logged with details
- **Authentication Events**: Login/logout attempts and failures
- **Security Events**: Failed permission checks, validation errors
- **Data Changes**: Before/after state tracking for updates
- **TTL Indexing**: Automatic log cleanup after 1 year
- **Client Information**: IP address and user agent tracking

### 5. **Error Handling & Security**
- **Consistent Error Responses**: Standardized error format
- **Security-Aware Errors**: No sensitive information leakage
- **Error Classification**: Proper error codes for different scenarios
- **Stack Trace Control**: Development-only detailed errors

### 6. **Data Protection**
- **Password Exclusion**: Never returns password fields in responses
- **Input Sanitization**: All user inputs sanitized before storage
- **Email Normalization**: Consistent email format (lowercase)
- **Field Validation**: Type-safe validation for all data fields

## 🛡️ Security Middleware Stack

### Rate Limiter (`lib/security/rate-limiter.ts`)
```typescript
// Usage examples:
await applyRateLimit(request, "auth")     // For authentication
await applyRateLimit(request, "api")      // For general API calls
await applyRateLimit(request, "sensitive") // For sensitive operations
```

### Input Validation (`lib/security/validation.ts`)
```typescript
// Enhanced validation with security checks
const result = SecurityUtils.validateInput(input, 'email')
const passwordStrength = SecurityUtils.checkPasswordStrength(password)
```

### Permission Management (`lib/security/permissions.ts`)
```typescript
// Permission checks
PermissionManager.canCreateUser(session)
PermissionManager.canModifyUser(session, targetUserId)
PermissionManager.canDeleteUser(session, targetUserId)
```

### Audit Logging (`lib/security/audit-logger.ts`)
```typescript
// Comprehensive logging
await AuditLogger.logUserCreation({...})
await AuditLogger.logUserUpdate({...})
await AuditLogger.logUserDeletion({...})
```

## 🔐 API Security Implementation

### User CRUD Endpoints

#### GET `/api/users` - List Users
- ✅ Rate limiting (100 req/hour)
- ✅ Authentication required
- ✅ Permission checks (READ_ALL_USERS)
- ✅ Input sanitization for search terms
- ✅ SQL injection protection
- ✅ Audit logging for access attempts

#### POST `/api/users` - Create User
- ✅ Rate limiting (10 req/hour - sensitive)
- ✅ Authentication required
- ✅ Permission checks (CREATE_USER)
- ✅ Role assignment validation
- ✅ Enhanced input validation
- ✅ Password strength validation
- ✅ Duplicate email detection
- ✅ Comprehensive audit logging

#### GET `/api/users/[id]` - Get User
- ✅ Rate limiting (100 req/hour)
- ✅ Authentication required
- ✅ ObjectId validation
- ✅ Permission checks (self or admin/manager)
- ✅ Audit logging for access

#### PUT `/api/users/[id]` - Update User
- ✅ Rate limiting (10 req/hour - sensitive)
- ✅ Authentication required
- ✅ ObjectId validation
- ✅ Permission checks with role hierarchy
- ✅ Email conflict detection
- ✅ Input sanitization
- ✅ Change tracking and audit logging

#### DELETE `/api/users/[id]` - Delete User
- ✅ Rate limiting (10 req/hour - sensitive)
- ✅ Authentication required
- ✅ ObjectId validation
- ✅ Admin-only permission
- ✅ Self-deletion prevention
- ✅ Comprehensive audit logging

## 🚀 Testing the Implementation

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test User Registration
```bash
# Valid registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "user",
    "department": "Engineering"
  }'
```

### 3. Test User Login
Navigate to `http://localhost:3000/auth/login` and use the registered credentials.

### 4. Test User CRUD Operations
After logging in, navigate to `http://localhost:3000/users` to test:
- ✅ View all users (with search and pagination)
- ✅ Create new users (admin/manager only)
- ✅ Edit user details
- ✅ Delete users (admin only)

### 5. Test Security Features
- ✅ Rate limiting: Make multiple rapid requests
- ✅ Permission checks: Try accessing as different user roles
- ✅ Input validation: Submit invalid or malicious data
- ✅ Audit logs: Check the database for audit entries

## 📊 Monitoring & Compliance

### Audit Log Queries
```javascript
// Get user activity logs
db.auditlogs.find({ userId: "USER_ID" }).sort({ timestamp: -1 })

// Get failed login attempts
db.auditlogs.find({ 
  action: "LOGIN_FAILED", 
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) } 
})

// Get security violations
db.auditlogs.find({ 
  success: false,
  $or: [
    { action: /UNAUTHORIZED/ },
    { action: /VALIDATION_ERROR/ }
  ]
})
```

### Security Headers
All API responses include appropriate security headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining` 
- `X-RateLimit-Reset`
- `Retry-After` (for rate limit exceeded)

## 🔧 Configuration

### Environment Variables Required
```env
MONGODB_URI=mongodb://localhost:27017/crm
NEXTAUTH_SECRET=your-super-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Security Settings
- Password minimum length: 6 characters
- Password strength requirements: Mixed case, numbers, special characters
- Rate limit memory storage (can be upgraded to Redis)
- Audit logs auto-expire after 1 year

## 🛡️ Production Recommendations

1. **Use Redis for Rate Limiting** - For distributed applications
2. **Implement HTTPS** - All communication should be encrypted
3. **Add CSP Headers** - Content Security Policy for XSS protection
4. **Monitor Audit Logs** - Set up alerts for suspicious activities
5. **Regular Security Audits** - Review permissions and access patterns
6. **Backup Strategy** - Secure backup of audit logs and user data

## 📚 Security Best Practices Implemented

- ✅ **Principle of Least Privilege**: Users get minimum required permissions
- ✅ **Defense in Depth**: Multiple layers of security
- ✅ **Input Validation**: All inputs validated and sanitized
- ✅ **Audit Trail**: Complete activity logging
- ✅ **Error Handling**: Secure error responses
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **Session Management**: Secure JWT handling
- ✅ **Password Security**: Strong password requirements and hashing
