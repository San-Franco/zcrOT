import { queryOptions } from "@tanstack/react-query";
import api from "@/api";

export type NotificationStatus = "SENT" | "READ";

type NotificationApiRow = {
  id: number;
  title: string;
  content: string;
  status: NotificationStatus;
  created_at: string;
  updated_at: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  content: string;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
};

const mapNotificationApiRow = (row: NotificationApiRow): NotificationItem => ({
  id: row.id,
  title: row.title,
  content: row.content,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fetchNotifications = async () => {
  const res = await api.get<NotificationApiRow[]>("/notifications");
  return res.data.map(mapNotificationApiRow);
};

export const notificationsQuery = () =>
  queryOptions({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

export const toggleNotificationStatus = async (notificationId: number) => {
  const res = await api.patch<NotificationApiRow>(`/notifications/${notificationId}/toggle-status`);
  return mapNotificationApiRow(res.data);
};

export const deleteNotificationById = async (notificationId: number) => {
  await api.delete(`/notifications/${notificationId}`);
};
