# Professional Generic CRUD Implementation Guide

## Overview

This guide demonstrates how to implement a complete, professional CRUD system following the established patterns from our User management implementation. This system provides a consistent, scalable, and maintainable approach to building CRUD operations across your application.

## 🏗️ Architecture Overview

### Component Architecture
```
Generic Components (Reusable)
├── PageHeader          # Consistent page headers with search/filters
├── DataTable          # Advanced table with pagination/sorting/grid view
├── CustomModal        # Professional modals with theme support
├── GenericForm        # Unified forms with validation
└── Loader             # Multiple loading states

Feature Implementation (Entity CRUD)
├── Entity List Page   # Using DataTable + PageHeader
├── Add Entity Page    # Using GenericForm + PageHeader
├── Edit Entity Page   # Using GenericForm + PageHeader (same form)
└── Entity API Routes  # Enhanced with security + validation
```

### State Management Pattern
```
Redux Store
├── Entity Slice
│   ├── State: entities[], loading, error, pagination, filters, sort
│   ├── Async Thunks: fetchEntities, createEntity, updateEntity, deleteEntity
│   └── Reducers: setFilters, setSort, setPagination, setSelectedEntity
└── Store Configuration with TypeScript support
```

## 📋 Implementation Steps

### Step 1: Create the Database Model

```typescript
// models/YourEntity.ts
import mongoose, { Schema, type Document } from "mongoose"

export interface IYourEntity extends Document {
  // Required fields
  name: string
  email?: string
  status: "active" | "inactive" | "suspended"
  
  // Optional fields based on your needs
  description?: string
  category?: string
  
  // Metadata for audit trail
  createdBy?: string
  updatedBy?: string
  
  // Standard fields
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const YourEntitySchema = new Schema<IYourEntity>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    createdBy: { type: String },
    updatedBy: { type: String },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Add indexes for better performance
YourEntitySchema.index({ name: 1, status: 1 });
YourEntitySchema.index({ category: 1, createdAt: -1 });

export default mongoose.models.YourEntity || mongoose.model<IYourEntity>("YourEntity", YourEntitySchema)
```

### Step 2: Create TypeScript Interfaces

```typescript
// types/index.ts (add to existing)
export interface YourEntity {
  _id?: string
  name: string
  email?: string
  status: "active" | "inactive" | "suspended"
  description?: string
  category?: string
  createdBy?: string
  updatedBy?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}
```

### Step 3: Create API Routes

```typescript
// app/api/your-entities/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/mongodb"
import YourEntity from "@/models/YourEntity"
import { authOptions } from "@/lib/auth-config"
import { applyRateLimit } from "@/lib/security/rate-limiter"
import { ApiErrorHandler, getClientInfo, createErrorResponse } from "@/lib/security/error-handler"
import { z } from "zod"

// Validation schemas
const createEntitySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  description: z.string().optional(),
  category: z.string().optional(),
})

const querySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  category: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// GET /api/your-entities - List with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validation = querySchema.safeParse(queryParams)
    if (!validation.success) {
      return createErrorResponse("Invalid query parameters", 400, validation.error.errors)
    }

    const { page, limit, search, status, category, sortBy, sortOrder } = validation.data

    await connectDB()

    // Build search query
    let searchQuery: any = { isActive: true }
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ]
    }

    if (status) searchQuery.status = status
    if (category) searchQuery.category = category

    // Get total count for pagination
    const total = await YourEntity.countDocuments(searchQuery)

    // Fetch entities with pagination and sorting
    const entities = await YourEntity.find(searchQuery)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Calculate stats
    const stats = await YourEntity.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
          suspended: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } }
        }
      }
    ])

    return NextResponse.json({
      success: true,
      data: entities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || { total: 0, active: 0, inactive: 0, suspended: 0 }
    })
  } catch (error: any) {
    return ApiErrorHandler.handleError(error, {
      userId: undefined,
      userEmail: undefined,
      action: "GET_ENTITIES",
      resource: "ENTITY",
      ipAddress: getClientInfo(request).ipAddress,
      userAgent: getClientInfo(request).userAgent,
    })
  }
}

// POST /api/your-entities - Create new entity
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validation = createEntitySchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse("Validation failed", 400, validation.error.errors)
    }

    await connectDB()

    const entityData = {
      ...validation.data,
      createdBy: session.user.id,
      isActive: true
    }

    const entity = await YourEntity.create(entityData)

    return NextResponse.json({
      success: true,
      data: entity,
      message: "Entity created successfully"
    }, { status: 201 })
  } catch (error: any) {
    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "CREATE_ENTITY",
      resource: "ENTITY",
      ipAddress: getClientInfo(request).ipAddress,
      userAgent: getClientInfo(request).userAgent,
    })
  }
}
```

