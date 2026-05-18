import { create } from 'zustand';
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";

interface Filters {
    protocols: Filter[],
    severity: Filter[],
    verdict: Filter[],
    identity: Filter[],
}

interface State {
    filters: Filters
}

interface Actions {
    setFilters: (filters: Filters) => void,
    clearFilters: () => void
}

const initialState: State = {
    filters: {
        protocols: [],
        severity: [],
        verdict: [],
        identity: [],
    },
}

const useFiltersStore = create<State & Actions>()(
    persist(
        immer((set) => ({
            ...initialState,
            setFilters: (filters) => set(state => {
                state.filters = filters
            }),
            clearFilters: () => set(initialState)
        })),
        {
            name: 'filters',
            storage: createJSONStorage(() => sessionStorage),
            version: 4,
            migrate: (persistedState: unknown, version: number) => {
                if (version < 4 && persistedState && typeof persistedState === "object") {
                    const legacyState = persistedState as {
                        filters?: Partial<Filters>
                        protocols?: Filter[]
                        severity?: Filter[]
                        verdict?: Filter[]
                        identity?: Filter[]
                    }
                    const hasNestedFilters = Boolean(legacyState.filters)
                    const migratedFilters: Filters = hasNestedFilters
                        ? {
                            protocols: legacyState.filters?.protocols || [],
                            severity: legacyState.filters?.severity || [],
                            verdict: legacyState.filters?.verdict || [],
                            identity: legacyState.filters?.identity || [],
                        }
                        : {
                            protocols: legacyState.protocols || [],
                            severity: legacyState.severity || [],
                            verdict: legacyState.verdict || [],
                            identity: legacyState.identity || [],
                        }

                    return {
                        ...initialState,
                        filters: migratedFilters,
                    }
                }

                return persistedState as State & Actions
            },
        }
    )
)

export default useFiltersStore
