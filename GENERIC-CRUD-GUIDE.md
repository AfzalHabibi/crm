# Generic CRUD Implementation Guide

## Overview

This guide demonstrates how to implement a complete, professional CRUD system using our generic components. The system provides:

- **Professional UI Components**: Reusable, theme-aware components
- **Advanced Data Management**: Redux Toolkit with async thunks
- **Comprehensive Security**: Rate limiting, validation, audit logging
- **Backend Pagination**: Server-side filtering and sorting
- **Modern Architecture**: TypeScript, Next.js 15, MongoDB

## 🏗️ Architecture

### Component Architecture
```
Generic Components (Reusable)
├── PageHeader          # Consistent page headers with search/filters
├── DataTable          # Advanced table with pagination/sorting
├── CustomModal        # Professional modals with theme support
├── GenericForm        # Unified forms with validation
└── Loader             # Multiple loading states

Feature Implementation (User CRUD)
├── Users List Page    # Using DataTable + PageHeader
├── Add User Page      # Using GenericForm + PageHeader
├── Edit User Page     # Using GenericForm + PageHeader
└── User API Routes    # Enhanced with security + validation
```

### State Management
```
Redux Store
├── User Slice
│   ├── State: users[], loading, error, pagination, filters, sort
│   ├── Async Thunks: fetchUsers, createUser, updateUser, deleteUser
│   └── Reducers: setFilters, setSort, setPagination, setSelectedUser
└── Store Configuration with TypeScript support
```

### Database Architecture
```
Enhanced User Model
├── Basic Fields: name, email, password, role, status
├── Profile Fields: avatar, phone, department, position, bio
├── Security Fields: permissions, emailVerified, twoFactorEnabled
├── Address Object: street, city, state, country, zipCode
├── Social Links: linkedin, twitter, github
├── Preferences: theme, language, timezone, notifications
├── Metadata: createdBy, updatedBy, notes, tags
└── Audit Fields: createdAt, updatedAt, lastLogin
```

## � Professional Naming Conventions

### File Naming
✅ **Correct:**
- `route.ts` (API routes)
- `page.tsx` (Next.js pages)
- `layout.tsx` (Layout components)
- `loading.tsx` (Loading UI)
- `error.tsx` (Error boundaries)
- `not-found.tsx` (404 pages)

❌ **Avoid:**
- `route-new.ts`, `route_new.ts` (non-standard suffixes)
- `pageComponent.tsx` (use `page.tsx`)
- `routeHandler.ts` (use `route.ts`)

### Component Naming
✅ **Correct:**
- `UserForm.tsx` (PascalCase for components)
- `user-table.tsx` (kebab-case for files)
- `PageHeader.tsx` (descriptive names)
- `CustomModal.tsx` (generic components)

❌ **Avoid:**
- `userform.tsx` (missing separation)
- `User_Form.tsx` (underscore in components)
- `usertable.tsx` (unclear naming)

### Database & Model Naming
✅ **Correct:**
- Model: `User.ts` (PascalCase, singular)
- Collection: `users` (lowercase, plural)
- Fields: `firstName`, `lastName` (camelCase)
- References: `userId`, `createdBy` (descriptive)

❌ **Avoid:**
- `user.ts` (lowercase model)
- `Users.ts` (plural model)
- `first_name` (snake_case in JS)

### API Route Naming
✅ **Correct:**
- `/api/users` (GET, POST)
- `/api/users/[id]` (GET, PUT, DELETE)
- `/api/users/[id]/avatar` (specific actions)

❌ **Avoid:**
- `/api/user` (singular for collection)
- `/api/users/new` (use POST to /api/users)
- `/api/getUserById` (RPC style)

### Variable & Function Naming
✅ **Correct:**
- `fetchUsers()` (verb + noun)
- `handleSubmit()` (handle + action)
- `isUserAdmin()` (boolean prefix)
- `userPermissions` (descriptive)