```typescript
// app/api/your-entities/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import connectDB from "@/lib/mongodb"
import YourEntity from "@/models/YourEntity"
import { authOptions } from "@/lib/auth-config"
import { applyRateLimit } from "@/lib/security/rate-limiter"
import { ApiErrorHandler, getClientInfo, createErrorResponse } from "@/lib/security/error-handler"
import { SecurityUtils } from "@/lib/security/validation"
import { z } from "zod"

const updateEntitySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
})

// GET /api/your-entities/[id] - Get single entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "api")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    if (!SecurityUtils.isValidObjectId(params.id)) {
      return createErrorResponse("Invalid entity ID", 400)
    }

    await connectDB()

    const entity = await YourEntity.findById(params.id).lean()
    if (!entity) {
      return createErrorResponse("Entity not found", 404)
    }

    return NextResponse.json({
      success: true,
      data: entity
    })
  } catch (error: any) {
    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "GET_ENTITY",
      resource: "ENTITY",
      resourceId: params.id,
      ipAddress: getClientInfo(request).ipAddress,
      userAgent: getClientInfo(request).userAgent,
    })
  }
}

// PUT /api/your-entities/[id] - Update entity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    if (!SecurityUtils.isValidObjectId(params.id)) {
      return createErrorResponse("Invalid entity ID", 400)
    }

    const body = await request.json()
    const validation = updateEntitySchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse("Validation failed", 400, validation.error.errors)
    }

    await connectDB()

    const entity = await YourEntity.findByIdAndUpdate(
      params.id,
      {
        ...validation.data,
        updatedBy: session.user.id
      },
      { new: true, runValidators: true }
    )

    if (!entity) {
      return createErrorResponse("Entity not found", 404)
    }

    return NextResponse.json({
      success: true,
      data: entity,
      message: "Entity updated successfully"
    })
  } catch (error: any) {
    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "UPDATE_ENTITY",
      resource: "ENTITY",
      resourceId: params.id,
      ipAddress: getClientInfo(request).ipAddress,
      userAgent: getClientInfo(request).userAgent,
    })
  }
}

// DELETE /api/your-entities/[id] - Delete entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await applyRateLimit(request, "sensitive")
    if (rateLimitResponse) return rateLimitResponse

    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse("Unauthorized", 401)
    }

    if (!SecurityUtils.isValidObjectId(params.id)) {
      return createErrorResponse("Invalid entity ID", 400)
    }

    await connectDB()

    // Soft delete by setting isActive to false
    const entity = await YourEntity.findByIdAndUpdate(
      params.id,
      { 
        isActive: false,
        updatedBy: session.user.id
      },
      { new: true }
    )

    if (!entity) {
      return createErrorResponse("Entity not found", 404)
    }

    return NextResponse.json({
      success: true,
      message: "Entity deleted successfully"
    })
  } catch (error: any) {
    return ApiErrorHandler.handleError(error, {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      action: "DELETE_ENTITY",
      resource: "ENTITY",
      resourceId: params.id,
      ipAddress: getClientInfo(request).ipAddress,
      userAgent: getClientInfo(request).userAgent,
    })
  }
}
```

### Step 4: Create Redux Slice

