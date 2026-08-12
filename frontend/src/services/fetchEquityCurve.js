import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';
import { apiCache } from '../utils/apiCache';

export const fetchEquityCurve = async (
  asOfDate,
  assetClass = 'ALL',
  securityId = '',
  forceRefresh = false
) => {
  const cleanSecurityId = securityId.trim();
  const cacheKey = `equity_curve_${asOfDate}_${assetClass}_${cleanSecurityId}`;

  if (!forceRefresh) {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) return cachedData;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/PnL/EquityCurve`, {
      params: { 
        asOfDate,
        assetClass: assetClass !== 'ALL' ? assetClass : undefined,
        securityId: cleanSecurityId !== '' ? cleanSecurityId : undefined
      },
    });

    apiCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch equity curve:', error);
  }

  const responseData = error.response?.data;
    const serverMessage = 
      responseData?.message || 
      responseData?.Message || 
      responseData?.title || 
      responseData?.Error || 
      (typeof responseData === 'string' ? responseData : null) ||
      error.message ||
      'Failed to retrieve equity curve data.';

    throw new Error(serverMessage);
};