import { create } from "zustand";

interface DeviceMappingsState {
  mappings: DetectionDeviceNameMappingApiRow[];
  setMappings: (mappings: DetectionDeviceNameMappingApiRow[]) => void;
  clearMappings: () => void;
}

const useDeviceMappingsStore = create<DeviceMappingsState>((set) => ({
  mappings: [],
  setMappings: (mappings) => set({ mappings }),
  clearMappings: () => set({ mappings: [] }),
}));

export default useDeviceMappingsStore;
