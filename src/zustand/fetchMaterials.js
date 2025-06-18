// External libraries
import { create } from 'zustand';

// Services
import logger from '../services/logger';

// Shared modules
import api from '../shared/Api';

const NAMESPACE = 'Materials';

const useMaterials = create(set => ({
  materials: [],

  fetchMaterials: async () => {
    set({ isLoading: true, error: null });
    try {
      logger.debug(NAMESPACE, 'Fetching materials');
      const materials = await api.fetchMaterials();
      logger.debug(NAMESPACE, 'Materials fetched successfully', materials);
      set({ isLoading: false, materials });
    } catch (error) {
      logger.error(NAMESPACE, 'Error fetching materials', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
}));

export default useMaterials;
