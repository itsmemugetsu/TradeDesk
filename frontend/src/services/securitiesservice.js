import axios from 'axios'
import { API_BASE_URL } from '../utils/apiConfig';
import {apiCache} from '../utils/apiCache';

/**
 * 
 * @param {string} 
 * @returns {Promise<Array>} 
 */
export const fetchSecuritiesSummary = async (activityDate = '2026-03-31', forceRefresh = false) => {
  const cacheKey = `securities_${activityDate}`;

  // Check cache (unless forceRefresh is true)
  if (!forceRefresh) {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) return cachedData;
  }

  // Fetch from backend
  try {
    const response = await axios.get(`${API_BASE_URL}/AssetSummary/`, {
      params: { asOfDate: activityDate },
    });

    // Save to cache 
    apiCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch securities summary:', error);
    throw new Error(error.response?.data?.message || 'Failed to retrieve securities.');
  }
};