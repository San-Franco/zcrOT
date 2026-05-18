import type { NotificationItem, NotificationStatus } from "@/api/queries/notification-queries";
import { create } from 'zustand';
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";

interface State {
    notifications: NotificationItem[]
}

interface Action {
    setNotis: (notis: NotificationItem[]) => void,
    updateNotificationStatus: (id: number, status: NotificationStatus) => void,
    deleteNotification: (id: number) => void,
    clearNotis: () => void
}

const initialState: State = {
    notifications: []
}

const useNotiStore = create<State & Action>()(
    persist(
        immer((set) => ({
            ...initialState,
            setNotis: (notis: NotificationItem[]) => set(state => {
                state.notifications = notis
            }),
            updateNotificationStatus: (id: number, status: NotificationStatus) => set(state => {
                const notification = state.notifications.find((noti: NotificationItem) => noti.id === id)
                if (notification) {
                    notification.status = status
                }
            }),
            deleteNotification: (id: number) => set(state => {
                state.notifications = state.notifications.filter((noti: NotificationItem) => noti.id !== id)
            }),
            clearNotis: () => set(initialState)
        })),
        {
            name: "notis",
            storage: createJSONStorage(() => sessionStorage)
        }
    )
)

export default useNotiStore
