import { renderHook } from '@testing-library/react';
import { usePermission } from '../usePermission';
import { usePermissionContext } from '../../contexts/PermissionContext';
import { PermissionAction } from '../../types/permissions';

jest.mock('../../contexts/PermissionContext', () => ({
  usePermissionContext: jest.fn(),
}));

const mockedUsePermissionContext = usePermissionContext as jest.MockedFunction<typeof usePermissionContext>;

describe('usePermission hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Bypass', () => {
    it('returns true for any project_request entitlement if user is admin', () => {
      mockedUsePermissionContext.mockReturnValue({
        isAdmin: true,
        permissions: {},
        isReady: true,
      });

      const { result } = renderHook(() => usePermission());
      expect(result.current.can({ module: 'project_request', entitlement: 'create' })).toBe(true);
      expect(result.current.can({ module: 'project_request', entitlement: 'delete' })).toBe(true);
    });
  });

  describe('project_request permissions', () => {
    it('returns true when the exact entitlement exists for project_request', () => {
      const mockPermissions: Record<string, Set<PermissionAction>> = {
        'project_request': new Set(['create', 'view'] as PermissionAction[]),
      };

      mockedUsePermissionContext.mockReturnValue({
        isAdmin: false,
        permissions: mockPermissions,
        isReady: true,
      });

      const { result } = renderHook(() => usePermission());
      expect(result.current.can({ module: 'project_request', entitlement: 'create' })).toBe(true);
      expect(result.current.can({ module: 'project_request', entitlement: 'view' })).toBe(true);
    });

    it('returns false when the user lacks the specific entitlement for project_request', () => {
      const mockPermissions: Record<string, Set<PermissionAction>> = {
        'project_request': new Set(['view'] as PermissionAction[]),
      };

      mockedUsePermissionContext.mockReturnValue({
        isAdmin: false,
        permissions: mockPermissions,
        isReady: true,
      });

      const { result } = renderHook(() => usePermission());
      expect(result.current.can({ module: 'project_request', entitlement: 'create' })).toBe(false);
      expect(result.current.can({ module: 'project_request', entitlement: 'delete' })).toBe(false);
    });

    it('handles non-existent module gracefully', () => {
      mockedUsePermissionContext.mockReturnValue({
        isAdmin: false,
        permissions: {},
        isReady: true,
      });

      const { result } = renderHook(() => usePermission());
      expect(result.current.can({ module: 'project_request', entitlement: 'create' })).toBe(false);
    });
  });
});
