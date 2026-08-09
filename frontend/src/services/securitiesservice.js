import axios from 'axios'
import { API_BASE_URL } from '../utils/apiConfig';


/**
 * 
 * @param {string} 
 * @returns {Promise<Array>} 
 */
export const fetchSecuritiesSummary = async (activityDate = '2026-03-31') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/AssetSummary/`, {
      params: {
        asOfDate: activityDate,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch securities summary:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to retrieve securities master records.'
    );
  }
};