❌ **Avoid:**
- `users()` (unclear action)
- `submit()` (too generic)
- `adminCheck()` (unclear return type)

### Redux Naming
✅ **Correct:**
- Slice: `userSlice.ts`
- Actions: `fetchUsers`, `createUser`, `updateUser`
- State: `users`, `loading`, `error`, `pagination`
- Thunks: `fetchUsers.pending`, `fetchUsers.fulfilled`

❌ **Avoid:**
- `usersSlice.ts` (plural slice name)
- `getUsers` (use `fetchUsers`)
- `userList` (use `users`)

## �🔧 Implementation Steps

### 1. Setup Generic Components

#### A. PageHeader Component
```typescript
// components/ui/page-header.tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAddClick?: () => void;
  onFiltersClick?: () => void;
  addButtonText?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showAddButton?: boolean;
  actions?: ReactNode;
}
```

**Features:**
- Consistent header design
- Integrated search with debouncing
- Filter button with modal integration
- Add button with custom text
- Custom action buttons
- Responsive design

#### B. DataTable Component
```typescript
// components/ui/data-table.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSort?: (field: keyof T, direction: 'asc' | 'desc') => void;
  actions?: ActionMenuItem<T>[];
  onQuickView?: (item: T) => void;
  gridRenderItem?: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
}
```

**Features:**
- Table and grid view toggle
- Server-side pagination
- Column sorting
- Three-dot action menus
- Quick view integration
- Custom empty states
- Loading skeletons

#### C. CustomModal Component
```typescript
// components/ui/custom-modal.tsx
interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
}
```

**Features:**
- Multiple size variants
- Backdrop blur with theme support
- Keyboard shortcuts (Escape)
- Custom action buttons
- Smooth animations
- Focus management

#### D. GenericForm Component
```typescript
// components/ui/generic-form.tsx
interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'date';
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

interface GenericFormProps {
  form: UseFormReturn<any>;
  fields: FormFieldConfig[];
  onSubmit: (data: any) => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  gridCols?: 1 | 2 | 3;
}
```

**Features:**
- React Hook Form integration
- Zod validation support
- Multiple field types
- Grid layout options
- Loading states
- Error handling

### 2. Redux Store Setup

#### A. User Slice
```typescript
// store/slices/userSlice.ts
interface UserState {
  users: User[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  selectedUser: User | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: UserFilters;
  sort: UserSort;
}

// Async Thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params: FetchUsersParams) => {
    // API call with filtering, sorting, pagination
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserData) => {
    // API call to create user
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }: UpdateUserParams) => {
    // API call to update user
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: string) => {
    // API call to delete user
  }
);
```

#### B. Store Configuration
```typescript
// store/index.ts
export const store = configureStore({
  reducer: {
    users: userSlice.reducer,
    // Add other slices here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// hooks/redux.ts
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 3. Enhanced Database Model

#### A. User Schema
```typescript
// models/User.ts
const userSchema = new Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'hr', 'finance', 'sales', 'user'], 
    default: 'user' 
  },
  
  // Profile Information
  avatar: String,
  phone: String,
  department: String,
  position: String,
  bio: String,
  
  // Status and Security
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  permissions: [String],
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  
  // Social Links
  socialLinks: {
    linkedin: String,
    twitter: String,
    github: String,
  },
  
  // User Preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },
  
  // Metadata
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    tags: [String],
  },
  
  // Audit Fields
  lastLogin: Date,
  passwordChangedAt: Date,
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'metadata.tags': 1 });
userSchema.index({ createdAt: -1 });
```

### 4. Enhanced API Routes

#### A. Main Users Route
```typescript
// app/api/users/route.ts
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await rateLimiter(request);
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (role) query.role = role;
    if (department) query.department = department;
    if (status) query.status = status;
    
    // Build sort
    const sort: any = {};
    sort[sortField] = sortDirection === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);
    
    // Audit log
    await auditLogger.log({
      action: 'users.list',
      userId: 'system', // Get from session
      details: { query, total, page, limit },
    });
    
    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    await rateLimiter(request);
    
    // Validate request body
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Create user
    const user = await User.create({
      ...validatedData,
      password: hashedPassword,
      emailVerified: false,
      permissions: getDefaultPermissions(validatedData.role),
    });
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    // Audit log
    await auditLogger.log({
      action: 'users.create',
      userId: 'system', // Get from session
      resourceId: user._id,
      details: { role: user.role, department: user.department },
    });
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'User created successfully',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 5. Frontend Implementation

