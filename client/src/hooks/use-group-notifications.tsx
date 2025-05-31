import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface GroupNotification {
  groupId: number;
  type: string;
  count: number;
  groupName: string;
}

export function useGroupNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<GroupNotification[]>({
    queryKey: ['/api/users', user?.id, 'group-notifications'],
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: 30000,
  });

  // Debug logging
  console.log('Notifications hook - user:', user?.id, 'notifications:', notifications, 'loading:', isLoading);

  const markNotificationsViewed = useMutation({
    mutationFn: async ({ groupId, type }: { groupId: number; type?: string }) => {
      const response = await fetch(`/api/users/${user?.id}/group-notifications/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId, type }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notifications as viewed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/users', user?.id, 'group-notifications'],
      });
    },
  });

  const getNotificationCount = (groupId: number, type?: string) => {
    if (!Array.isArray(notifications)) return 0;
    const groupNotifications = notifications.filter((n: GroupNotification) => n.groupId === groupId);
    if (type) {
      return groupNotifications.find((n: GroupNotification) => n.type === type)?.count || 0;
    }
    return groupNotifications.reduce((sum: number, n: GroupNotification) => sum + n.count, 0);
  };

  const getTotalNotificationCount = () => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.reduce((sum: number, n: GroupNotification) => sum + n.count, 0);
  };

  return {
    notifications,
    isLoading,
    markNotificationsViewed,
    getNotificationCount,
    getTotalNotificationCount,
  };
}