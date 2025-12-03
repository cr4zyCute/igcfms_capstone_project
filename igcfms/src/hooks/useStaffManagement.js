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
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
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
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (_, variables) => {
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: STAFF_KEYS.detail(variables.id) });
      }
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all });
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
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_KEYS.all });
    },
  });
};
