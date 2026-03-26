/**
 * Thành phần bảo vệ route theo trạng thái đăng nhập và quyền vai trò.
 */
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/stores/authStore'
import { getRoleHomePath } from '@/router/getRoleHomePath'
import type { UserRole } from '@/types'

type RoleGroup = 'student' | 'reviewer' | 'moderator'

interface ProtectedRouteProps {
  roleGroup: RoleGroup
  children: React.ReactElement
}

function isAllowedForRoleGroup(role: UserRole, roleGroup: RoleGroup, pathname: string): boolean {
  if (roleGroup === 'student') return role === 'STUDENT'
  if (roleGroup === 'moderator') return role === 'MODERATOR'

  // reviewer
  if (pathname === '/reviewer/dashboard') {
    return role === 'GV_REVIEW' || role === 'GVHD'
  }
  return role === 'GV_REVIEW'
}

export function ProtectedRoute({ roleGroup, children }: ProtectedRouteProps) {
  const location = useLocation()
  const { currentUser, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />
  }

  const allowed = isAllowedForRoleGroup(currentUser.role, roleGroup, location.pathname)
  if (!allowed) {
    return <Navigate to={getRoleHomePath(currentUser.role)} replace />
  }

  return children
}

