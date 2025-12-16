import React from 'react';
import { usePermissions } from '@/components/utils/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

// Component om elementen te tonen/verbergen op basis van permissies
export function PermissionGate({ 
  children, 
  category, 
  action, 
  fallback = null, 
  showError = false,
  adminOnly = false,
  customCheck = null 
}) {
  const { hasPermission, isAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>;
  }

  // Custom check functie
  if (customCheck && typeof customCheck === 'function') {
    if (!customCheck()) {
      return showError ? (
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            U heeft geen toestemming voor deze actie.
          </AlertDescription>
        </Alert>
      ) : fallback;
    }
    return children;
  }

  // Admin only check
  if (adminOnly && !isAdmin()) {
    return showError ? (
      <Alert variant="destructive" className="max-w-md">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Alleen beheerders kunnen deze actie uitvoeren.
        </AlertDescription>
      </Alert>
    ) : fallback;
  }

  // Permission check
  if (category && action && !hasPermission(category, action)) {
    return showError ? (
      <Alert variant="destructive" className="max-w-md">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          U heeft geen toestemming voor deze actie.
        </AlertDescription>
      </Alert>
    ) : fallback;
  }

  return children;
}

// Hook component voor conditionele rendering
export function usePermissionCheck() {
  const { hasPermission, isAdmin, canPerform } = usePermissions();
  
  return {
    hasPermission,
    isAdmin,
    canPerform,
    // Handige helper functies
    canCreateProject: () => hasPermission('projects', 'create'),
    canEditProject: () => hasPermission('projects', 'edit'),
    canDeleteProject: () => hasPermission('projects', 'delete'),
    canUploadPhotos: () => hasPermission('projects', 'upload_photos'),
    canManageTeam: () => hasPermission('team', 'invite_users'),
    canApproveRequests: () => hasPermission('materials', 'approve_request'),
    canViewAnalytics: () => hasPermission('analytics', 'view_basic'),
  };
}