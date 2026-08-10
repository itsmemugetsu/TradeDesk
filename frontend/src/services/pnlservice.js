import axios from 'axios'
import { API_BASE_URL } from '../utils/apiConfig';

export const fetchPnLSnapshot = async (valuationDate) => {
  const response = await axios.get(`${API_BASE_URL}/PnL`, {
    params: { valuationDate },
  });
  return response.data;
};