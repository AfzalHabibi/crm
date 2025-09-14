import type { Session } from "next-auth"

export enum Permission {
  // User permissions
  CREATE_USER = "create_user",
  READ_USER = "read_user",
  UPDATE_USER = "update_user",
  DELETE_USER = "delete_user",
  READ_ALL_USERS = "read_all_users",
  
  // Profile permissions
  UPDATE_OWN_PROFILE = "update_own_profile",
  READ_OWN_PROFILE = "read_own_profile",
  
  // System permissions
  VIEW_AUDIT_LOGS = "view_audit_logs",
  MANAGE_SYSTEM = "manage_system",
  
  // Additional CRM permissions (for future use)
  MANAGE_COMPANIES = "manage_companies",
  MANAGE_DEALS = "manage_deals",
  MANAGE_LEADS = "manage_leads",
  VIEW_REPORTS = "view_reports",
}

export enum Role {
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // Admin has all permissions
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.READ_ALL_USERS,
    Permission.UPDATE_OWN_PROFILE,
    Permission.READ_OWN_PROFILE,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_SYSTEM,
    Permission.MANAGE_COMPANIES,
    Permission.MANAGE_DEALS,
    Permission.MANAGE_LEADS,
    Permission.VIEW_REPORTS,
  ],
  
  [Role.MANAGER]: [
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.READ_ALL_USERS,
    Permission.UPDATE_OWN_PROFILE,
    Permission.READ_OWN_PROFILE,
    Permission.MANAGE_COMPANIES,
    Permission.MANAGE_DEALS,
    Permission.MANAGE_LEADS,
    Permission.VIEW_REPORTS,
  ],
  
  [Role.USER]: [
    Permission.READ_USER,
    Permission.UPDATE_OWN_PROFILE,
    Permission.READ_OWN_PROFILE,
  ],
}

export class PermissionManager {
  static hasPermission(userRole: string, permission: Permission): boolean {
    const role = userRole as Role
    const permissions = ROLE_PERMISSIONS[role] || []
    return permissions.includes(permission)
  }

  static hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission))
  }

  static hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission))
  }

  static canAccessUser(session: Session | null, targetUserId: string): boolean {
    if (!session?.user) return false

    const userRole = session.user.role as Role
    const currentUserId = session.user.id

    // Admin and Manager can access all users
    if (this.hasPermission(userRole, Permission.READ_ALL_USERS)) {
      return true
    }

    // Users can only access their own profile
    return currentUserId === targetUserId
  }

  static canModifyUser(session: Session | null, targetUserId: string): boolean {
    if (!session?.user) return false

    const userRole = session.user.role as Role
    const currentUserId = session.user.id

    // Admin and Manager can modify other users
    if (this.hasPermission(userRole, Permission.UPDATE_USER)) {
      return true
    }

    // Users can only modify their own profile
    if (currentUserId === targetUserId && this.hasPermission(userRole, Permission.UPDATE_OWN_PROFILE)) {
      return true
    }

    return false
  }

  static canDeleteUser(session: Session | null, targetUserId: string): boolean {
    if (!session?.user) return false

    const userRole = session.user.role as Role
    const currentUserId = session.user.id

    // Users cannot delete themselves
    if (currentUserId === targetUserId) return false

    // Only Admin can delete users
    return this.hasPermission(userRole, Permission.DELETE_USER)
  }

  static canCreateUser(session: Session | null): boolean {
    if (!session?.user) return false

    const userRole = session.user.role as Role
    return this.hasPermission(userRole, Permission.CREATE_USER)
  }

  static getUserPermissions(userRole: string): Permission[] {
    const role = userRole as Role
    return ROLE_PERMISSIONS[role] || []
  }

  static validateRoleHierarchy(currentUserRole: string, targetRole: string): boolean {
    const roleHierarchy = {
      [Role.ADMIN]: 3,
      [Role.MANAGER]: 2,
      [Role.USER]: 1,
    }

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const targetLevel = roleHierarchy[targetRole as Role] || 0

    // Users can only assign roles equal to or lower than their own level
    return currentLevel >= targetLevel
  }

  static canAssignRole(currentUserRole: string, targetRole: string): boolean {
    // Only admin and manager can assign roles
    if (!this.hasPermission(currentUserRole, Permission.CREATE_USER)) {
      return false
    }

    return this.validateRoleHierarchy(currentUserRole, targetRole)
  }

  // Resource-based access control
  static canAccessResource(
    session: Session | null,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete',
    resourceOwnerId?: string
  ): boolean {
    if (!session?.user) return false

    const userRole = session.user.role as Role
    const currentUserId = session.user.id

    switch (resource) {
      case 'user':
        switch (action) {
          case 'create':
            return this.canCreateUser(session)
          case 'read':
            return resourceOwnerId 
              ? this.canAccessUser(session, resourceOwnerId)
              : this.hasPermission(userRole, Permission.READ_ALL_USERS)
          case 'update':
            return resourceOwnerId 
              ? this.canModifyUser(session, resourceOwnerId)
              : false
          case 'delete':
            return resourceOwnerId 
              ? this.canDeleteUser(session, resourceOwnerId)
              : false
          default:
            return false
        }
      
      case 'audit_logs':
        return this.hasPermission(userRole, Permission.VIEW_AUDIT_LOGS)
      
      default:
        return false
    }
  }

  // Advanced permission checks for specific scenarios
  static canUpdateUserRole(session: Session | null, targetUserId: string, newRole: string): boolean {
    if (!session?.user) return false

    const currentUserId = session.user.id
    const currentUserRole = session.user.role

    // Users cannot change their own role
    if (currentUserId === targetUserId) return false

    // Check if current user can assign the target role
    return this.canAssignRole(currentUserRole, newRole)
  }

  static canDeactivateUser(session: Session | null, targetUserId: string): boolean {
    if (!session?.user) return false

    const currentUserId = session.user.id
    const userRole = session.user.role as Role

    // Users cannot deactivate themselves
    if (currentUserId === targetUserId) return false

    // Only Admin and Manager can deactivate users
    return this.hasPermission(userRole, Permission.UPDATE_USER)
  }

  static getAccessibleFields(userRole: string, isOwner: boolean = false): string[] {
    const role = userRole as Role
    
    const baseFields = ['name', 'email', 'role', 'department', 'phone', 'isActive', 'createdAt', 'updatedAt']
    const sensitiveFields = ['_id']
    const adminFields = ['password'] // Only for password reset scenarios
    
    switch (role) {
      case Role.ADMIN:
        return [...baseFields, ...sensitiveFields, ...adminFields]
      case Role.MANAGER:
        return [...baseFields, ...sensitiveFields]
      case Role.USER:
        return isOwner ? baseFields : ['name', 'email', 'department']
      default:
        return []
    }
  }
}
