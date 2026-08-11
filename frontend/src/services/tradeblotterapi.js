import { API_BASE_URL } from "../utils/apiConfig";
import {apiCache} from '../utils/apiCache';


export const fetchTradeBlotter = async (filters = {}, forceRefresh = false) => {
  const activeFilters = Object.entries(filters).filter(([_, val]) => val);
  const queryParams = new URLSearchParams(activeFilters);
  const cacheKey = `trade_blotter_${queryParams.toString()}`;

  //check cache
  if (!forceRefresh) {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) return cachedData;
  }

  const response = await fetch(`${API_BASE_URL}/TradeBlotter?${queryParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Error || `Server error: ${response.status}`);
  }

  //save cache
  const data = await response.json();
  apiCache.set(cacheKey, data);
  return data;
};