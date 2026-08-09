import { API_BASE_URL } from "../utils/apiConfig";

export const fetchTradeBlotter= async (filters = {}) =>{
    const activeFilters = Object.entries(filters).filter(([_, val]) => val);
  const queryParams = new URLSearchParams(activeFilters);

  const response = await fetch(`${API_BASE_URL}/TradeBlotter?${queryParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.Error || `Server error: ${response.status}`);
  }

  return await response.json();
}