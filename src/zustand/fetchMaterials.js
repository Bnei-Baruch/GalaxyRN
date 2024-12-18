import { create } from 'zustand';
import api from '../shared/Api';

const useMaterials = create((set) => ({
  materials      : [],
  fetchMaterials : async () => {
    set({ isLoading: true, error: null });
    try {
      const materials = await api.fetchMaterials();
      set({ isLoading: false, materials });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
}));
export default useMaterials;