#### A. Users List Page
```typescript
// app/users/page.tsx
export default function UsersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { 
    users, 
    loading, 
    error, 
    pagination, 
    filters,
    sort,
    selectedUser 
  } = useAppSelector((state) => state.users);

  // Fetch users on mount and dependency changes
  useEffect(() => {
    dispatch(fetchUsers({
      page: pagination.page,
      limit: pagination.limit,
      filters,
      sort,
    }));
  }, [dispatch, pagination.page, pagination.limit, filters, sort]);

  // Define table columns
  const columns = [
    {
      key: "name",
      label: "User",
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    // ... other columns
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage users, roles, and permissions"
        searchValue={filters.search || ""}
        onSearchChange={handleSearch}
        onAddClick={() => router.push("/users/add")}
        onFiltersClick={() => setShowFilters(true)}
        addButtonText="Add User"
      />

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        totalCount={pagination.total}
        pageSize={pagination.limit}
        currentPage={pagination.page}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        actions={actionMenuItems}
        onQuickView={handleQuickView}
        emptyMessage="No users found. Add your first user to get started."
      />
    </div>
  );
}
```

#### B. Add User Page
```typescript
// app/users/add/page.tsx
export default function AddUserPage() {
  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { status: "active" },
  });

  const handleSubmit = async (data: CreateUserData) => {
    try {
      await dispatch(createUser(data)).unwrap();
      toast.success("User created successfully");
      router.push("/users");
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Add New User"
        subtitle="Create a new user account"
        showSearch={false}
        showFilters={false}
        showAddButton={false}
        actions={<BackButton />}
      />

      <GenericForm
        form={form}
        fields={formFields}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/users")}
        gridCols={2}
      />
    </div>
  );
}
```

## 🎯 Benefits of This Architecture

### 1. **Reusability**
- Generic components work across all entities
- Consistent UI/UX throughout the application
- Reduced development time for new features

### 2. **Maintainability**
- Centralized component logic
- TypeScript ensures type safety
- Clear separation of concerns

### 3. **Scalability**
- Easy to add new entities using the same pattern
- Server-side pagination handles large datasets
- Modular architecture supports growth

### 4. **Professional Features**
- Advanced filtering and sorting
- Comprehensive error handling
- Audit logging and security
- Responsive design
- Theme support

### 5. **Developer Experience**
- Clear patterns to follow
- Comprehensive TypeScript support
- Automated validation
- Rich development tools

## 🚀 Quick Implementation Guide

### For Any New Entity:

1. **Create the Model** with enhanced fields
2. **Setup Redux Slice** with async thunks
3. **Create API Routes** with security and validation
4. **Build Frontend Pages** using generic components
5. **Configure Form Fields** for the entity
6. **Update TypeScript Types** for type safety

### Example for Products Entity:

```typescript
// 1. Model (models/Product.ts)
const productSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // ... other fields
});

// 2. Redux Slice (store/slices/productSlice.ts)
export const fetchProducts = createAsyncThunk(/* ... */);
export const createProduct = createAsyncThunk(/* ... */);

// 3. API Routes (app/api/products/route.ts)
export async function GET() { /* ... */ }
export async function POST() { /* ... */ }

// 4. Frontend (app/products/page.tsx)
export default function ProductsPage() {
  // Use same pattern as UsersPage
}
```

This architecture provides a solid foundation for building professional, scalable CRUD applications with modern best practices.