# 🔐 Complete Security & Development Workflow Guide

## Table of Contents
- [Overview](#overview)
- [Security Architecture](#security-architecture)
- [Development Setup](#development-setup)
- [Security Features](#security-features)
- [CRUD Development Workflow](#crud-development-workflow)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This guide provides a comprehensive overview of the enterprise-grade security implementation and development workflow for the DEPLLC CRM system. The project implements multi-layered security with role-based access control, audit logging, rate limiting, and comprehensive input validation.

### Technology Stack
- **Framework**: Next.js 15.5.3 with App Router
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with JWT strategy
- **Security**: Multi-layered enterprise security stack
- **Frontend**: React with TypeScript and Tailwind CSS
- **State Management**: Redux Toolkit with persistence

## Security Architecture

### 🏗️ Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
│  • Input validation  • XSS protection  • CSRF protection   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   Middleware Layer                          │
│  • Rate limiting  • Request validation  • Security headers │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Layer                       │
│  • JWT tokens  • Session management  • Role verification   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                 Authorization Layer                         │
│  • RBAC permissions  • Resource access  • Action control   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   Business Layer                            │
│  • Input sanitization  • Business logic  • Data validation │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  • Encrypted storage  • Audit trails  • Backup systems    │
└─────────────────────────────────────────────────────────────┘
```

### 🔑 Core Security Components

#### 1. Rate Limiting System (`lib/security/rate-limiter.ts`)
```typescript
// Rate limiting configuration
const rateLimiters = {
  auth: 5 requests per minute
  api: 100 requests per minute  
  sensitive: 3 requests per minute
}
```

**Features:**
- DDoS protection
- Brute force attack prevention
- Different limits for different endpoints
- IP-based tracking
- Exponential backoff

#### 2. Input Validation & Sanitization (`lib/security/validation.ts`)
```typescript
// Comprehensive input validation
export class SecurityUtils {
  static validateInput(data: any, schema: ZodSchema): ValidationResult
  static sanitizeString(input: string): string
  static checkPasswordStrength(password: string): PasswordStrength
  static detectSQLInjection(input: string): boolean
  static detectXSS(input: string): boolean
}
```

**Protection Against:**
- SQL Injection attacks
- XSS (Cross-site scripting)
- NoSQL injection
- Path traversal
- Command injection

#### 3. Audit Logging (`lib/security/audit-logger.ts`)
```typescript
// Complete audit trail
export class AuditLogger {
  static logUserAction(details: UserActionDetails): Promise<void>
  static logAuthEvent(details: AuthEventDetails): Promise<void>
  static logSecurityEvent(details: SecurityEventDetails): Promise<void>
  static logDataAccess(details: DataAccessDetails): Promise<void>
}
```

**Tracks:**
- User authentication events
- Data access and modifications
- Permission changes
- Security violations
- System administration actions

#### 4. Role-Based Access Control (`lib/security/permissions.ts`)
```typescript
// Hierarchical permission system
export class PermissionManager {
  static canAccess(user: User, resource: string, action: string): boolean
  static canModify(user: User, resource: string, resourceId?: string): boolean
  static hasRole(user: User, requiredRole: UserRole): boolean
  static getPermissions(user: User): Permission[]
}
```

**Role Hierarchy:**
- **Admin**: Full system access, user management, security configuration
- **Manager**: Department access, team management, reporting
- **User**: Personal data access, basic operations

#### 5. Error Handling (`lib/security/error-handler.ts`)
```typescript
// Secure error handling
export class SecurityErrorHandler {
  static handleAPIError(error: Error, req: NextRequest): NextResponse
  static logSecurityViolation(violation: SecurityViolation): void
  static sanitizeErrorResponse(error: Error): PublicError
}
```

**Features:**
- Prevents information leakage
- Logs security violations
- Returns sanitized error messages
- Tracks attack patterns

## Development Setup

### 🚀 Environment Configuration

1. **Clone and Install**
```bash
git clone <repository-url>
cd depllc-crm
npm install
```

2. **Environment Variables**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/depllc-crm
MONGODB_DB=depllc-crm

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUDIT_LOG_RETENTION_DAYS=365

# Development
NODE_ENV=development
```

3. **Start Development Server**
```bash
npm run dev
```

### 📁 Project Structure
```
lib/
├── security/              # Security layer
│   ├── rate-limiter.ts   # Rate limiting
│   ├── validation.ts     # Input validation
│   ├── audit-logger.ts   # Audit logging
│   ├── permissions.ts    # RBAC system
│   └── error-handler.ts  # Error handling
├── auth-config.ts        # Authentication config
├── mongodb.ts           # Database connection
└── utils.ts             # Utility functions

app/
├── api/                 # API routes
│   ├── auth/           # Authentication endpoints
│   └── users/          # User management endpoints
├── auth/               # Authentication pages
├── dashboard/          # Dashboard pages
└── users/              # User management pages

components/
├── auth/               # Authentication components
├── layout/             # Layout components
├── ui/                 # UI components
└── users/              # User management components
```

## Security Features

### 🛡️ Authentication & Authorization

#### JWT Token Management
```typescript
// Secure token configuration
const jwtConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  maxAge: 24 * 60 * 60, // 24 hours
  encryption: true,
  signingKey: process.env.JWT_SIGNING_KEY,
  encryptionKey: process.env.JWT_ENCRYPTION_KEY,
}
```

#### Session Security
- Secure HTTP-only cookies
- CSRF protection
- Session rotation
- Automatic expiration
- Device tracking

### 🔒 Data Protection

#### Encryption at Rest
```typescript
// Sensitive data encryption
const encryptedFields = {
  email: 'AES-256-GCM',
  phone: 'AES-256-GCM',
  address: 'AES-256-GCM',
}
```

#### Password Security
```typescript
// Password requirements
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  hashAlgorithm: 'bcrypt',
  saltRounds: 12,
}
```

### 🚫 Attack Prevention

#### SQL Injection Prevention
```typescript
// Using parameterized queries
const user = await User.findOne({ 
  email: sanitizeString(email) 
}).exec();
```

#### XSS Prevention
```typescript
// Input sanitization
const sanitizedInput = SecurityUtils.sanitizeString(userInput);
const validatedData = userSchema.parse(sanitizedInput);
```

#### CSRF Protection
```typescript
// CSRF token validation
const csrfToken = await getCsrfToken();
const isValidToken = await validateCsrfToken(token, csrfToken);
```

## CRUD Development Workflow

### 🏗️ Creating New CRUD Operations

#### Step 1: Define the Data Model
```typescript
// models/Entity.ts
import { Schema, model, models } from 'mongoose';

interface IEntity {
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const EntitySchema = new Schema<IEntity>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: true },
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => ({ ...ret, id: ret._id, _id: undefined }) }
});

export const Entity = models.Entity || model<IEntity>('Entity', EntitySchema);
```

#### Step 2: Create Validation Schema
```typescript
// lib/validations/entity.ts
import { z } from 'zod';

export const createEntitySchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Name contains invalid characters'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const updateEntitySchema = createEntitySchema.partial();

export type CreateEntityData = z.infer<typeof createEntitySchema>;
export type UpdateEntityData = z.infer<typeof updateEntitySchema>;
```

#### Step 3: Implement API Routes
```typescript
// app/api/entities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { SecurityUtils } from '@/lib/security/validation';
import { PermissionManager } from '@/lib/security/permissions';
import { AuditLogger } from '@/lib/security/audit-logger';
import { SecurityErrorHandler } from '@/lib/security/error-handler';
import { createEntitySchema } from '@/lib/validations/entity';
import { Entity } from '@/models/Entity';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await rateLimiter.checkRateLimit(request, 'api');

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization
    if (!PermissionManager.canAccess(session.user, 'entities', 'read')) {
      await AuditLogger.logSecurityEvent({
        userId: session.user.id,
        event: 'unauthorized_access_attempt',
        resource: 'entities',
        details: { action: 'read', ip: request.ip }
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const search = searchParams.get('search') || '';

    // Input validation
    const sanitizedSearch = SecurityUtils.sanitizeString(search);

    // Build query
    const query = sanitizedSearch 
      ? { name: { $regex: sanitizedSearch, $options: 'i' } }
      : {};

    // Execute query with pagination
    const [entities, total] = await Promise.all([
      Entity.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Entity.countDocuments(query)
    ]);

    // Audit logging
    await AuditLogger.logDataAccess({
      userId: session.user.id,
      action: 'list_entities',
      resource: 'entities',
      details: { page, limit, search: sanitizedSearch, resultCount: entities.length }
    });

    return NextResponse.json({
      success: true,
      data: entities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return SecurityErrorHandler.handleAPIError(error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for write operations)
    await rateLimiter.checkRateLimit(request, 'sensitive');

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization
    if (!PermissionManager.canAccess(session.user, 'entities', 'create')) {
      await AuditLogger.logSecurityEvent({
        userId: session.user.id,
        event: 'unauthorized_access_attempt',
        resource: 'entities',
        details: { action: 'create', ip: request.ip }
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = SecurityUtils.validateInput(body, createEntitySchema);
    
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.errors
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Create entity
    const entity = new Entity({
      ...validatedData,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });

    await entity.save();

    // Audit logging
    await AuditLogger.logUserAction({
      userId: session.user.id,
      action: 'create_entity',
      resource: 'entities',
      resourceId: entity._id.toString(),
      details: { name: entity.name }
    });

    return NextResponse.json({
      success: true,
      data: entity,
      message: 'Entity created successfully'
    }, { status: 201 });

  } catch (error) {
    return SecurityErrorHandler.handleAPIError(error, request);
  }
}
```

#### Step 4: Individual Resource Routes
```typescript
// app/api/entities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { SecurityUtils } from '@/lib/security/validation';
import { PermissionManager } from '@/lib/security/permissions';
import { AuditLogger } from '@/lib/security/audit-logger';
import { SecurityErrorHandler } from '@/lib/security/error-handler';
import { updateEntitySchema } from '@/lib/validations/entity';
import { Entity } from '@/models/Entity';
import { isValidObjectId } from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await rateLimiter.checkRateLimit(request, 'api');

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ID format
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 });
    }

    // Authorization
    if (!PermissionManager.canAccess(session.user, 'entities', 'read')) {
      await AuditLogger.logSecurityEvent({
        userId: session.user.id,
        event: 'unauthorized_access_attempt',
        resource: 'entities',
        details: { action: 'read', entityId: params.id, ip: request.ip }
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch entity
    const entity = await Entity.findById(params.id).lean();
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Check specific resource access
    if (!PermissionManager.canModify(session.user, 'entities', params.id)) {
      // Allow read access but hide sensitive fields for non-owners
      const publicEntity = {
        id: entity._id,
        name: entity.name,
        status: entity.status,
        createdAt: entity.createdAt,
      };
      
      await AuditLogger.logDataAccess({
        userId: session.user.id,
        action: 'view_entity_public',
        resource: 'entities',
        resourceId: params.id
      });

      return NextResponse.json({
        success: true,
        data: publicEntity
      });
    }

    // Full access for authorized users
    await AuditLogger.logDataAccess({
      userId: session.user.id,
      action: 'view_entity',
      resource: 'entities',
      resourceId: params.id
    });

    return NextResponse.json({
      success: true,
      data: entity
    });

  } catch (error) {
    return SecurityErrorHandler.handleAPIError(error, request);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await rateLimiter.checkRateLimit(request, 'sensitive');

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ID format
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 });
    }

    // Authorization
    if (!PermissionManager.canModify(session.user, 'entities', params.id)) {
      await AuditLogger.logSecurityEvent({
        userId: session.user.id,
        event: 'unauthorized_modification_attempt',
        resource: 'entities',
        details: { action: 'update', entityId: params.id, ip: request.ip }
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current entity for change tracking
    const currentEntity = await Entity.findById(params.id);
    if (!currentEntity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Parse and validate input
    const body = await request.json();
    const validationResult = SecurityUtils.validateInput(body, updateEntitySchema);
    
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.errors
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Track changes for audit
    const changes: Record<string, { from: any; to: any }> = {};
    Object.entries(validatedData).forEach(([key, newValue]) => {
      const oldValue = (currentEntity as any)[key];
      if (oldValue !== newValue) {
        changes[key] = { from: oldValue, to: newValue };
      }
    });

    // Update entity
    const updatedEntity = await Entity.findByIdAndUpdate(
      params.id,
      {
        ...validatedData,
        updatedBy: session.user.id,
      },
      { new: true, runValidators: true }
    );

    // Audit logging
    await AuditLogger.logUserAction({
      userId: session.user.id,
      action: 'update_entity',
      resource: 'entities',
      resourceId: params.id,
      details: { changes }
    });

    return NextResponse.json({
      success: true,
      data: updatedEntity,
      message: 'Entity updated successfully'
    });

  } catch (error) {
    return SecurityErrorHandler.handleAPIError(error, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await rateLimiter.checkRateLimit(request, 'sensitive');

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ID format
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 });
    }

    // Authorization (only admins can delete)
    if (!PermissionManager.hasRole(session.user, 'Admin')) {
      await AuditLogger.logSecurityEvent({
        userId: session.user.id,
        event: 'unauthorized_deletion_attempt',
        resource: 'entities',
        details: { entityId: params.id, ip: request.ip }
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get entity before deletion for audit
    const entity = await Entity.findById(params.id);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Soft delete (mark as inactive) instead of hard delete
    const deletedEntity = await Entity.findByIdAndUpdate(
      params.id,
      {
        status: 'inactive',
        updatedBy: session.user.id,
      },
      { new: true }
    );

    // Audit logging
    await AuditLogger.logUserAction({
      userId: session.user.id,
      action: 'delete_entity',
      resource: 'entities',
      resourceId: params.id,
      details: { name: entity.name, type: 'soft_delete' }
    });

    return NextResponse.json({
      success: true,
      data: deletedEntity,
      message: 'Entity deleted successfully'
    });

  } catch (error) {
    return SecurityErrorHandler.handleAPIError(error, request);
  }
}
```

#### Step 5: Frontend Components

##### Data Table Component
```typescript
// components/entities/entity-table.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye } from 'lucide-react';
import { PermissionManager } from '@/lib/security/permissions';

interface Entity {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export function EntityTable() {
  const { data: session } = useSession();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch entities
  const fetchEntities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search,
      });

      const response = await fetch(`/api/entities?${params}`);
      const data = await response.json();

      if (data.success) {
        setEntities(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to fetch entities:', data.error);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [currentPage, search]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entity?')) return;

    try {
      const response = await fetch(`/api/entities/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchEntities(); // Refresh the list
      } else {
        alert('Failed to delete entity: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
      alert('An error occurred while deleting the entity');
    }
  };

  // Check permissions
  const canCreate = session?.user && PermissionManager.canAccess(session.user, 'entities', 'create');
  const canEdit = session?.user && PermissionManager.canAccess(session.user, 'entities', 'update');
  const canDelete = session?.user && PermissionManager.hasRole(session.user, 'Admin');

  if (loading) {
    return <div className="flex justify-center p-8">Loading entities...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Entities</h2>
        {canCreate && (
          <Button onClick={() => window.location.href = '/entities/new'}>
            Create Entity
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search entities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => (
              <TableRow key={entity.id}>
                <TableCell className="font-medium">{entity.name}</TableCell>
                <TableCell>{entity.description || '-'}</TableCell>
                <TableCell>
                  <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                    {entity.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(entity.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/entities/${entity.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/entities/${entity.id}/edit`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
```

##### Form Component
```typescript
// components/entities/entity-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEntitySchema, type CreateEntityData } from '@/lib/validations/entity';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EntityFormProps {
  initialData?: Partial<CreateEntityData>;
  entityId?: string;
  mode: 'create' | 'edit';
}

export function EntityForm({ initialData, entityId, mode }: EntityFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateEntityData>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      status: initialData?.status || 'active',
    },
  });

  const onSubmit = async (data: CreateEntityData) => {
    try {
      setIsLoading(true);

      const url = mode === 'create' ? '/api/entities' : `/api/entities/${entityId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/entities');
        router.refresh();
      } else {
        if (result.details) {
          // Handle validation errors
          Object.entries(result.details).forEach(([field, messages]) => {
            form.setError(field as keyof CreateEntityData, {
              message: (messages as string[]).join(', '),
            });
          });
        } else {
          alert(`Failed to ${mode} entity: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(`Error ${mode}ing entity:`, error);
      alert(`An error occurred while ${mode}ing the entity`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create Entity' : 'Edit Entity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter entity name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter entity description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? `${mode === 'create' ? 'Creating' : 'Updating'}...`
                  : `${mode === 'create' ? 'Create' : 'Update'} Entity`
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

### 🔐 Security Best Practices

#### Input Validation
```typescript
// Always validate and sanitize input
const validationResult = SecurityUtils.validateInput(userInput, schema);
if (!validationResult.success) {
  return NextResponse.json({
    error: 'Validation failed',
    details: validationResult.errors
  }, { status: 400 });
}
```

#### Authorization Checks
```typescript
// Check permissions before any operation
if (!PermissionManager.canAccess(user, resource, action)) {
  await AuditLogger.logSecurityEvent({
    userId: user.id,
    event: 'unauthorized_access_attempt',
    resource,
    details: { action, ip: request.ip }
  });
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

#### Audit Logging
```typescript
// Log all significant actions
await AuditLogger.logUserAction({
  userId: session.user.id,
  action: 'resource_action',
  resource: 'resource_name',
  resourceId: id,
  details: { relevant: 'information' }
});
```

#### Error Handling
```typescript
// Use centralized error handling
try {
  // Your operation here
} catch (error) {
  return SecurityErrorHandler.handleAPIError(error, request);
}
```

### 🏗️ Development Best Practices

#### API Route Structure
1. **Rate limiting** - Always apply appropriate rate limits
2. **Authentication** - Verify user session
3. **Authorization** - Check user permissions
4. **Input validation** - Validate and sanitize all inputs
5. **Business logic** - Implement the actual functionality
6. **Audit logging** - Log the action
7. **Error handling** - Return appropriate errors

#### Frontend Component Structure
1. **Permission checks** - Verify user can perform actions
2. **Loading states** - Show loading indicators
3. **Error handling** - Display user-friendly errors
4. **Input validation** - Client-side validation for UX
5. **Security** - Sanitize display data

#### Database Operations
1. **Use parameterized queries** - Prevent injection attacks
2. **Validate ObjectIds** - Check ID format before queries
3. **Implement soft deletes** - Mark as inactive instead of hard delete
4. **Track changes** - Log what changed for audit trails
5. **Use transactions** - For complex operations

### 🔄 Testing Strategy

#### Security Testing
```typescript
// Test rate limiting
test('should enforce rate limits', async () => {
  // Make requests exceeding rate limit
  // Verify 429 status code
});

// Test authorization
test('should require proper permissions', async () => {
  // Attempt access without permissions
  // Verify 403 status code
});

// Test input validation
test('should validate input data', async () => {
  // Send invalid data
  // Verify validation errors
});
```

#### Integration Testing
```typescript
// Test complete CRUD flow
test('should complete full CRUD operations', async () => {
  // Create resource
  // Read resource
  // Update resource
  // Delete resource
  // Verify audit logs
});
```

## Troubleshooting

### 🐛 Common Issues

#### Rate Limiting Issues
```typescript
// Issue: Rate limit exceeded
// Solution: Check rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  points: 100, // Increase if needed
  duration: 60, // seconds
});
```

#### Authentication Issues
```typescript
// Issue: JWT token errors
// Solution: Check environment variables
NEXTAUTH_SECRET=your-very-long-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

#### Permission Issues
```typescript
// Issue: Access denied
// Solution: Verify user roles and permissions
const userRole = session.user.role;
const hasPermission = PermissionManager.canAccess(user, resource, action);
```

#### Validation Issues
```typescript
// Issue: Validation failures
// Solution: Check schema definitions
const schema = z.object({
  field: z.string().min(1, 'Field is required'),
});
```

### 🔧 Debug Tools

#### Audit Log Queries
```typescript
// Check recent security events
const securityEvents = await AuditLog.find({
  action: { $regex: /security|unauthorized/ },
  timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
}).sort({ timestamp: -1 });
```

#### Rate Limit Status
```typescript
// Check rate limit status for IP
const rateLimitStatus = await rateLimiter.get(ipAddress);
console.log('Remaining points:', rateLimitStatus?.remainingPoints);
```

#### Permission Testing
```typescript
// Test user permissions
const permissions = PermissionManager.getPermissions(user);
console.log('User permissions:', permissions);
```

## Conclusion

This security and development workflow provides enterprise-grade protection while maintaining developer productivity. The multi-layered security approach ensures comprehensive protection against common attacks while the structured development workflow enables rapid and secure feature development.

Key benefits:
- **🛡️ Comprehensive Security**: Multi-layered protection against all common attack vectors
- **📊 Complete Audit Trail**: Full tracking of all user actions and system events
- **🔐 Role-Based Access**: Hierarchical permission system with fine-grained control
- **🚀 Developer Productivity**: Structured workflow for rapid feature development
- **📈 Scalability**: Enterprise-ready architecture that scales with your needs

Remember to regularly review and update security configurations, monitor audit logs, and follow the established patterns when adding new features.

---

**Security is not a destination, it's a journey. Stay vigilant, stay secure! 🔒**
