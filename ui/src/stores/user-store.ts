import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type UserStoreState = {
  user: User | null;
  isAuthenticated: boolean;
  tableColumns: UserTableColumnPreferences;
};

type UserStoreActions = {
  setAuth: (user: User) => void;
  setUser: (user: User) => void;
  setTableVisibleColumns: (tableKey: string, columnIds: string[]) => void;
  getTableVisibleColumns: (tableKey: string, fallbackColumnIds: string[]) => string[];
  clearAuth: () => void;
  isAdmin: () => boolean;
};

const initialState: UserStoreState = {
  user: null,
  isAuthenticated: false,
  tableColumns: {},
};

const useUserStore = create<UserStoreState & UserStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      setUser: (user) => set((state) => ({ ...state, user, isAuthenticated: true })),
      setTableVisibleColumns: (tableKey, columnIds) => {
        const normalizedColumns = Array.from(new Set(columnIds));
        set((state) => ({
          ...state,
          tableColumns: {
            ...state.tableColumns,
            [tableKey]: normalizedColumns,
          },
        }));
      },
      getTableVisibleColumns: (tableKey, fallbackColumnIds) => {
        const selectedColumns = get().tableColumns[tableKey];
        if (!selectedColumns?.length) {
          return fallbackColumnIds;
        }
        return selectedColumns;
      },
      clearAuth: () => set((state) => ({ ...state, user: null, isAuthenticated: false })),
      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "zcrot-auth",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: unknown) => {
        const legacyState = persistedState as Partial<UserStoreState> | undefined;
        return {
          ...initialState,
          user: legacyState?.user ?? null,
          isAuthenticated: Boolean(legacyState?.user && legacyState?.isAuthenticated),
          tableColumns: legacyState?.tableColumns ?? {},
        };
      },
    },
  ),
);

export default useUserStore;
