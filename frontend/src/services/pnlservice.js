import axios from 'axios'
import { API_BASE_URL } from '../utils/apiConfig';
import {apiCache} from '../utils/apiCache';


export const fetchPnLSnapshot = async (valuationDate = '2026-03-31', forceRefresh = false) => {
  const cacheKey = `pnl_snapshot_${valuationDate}`;

  if (!forceRefresh) {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) return cachedData;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/PnL`, {
      params: { valuationDate },
    });

    apiCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    // console.error('Failed to fetch PnL snapshot:', error);
    throw new Error(error.response?.data?.message || 'Failed to retrieve PnL snapshot.');
  }
};