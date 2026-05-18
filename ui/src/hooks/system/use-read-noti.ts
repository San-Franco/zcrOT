/* eslint-disable @typescript-eslint/no-explicit-any */
import { toggleNotificationStatus } from "@/api/queries/notification-queries"
import queryClient from "@/api/queries"
import useNotiStore from "@/stores/noti-store"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

const useMarkAsRead = () => {
    const { updateNotificationStatus } = useNotiStore()

    const { mutate: markAsRead, isPending: updating } = useMutation({
        mutationFn: async (id: number) => {
            return toggleNotificationStatus(id)
        },
        onMutate: async (id: number) => {
            //? Cancel outgoing refetches to avoid race conditions
            await queryClient.cancelQueries({ queryKey: ["notifications"] })

            //? Snapshot the previous status for rollback
            const notifications = useNotiStore.getState().notifications
            const previousStatus = notifications.find(n => n.id === id)?.status

            //? Optimistically update the UI
            updateNotificationStatus(id, "READ")

            return { previousStatus }
        },
        onSuccess: async (notification) => {
            updateNotificationStatus(notification.id, notification.status)
            queryClient.invalidateQueries({ queryKey: ["notifications"] })
        },
        onError: (err: any, id: number, context: any) => {
            //? Revert the optimistic update on error
            if (context?.previousStatus) {
                updateNotificationStatus(id, context.previousStatus)
            } else {
                updateNotificationStatus(id, "SENT")
            }


            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to mark as read. Please try again.";
            toast.error('Error', {
                description: msg,
            });
        },
    })

    return { markAsRead, updating }
}

export default useMarkAsRead
