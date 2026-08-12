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
    let serverMessage = `Server error: ${response.status}`;

    try {
      const errorData = await response.json();
      // Extracts exact string from C# return BadRequest(new { message = "..." }) or NotFound(new { message = "..." })
      serverMessage = 
        errorData.message || 
        errorData.Message || 
        errorData.title || 
        errorData.Error || 
        serverMessage;
    } catch {
      // Fallback if response isn't JSON
    }

    throw new Error(serverMessage);
  }
  //save cache
  const data = await response.json();
  apiCache.set(cacheKey, data);
  return data;
};