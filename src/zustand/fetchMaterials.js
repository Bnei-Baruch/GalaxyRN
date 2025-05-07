import { create } from 'zustand';
import api from '../shared/Api';

const useMaterials = create((set) => ({
  materials      : [],
  fetchMaterials : async () => {
    set({ isLoading: true, error: null });
    try {
      console.log("[fetchMaterials] fetchMaterials");
      const materials = await api.fetchMaterials();
      console.log("[fetchMaterials] materials", materials);
      set({ isLoading: false, materials });
    } catch (error) {
      console.log("[fetchMaterials] error", error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
}));
export default useMaterials;