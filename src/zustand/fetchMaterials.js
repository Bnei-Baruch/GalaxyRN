import { create } from 'zustand';
import api from '../shared/Api';
import { debug, info, warn, error } from "../services/logger";

const NAMESPACE = 'Materials';

const useMaterials = create((set) => ({
  materials      : [],
  fetchMaterials : async () => {
    set({ isLoading: true, error: null });
    try {
      debug(NAMESPACE, "Fetching materials");
      const materials = await api.fetchMaterials();
      debug(NAMESPACE, "Materials fetched successfully", materials);
      set({ isLoading: false, materials });
    } catch (error) {
      error(NAMESPACE, "Error fetching materials", error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
}));
export default useMaterials;