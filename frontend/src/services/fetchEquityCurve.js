import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

export const fetchEquityCurve = async (asOfDate, assetClass = 'ALL', securityId = '') => {
  const response = await axios.get(`${API_BASE_URL}/PnL/EquityCurve`, {
    params: { 
      asOfDate,
      assetClass: assetClass !== 'ALL' ? assetClass : undefined,
      securityId: securityId.trim() !== '' ? securityId : undefined
    },
  });
  return response.data;
};