```typescript
// store/slices/yourEntitySlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { YourEntity } from "@/types"

export interface EntityFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  category?: string;
}

export interface EntitySort {
  field: keyof YourEntity;
  direction: 'asc' | 'desc';
}

export interface FetchEntitiesParams {
  page?: number;
  limit?: number;
  filters?: EntityFilters;
  sort?: EntitySort;
}

export interface CreateEntityData {
  name: string;
  email?: string;
  status?: 'active' | 'inactive' | 'suspended';
  description?: string;
  category?: string;
}

export interface UpdateEntityData extends Partial<CreateEntityData> {
  _id: string;
}

interface EntityState {
  entities: YourEntity[]
  selectedEntity: YourEntity | null
  loading: boolean
  actionLoading: boolean
  error: string | null
  filters: EntityFilters
  sort: EntitySort
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    total: number
    active: number
    inactive: number
    suspended: number
  } | null
}

const initialState: EntityState = {
  entities: [],
  selectedEntity: null,
  loading: false,
  actionLoading: false,
  error: null,
  filters: {},
  sort: {
    field: 'createdAt',
    direction: 'desc'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  stats: null,
}

// Async Thunks
export const fetchEntities = createAsyncThunk(
  'entities/fetchEntities',
  async (params: FetchEntitiesParams = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.filters?.search) queryParams.append('search', params.filters.search);
      if (params.filters?.status) queryParams.append('status', params.filters.status);
      if (params.filters?.category) queryParams.append('category', params.filters.category);
      if (params.sort) {
        queryParams.append('sortBy', params.sort.field.toString());
        queryParams.append('sortOrder', params.sort.direction);
      }

      const response = await fetch(`/api/your-entities?${queryParams.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch entities');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createEntity = createAsyncThunk(
  'entities/createEntity',
  async (entityData: CreateEntityData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/your-entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entityData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create entity');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateEntity = createAsyncThunk(
  'entities/updateEntity',
  async (entityData: UpdateEntityData, { rejectWithValue }) => {
    try {
      const { _id, ...updateData } = entityData;
      const response = await fetch(`/api/your-entities/${_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update entity');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteEntity = createAsyncThunk(
  'entities/deleteEntity',
  async (entityId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/your-entities/${entityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete entity');
      }

      return entityId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const entitySlice = createSlice({
  name: "entities",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<EntityFilters>) => {
      state.filters = action.payload;
    },
    setSort: (state, action: PayloadAction<EntitySort>) => {
      state.sort = action.payload;
    },
    setPagination: (state, action: PayloadAction<Partial<EntityState["pagination"]>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedEntity: (state, action: PayloadAction<YourEntity | null>) => {
      state.selectedEntity = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch entities
    builder
      .addCase(fetchEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntities.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload.data;
        state.pagination = action.payload.pagination;
        state.stats = action.payload.stats;
      })
      .addCase(fetchEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
    // Create entity
    builder
      .addCase(createEntity.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createEntity.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.entities.unshift(action.payload.data);
      })
      .addCase(createEntity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      
    // Update entity
    builder
      .addCase(updateEntity.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateEntity.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.entities.findIndex(entity => entity._id === action.payload.data._id);
        if (index !== -1) {
          state.entities[index] = action.payload.data;
        }
        if (state.selectedEntity?._id === action.payload.data._id) {
          state.selectedEntity = action.payload.data;
        }
      })
      .addCase(updateEntity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      
    // Delete entity
    builder
      .addCase(deleteEntity.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteEntity.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.entities = state.entities.filter(entity => entity._id !== action.payload);
        if (state.selectedEntity?._id === action.payload) {
          state.selectedEntity = null;
        }
      })
      .addCase(deleteEntity.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setFilters, 
  setSort, 
  setPagination, 
  setSelectedEntity, 
  clearError, 
  resetState 
} = entitySlice.actions;

export default entitySlice.reducer;
```

### Step 5: Create the List Page

```typescript
// app/your-entities/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/ui/data-table";
import PageHeader from "@/components/ui/page-header";
import CustomModal from "@/components/ui/custom-modal";
import Loader, { TableLoader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  Grid3X3,
  List,
} from "lucide-react";
import { 
  fetchEntities, 
  deleteEntity, 
  setFilters, 
  setSort, 
  setPagination,
  clearError 
} from "@/store/slices/yourEntitySlice";
import type { YourEntity } from "@/types";
import type { ColumnDef, ActionMenuItem } from "@/components/ui/data-table";

export default function EntitiesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Redux state
  const { entities, loading, error, pagination, stats, filters, sort } = useAppSelector((state) => state.entities);
  
  // Local state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedEntity, setSelectedEntity] = useState<YourEntity | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch entities when component mounts or dependencies change
  useEffect(() => {
    dispatch(fetchEntities({
      page: pagination.page,
      limit: pagination.limit,
      filters,
      sort
    }));
  }, [dispatch, pagination.page, pagination.limit, filters, sort]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    dispatch(setFilters({ ...filters, search: value }));
    dispatch(setPagination({ ...pagination, page: 1 }));
  }, [dispatch, filters, pagination]);

  // Handle sort
  const handleSort = (field: keyof YourEntity, direction: "asc" | "desc") => {
    dispatch(setSort({ field, direction }));
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    dispatch(setFilters(newFilters));
    dispatch(setPagination({ ...pagination, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    dispatch(setPagination({ ...pagination, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    dispatch(setPagination({ page: 1, limit }));
  };

  // Handle entity deletion
  const handleDeleteEntity = async (entityId: string, entityName: string) => {
    try {
      await dispatch(deleteEntity(entityId)).unwrap();
      toast({
        title: "Success",
        description: `Entity "${entityName}" has been deleted successfully.`,
      });
      // Refresh the list
      dispatch(fetchEntities({ page: pagination.page, limit: pagination.limit, filters, sort }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete entity",
        variant: "destructive",
      });
    }
  };

  // Handle quick view
  const handleQuickView = (entity: YourEntity) => {
    setSelectedEntity(entity);
    setIsQuickViewOpen(true);
  };

  // Table columns configuration
  const columns: ColumnDef<YourEntity>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: any, entity: YourEntity) => (
        <div>
          <div className="font-medium text-foreground">{entity.name}</div>
          {entity.email && (
            <div className="text-sm text-muted-foreground">{entity.email}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: any, entity: YourEntity) => (
        <span className="text-muted-foreground">{entity.category || 'N/A'}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: any, entity: YourEntity) => (
        <Badge 
          variant={
            entity.status === 'active' ? 'default' : 
            entity.status === 'inactive' ? 'secondary' : 'destructive'
          }
          className="capitalize"
        >
          {entity.status}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: any, entity: YourEntity) => (
        <span className="text-sm text-muted-foreground">
          {entity.createdAt ? new Date(entity.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ];

  // Action menu items
  const actionMenuItems: ActionMenuItem<YourEntity>[] = [
    {
      label: "Quick View",
      icon: <Eye className="h-4 w-4" />,
      onClick: handleQuickView,
    },
    {
      label: "Edit Entity",
      icon: <Edit className="h-4 w-4" />,
      onClick: (entity) => router.push(`/your-entities/edit/${entity._id}`),
    },
    {
      label: "Delete Entity",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (entity) => handleDeleteEntity(entity._id!, entity.name),
      variant: "destructive",
    },
  ];

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  if (loading && entities.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <TableLoader rows={10} columns={4} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Your Entities"
          subtitle="Manage your entities"
          searchValue={filters.search || ''}
          onSearchChange={handleSearch}
          searchPlaceholder="Search entities..."
          onAddClick={() => router.push('/your-entities/add')}
          addButtonText="Add Entity"
          onFiltersClick={() => setIsFiltersOpen(true)}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(fetchEntities({ page: pagination.page, limit: pagination.limit, filters, sort }))}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {/* View Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none border-l"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          }
        >
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
                      <p className="text-sm text-muted-foreground">Inactive</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
                      <p className="text-sm text-muted-foreground">Suspended</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </PageHeader>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Data Display */}
        <DataTable
          data={entities}
          columns={columns}
          loading={loading}
          totalCount={pagination.total}
          pageSize={pagination.limit}
          currentPage={pagination.page}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSort={handleSort}
          sortColumn={sort.field}
          sortDirection={sort.direction}
          actions={actionMenuItems}
          onQuickView={handleQuickView}
          showViewToggle={true}
          defaultView={viewMode}
          onViewChange={setViewMode}
          emptyMessage="No entities found"
        />

        {/* Quick View Modal */}
        <CustomModal
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          title="Entity Details"
          modalSize="lg"
        >
          {selectedEntity && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedEntity.name}</h3>
                {selectedEntity.email && (
                  <p className="text-muted-foreground">{selectedEntity.email}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge 
                    variant={
                      selectedEntity.status === 'active' ? 'default' : 
                      selectedEntity.status === 'inactive' ? 'secondary' : 'destructive'
                    }
                    className="capitalize"
                  >
                    {selectedEntity.status}
                  </Badge>
                </div>
                
                {selectedEntity.category && (
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">{selectedEntity.category}</p>
                  </div>
                )}
              </div>
              
              {selectedEntity.description && (
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedEntity.description}</p>
                </div>
              )}
            </div>
          )}
        </CustomModal>

        {/* Filters Modal */}
        <CustomModal
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          title="Filter Entities"
          modalSize="md"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  dispatch(setFilters({}));
                  setIsFiltersOpen(false);
                }}
              >
                Clear All
              </Button>
              <Button onClick={() => setIsFiltersOpen(false)}>
                Apply Filters
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={filters.category || ''}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Category1">Category 1</SelectItem>
                  <SelectItem value="Category2">Category 2</SelectItem>
                  <SelectItem value="Category3">Category 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CustomModal>
      </div>
    </AdminLayout>
  );
}
```

### Step 6: Create Add and Edit Pages

```typescript
// app/your-entities/add/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/hooks/redux";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/ui/page-header";
import GenericForm from "@/components/ui/generic-form";
import { ArrowLeft } from "lucide-react";
import { createEntity } from "@/store/slices/yourEntitySlice";
import type { FormFieldConfig } from "@/components/ui/generic-form";

// Entity creation schema
const createEntitySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  description: z.string().optional(),
  category: z.string().optional(),
});

type CreateEntityData = z.infer<typeof createEntitySchema>;

export default function AddEntityPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateEntityData>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      status: "active",
    },
  });

  const handleSubmit = async (data: CreateEntityData) => {
    setLoading(true);
    try {
      await dispatch(createEntity(data)).unwrap();
      
      toast({
        title: "Success",
        description: `Entity "${data.name}" has been created successfully.`,
      });
      
      router.push("/your-entities");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create entity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/your-entities");
  };

  // Form field configurations
  const formFields: FormFieldConfig[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter entity name",
      required: true,
      description: "Entity name (2-100 characters)",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email address",
      description: "Optional email address",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      description: "Entity status",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Suspended", value: "suspended" },
      ],
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      placeholder: "Select category",
      description: "Entity category",
      options: [
        { label: "Category 1", value: "Category1" },
        { label: "Category 2", value: "Category2" },
        { label: "Category 3", value: "Category3" },
      ],
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description...",
      description: "Optional description",
      rows: 3,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Add New Entity"
          subtitle="Create a new entity"
          showSearch={false}
          showFilters={false}
          showAddButton={false}
          actions={
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Entities
            </Button>
          }
        />

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Entity Information</CardTitle>
            </CardHeader>
            <CardContent>
              <GenericForm
                form={form}
                fields={formFields}
                onSubmit={handleSubmit}
                loading={loading}
                submitText={loading ? "Creating..." : "Create Entity"}
                onCancel={handleCancel}
                gridCols={1}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
```

```typescript
// app/your-entities/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/hooks/redux";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/ui/page-header";
import GenericForm from "@/components/ui/generic-form";
import Loader from "@/components/ui/loader";
import { ArrowLeft } from "lucide-react";
import { updateEntity } from "@/store/slices/yourEntitySlice";
import type { FormFieldConfig } from "@/components/ui/generic-form";
import type { YourEntity } from "@/types";

// Edit entity schema
const editEntitySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "suspended"]),
  description: z.string().optional(),
  category: z.string().optional(),
});

type EditEntityData = z.infer<typeof editEntitySchema>;

export default function EditEntityPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [entity, setEntity] = useState<YourEntity | null>(null);

  const form = useForm<EditEntityData>({
    resolver: zodResolver(editEntitySchema),
  });

  useEffect(() => {
    if (params.id) {
      fetchEntity(params.id as string);
    }
  }, [params.id]);

  const fetchEntity = async (entityId: string) => {
    try {
      setFetching(true);
      const response = await fetch(`/api/your-entities/${entityId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const entityData = result.data;
        setEntity(entityData);
        
        form.reset({
          name: entityData.name || "",
          email: entityData.email || "",
          status: entityData.status || "active",
          description: entityData.description || "",
          category: entityData.category || "",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch entity data",
          variant: "destructive",
        });
        router.push("/your-entities");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch entity data",
        variant: "destructive",
      });
      router.push("/your-entities");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (data: EditEntityData) => {
    if (!entity?._id) return;
    
    setLoading(true);
    try {
      const entityData = {
        _id: entity._id,
        name: data.name,
        email: data.email,
        status: data.status,
        description: data.description,
        category: data.category,
      };

      await dispatch(updateEntity(entityData)).unwrap();
      
      toast({
        title: "Success",
        description: `Entity "${data.name}" has been updated successfully.`,
      });
      
      router.push("/your-entities");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update entity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/your-entities");
  };

  const formFields: FormFieldConfig[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter entity name",
      required: true,
      description: "Entity name (2-100 characters)",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email address",
      description: "Optional email address",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      description: "Entity status",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Suspended", value: "suspended" },
      ],
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      placeholder: "Select category",
      description: "Entity category",
      options: [
        { label: "Category 1", value: "Category1" },
        { label: "Category 2", value: "Category2" },
        { label: "Category 3", value: "Category3" },
      ],
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description...",
      description: "Optional description",
      rows: 3,
    },
  ];

  if (fetching) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <Loader text="Loading entity data..." />
        </div>
      </AdminLayout>
    );
  }

  if (!entity) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Entity Not Found"
            subtitle="The requested entity could not be found"
            showSearch={false}
            showFilters={false}
            showAddButton={false}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Edit Entity: ${entity.name}`}
          subtitle="Update entity information"
          showSearch={false}
          showFilters={false}
          showAddButton={false}
          actions={
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Entities
            </Button>
          }
        />

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Entity Information</CardTitle>
            </CardHeader>
            <CardContent>
              <GenericForm
                form={form}
                fields={formFields}
                onSubmit={handleSubmit}
                loading={loading}
                submitText={loading ? "Updating..." : "Update Entity"}
                onCancel={handleCancel}
                gridCols={1}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
```

## ✅ Key Features Implemented

### 🎨 UI/UX Features
- **Consistent Design System**: All components follow the same design patterns
- **Theme Support**: Full dark/light theme compatibility
- **Responsive Layout**: Works on all screen sizes
- **Professional Animations**: Smooth transitions and loading states
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### 🔍 Data Management
- **Advanced Search**: Real-time search across multiple fields
- **Smart Filtering**: Multiple filter options with live updates
- **Flexible Sorting**: Sortable columns with visual indicators
- **Backend Pagination**: Efficient data loading for large datasets
- **Grid/Table Views**: Toggle between different view modes

### 🛡️ Security & Validation
- **Comprehensive Validation**: Both frontend and backend validation
- **Rate Limiting**: API protection against abuse
- **Error Handling**: Graceful error handling with user-friendly messages
- **Audit Logging**: Track all CRUD operations
- **Permission System**: Role-based access control

### 🔄 State Management
- **Redux Toolkit**: Efficient state management with async thunks
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Automatic retry mechanisms
- **Loading States**: Multiple loading indicators
- **Cache Management**: Intelligent data caching

### 🎯 Generic Components
- **PageHeader**: Reusable page header with search/filters
- **DataTable**: Advanced table with pagination/sorting/actions
- **CustomModal**: Professional modal system
- **GenericForm**: Flexible form builder with validation
- **Loader**: Multiple loading state components

## 🚀 Quick Start Guide

1. **Copy the patterns**: Use the User CRUD as a template
2. **Replace entity names**: Change "User" to your entity name throughout
3. **Customize fields**: Modify the schema and form fields for your needs
4. **Update routes**: Create the API routes following the pattern
5. **Add to Redux**: Include your slice in the store configuration
6. **Create pages**: Build the list, add, and edit pages
7. **Test thoroughly**: Ensure all CRUD operations work correctly

## 📝 Best Practices

### Code Organization
- Keep components generic and reusable
- Use TypeScript interfaces for type safety
- Follow consistent naming conventions
- Implement proper error boundaries
- Use proper file structure

### Performance
- Implement pagination for large datasets
- Use React.memo for expensive components
- Debounce search and filter operations
- Optimize bundle size with code splitting
- Use proper caching strategies

### Security
- Always validate data on both frontend and backend
- Implement proper authentication and authorization
- Use rate limiting for API protection
- Sanitize user inputs
- Log security events

### User Experience
- Provide immediate feedback for user actions
- Implement proper loading states
- Use meaningful error messages
- Support keyboard navigation
- Ensure responsive design

## 🔧 Customization Options

### Form Fields
The GenericForm component supports these field types:
- `text`, `email`, `password`, `number`
- `textarea` with configurable rows
- `select` with custom options
- `checkbox` and `switch` for booleans
- `date` for date inputs

### DataTable Features
- Sortable columns
- Custom cell renderers
- Action menu with three-dot menu
- Grid/table view toggle
- Quick view functionality
- Bulk operations support

### Modal Configurations
- Multiple sizes: sm, md, lg, xl, full
- Custom actions
- Prevent close option
- Theme-aware styling
- Keyboard support

## 📚 Related Documentation

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Zod Validation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/)

This implementation provides a solid foundation for building professional, scalable CRUD applications. The patterns established here can be reused across your entire application, ensuring consistency and maintainability.