import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from '../services/api';

// Query key factory
export const STAFF_KEYS = {
  all: ['staff'],
  lists: () => [...STAFF_KEYS.all, 'list'],
  list: (filters = {}) => [...STAFF_KEYS.lists(), { filters }],
  details: () => [...STAFF_KEYS.all, 'detail'],
  detail: (id) => [...STAFF_KEYS.details(), id],
};

// Hooks
export const useStaffMembers = (options = {}) => {
  const { filters = {}, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: STAFF_KEYS.list(filters),
    queryFn: () => getUsers(filters),
    enabled,
    staleTime: Infinity, // Never stale - WebSocket keeps data fresh
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchInterval: false, // NO auto-refresh - WebSocket only
    refetchOnWindowFocus: false,
    retry: 2,
    ...queryOptions,
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => {
      console.log(`[useUpdateStaff] Updating user ${id} with data:`, data);
      return updateUser(id, data);
    },
    onSuccess: (response, variables) => {
      console.log(`[useUpdateStaff] Update successful for user ${variables?.id}`);
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: STAFF_KEYS.detail(variables.id) });
      }
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all });
    },
    onError: (error, variables) => {
      console.error(`[useUpdateStaff] Update failed for user ${variables?.id}:`, error);
    },
  });
};

export const useToggleStaffStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all });
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => {
      console.log(`[useDeleteStaff] Deleting user ${id}`);
      return deleteUser(id);
    },
    onSuccess: (response, id) => {
      console.log(`[useDeleteStaff] Delete successful for user ${id}`);
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all });
    },
    onError: (error, id) => {
      console.error(`[useDeleteStaff] Delete failed for user ${id}:`, error);
    },
  });
};
