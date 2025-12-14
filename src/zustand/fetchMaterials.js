import { create } from 'zustand';
import api from '../services/Api';
import logger from '../services/logger';

const NAMESPACE = 'Materials';

export const useMaterials = create(set => ({
  materials: [],

  fetchMaterials: async () => {
    set({ isLoading: true, error: null });
    try {
      logger.debug(NAMESPACE, 'Fetching materials');
      const materials = await api.fetchMaterials();
      for (const material of materials) {
        material.Description = material.Description.replace(/id="[^"]*"/g, '') // Remove all id attributes
          .replace(/dir="[^"]*"/g, '') // Remove dir attributes
          .replace(/style="[^"]*color:\s*rgb\(0,0,0\)[^"]*"/g, '') // Remove black color styles
          .replace(/<font[^>]*>/g, '<span>') // Replace font tags with span
          .replace(/<\/font>/g, '</span>'); // Close font tags
      }

      logger.debug(NAMESPACE, 'Materials fetched successfully', materials);
      set({ isLoading: false, materials });
    } catch (error) {
      logger.error(NAMESPACE, 'Error fetching materials', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
}));
