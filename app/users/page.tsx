"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "@/components/ui/data-table";
import PageHeader from "@/components/ui/page-header";
import CustomModal from "@/components/ui/custom-modal";
import { TableLoader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Download, 
  Edit, 
  Trash2, 
  MoreVertical,
  Grid3X3,
  List,
  Eye,
  Filter,
  UserCheck,
  Shield,
  Clock,
  Mail,
  Phone
} from "lucide-react";
import { fetchUsers, deleteUser, setPagination } from "@/store/slices/userSlice";
import type { AppDispatch, RootState } from "@/store";
import type { User } from "@/types";

export default function UsersPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  
  // Redux state
  const { users, loading, error, pagination, stats } = useSelector((state: RootState) => state.users);
  
  // Local state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    status: '' as '' | 'active' | 'inactive',
    department: '',
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    direction: 'desc' as 'asc' | 'desc'
  });

  // Fetch users when component mounts or filters change
  useEffect(() => {
    const cleanFilters: any = {
      search: searchTerm || undefined,
    };
    
    if (filters.role) cleanFilters.role = filters.role;
    if (filters.status) cleanFilters.status = filters.status as 'active' | 'inactive';
    if (filters.department) cleanFilters.department = filters.department;
    
    dispatch(fetchUsers({
      page: pagination.page,
      limit: pagination.limit,
      filters: cleanFilters,
      sort: {
        field: sortConfig.field as keyof User,
        direction: sortConfig.direction
      }
    }));
  }, [dispatch, searchTerm, filters, sortConfig, pagination.page, pagination.limit]);

  // Handle search with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle sort
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}?`)) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  // Handle quick view
  const handleQuickView = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name' as keyof User,
      label: 'User',
      sortable: true,
      render: (value: any, user: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-foreground">{user.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role' as keyof User,
      label: 'Role',
      sortable: true,
      render: (value: any, user: User) => (
        <Badge variant={getRoleVariant(user.role)}>
          {user.role}
        </Badge>
      )
    },
    {
      key: 'department' as keyof User,
      label: 'Department',
      sortable: true,
      render: (value: any, user: User) => (
        <span className="text-foreground">{user.department || '—'}</span>
      )
    },
    {
      key: 'status' as keyof User,
      label: 'Status',
      sortable: true,
      render: (value: any, user: User) => (
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(user.status)}>
            {user.status}
          </Badge>
          {user.emailVerified && (
            <Shield className="h-4 w-4 text-green-600" />
          )}
        </div>
      )
    },
    {
      key: 'lastLogin' as keyof User,
      label: 'Last Login',
      sortable: true,
      render: (value: any, user: User) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </div>
      )
    }
  ];

  // Action menu items
  const actionMenuItems = [
    {
      label: 'Quick View',
      icon: Eye,
      onClick: (user: User) => handleQuickView(user),
    },
    {
      label: 'Edit User',
      icon: Edit,
      onClick: (user: User) => user._id && router.push(`/users/edit/${user._id}`),
    },
    {
      label: 'Delete User',
      icon: Trash2,
      onClick: (user: User) => user._id && handleDeleteUser(user._id, user.name),
      variant: 'destructive',
      disabled: (user: User) => user.role === 'admin'
    }
  ];

  // Badge variants
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      case 'hr': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader 
            title="User Management"
            subtitle="Loading users..."
            showSearch={false}
            showFilters={false}
            showAddButton={false}
          />
          <TableLoader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="User Management"
          subtitle="Manage users, roles, and permissions across your organization"
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Search users by name or email..."
          onAddClick={() => router.push('/users/add')}
          addButtonText="Add User"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => dispatch(fetchUsers({}))}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <div className="flex rounded-md border border-input">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none border-r border-input"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          }
        >
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="HR">Human Resources</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
              </SelectContent>
            </Select>

            {(filters.role || filters.status || filters.department) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilters({ role: '', status: '', department: '' })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </PageHeader>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600/60" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.inactiveUsers}</p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-600/60" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                    <p className="text-2xl font-bold text-red-600">{stats.suspendedUsers}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-600/60" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {viewMode === 'table' ? (
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
            totalCount={pagination.total}
            pageSize={pagination.limit}
            currentPage={pagination.page}
            onPageChange={(page) => dispatch(setPagination({ page }))}
            onPageSizeChange={(limit) => dispatch(setPagination({ limit }))}
            onSort={handleSort}
            sortColumn={sortConfig.field as keyof User}
            sortDirection={sortConfig.direction}
            actions={actionMenuItems}
            emptyMessage="No users found"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <Card key={user._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleQuickView(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Quick View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/users/edit/${user._id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => user._id && handleDeleteUser(user._id, user.name)}
                          className="text-destructive"
                          disabled={user.role === 'admin'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <span className="text-sm font-medium">{user.department || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                      {user.emailVerified && (
                        <Shield className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {searchTerm || Object.values(filters).some(Boolean) 
                  ? "Try adjusting your search or filter criteria" 
                  : "Get started by adding your first user"}
              </p>
              <Button onClick={() => router.push("/users/add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add First User
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick View Modal */}
        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="User Details"
        >
          {selectedUser && (
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">Quick view of user information</p>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedUser.email}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={getRoleVariant(selectedUser.role)}>{selectedUser.role}</Badge>
                    <Badge variant={getStatusVariant(selectedUser.status)}>{selectedUser.status}</Badge>
                    {selectedUser.emailVerified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="font-medium">{selectedUser.department || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <p className="font-medium">{selectedUser.position || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium flex items-center gap-1">
                    {selectedUser.phone ? (
                      <>
                        <Phone className="h-3 w-3" />
                        {selectedUser.phone}
                      </>
                    ) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Login:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => {
                  setIsModalOpen(false);
                  router.push(`/users/edit/${selectedUser._id}`);
                }} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </CustomModal>
      </div>
    </AdminLayout>
  );
}
