import axios from 'axios';

/*
API / Google Sheets 資料
*/

export function useAccountingApi(state) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const { records, yearlyRecords, expenseCategoryGroups, paymentMethods, loading, yearlyLoading, error, currentYear, currentMonth, selectedYear } = state;

  // =========================
  // API Instance
  // =========================

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  // =========================
  // 取得分類
  // =========================

  async function loadCategories() {
    try {
      const response = await api.get('/api/categories');

      const data = response.data || {};

      expenseCategoryGroups.value = data.expenseCategoryGroups || data.expenseCategories || data.categories || {};

      paymentMethods.value = data.paymentMethods || {};
    } catch (err) {
      console.error('取得分類失敗:', err);

      error.value = err.response?.data?.message || err.message || '取得分類資料失敗';
    }
  }

  // =========================
  // 取得月度紀錄
  // =========================

  async function loadRecords() {
    loading.value = true;
    error.value = '';

    try {
      const year = currentYear.value;
      const month = currentMonth.value + 1;

      const response = await api.get('/api/records', {
        params: {
          year,
          month,
        },
      });
      records.value = response.data?.data || [];
    } catch (err) {
      console.error('取得月度紀錄失敗:', err);

      records.value = [];

      error.value = err.response?.data?.message || err.message || '取得記帳資料失敗';
    } finally {
      loading.value = false;
    }
  }

  // =========================
  // 取得年度紀錄
  // =========================

  async function loadYearlyRecords() {
    yearlyLoading.value = true;
    error.value = '';

    try {
      const year = selectedYear.value;

      const response = await api.get('/api/records', {
        params: {
          year,
        },
      });

      yearlyRecords.value = response.data.data || [];
    } catch (err) {
      console.error('取得年度紀錄失敗:', err);

      yearlyRecords.value = [];

      error.value = err.response?.data?.message || err.message || '取得年度記帳資料失敗';
    } finally {
      yearlyLoading.value = false;
    }
  }

  // =========================
  // 測試 API
  // =========================

  async function checkHealth() {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (err) {
      console.error('API Health Check 失敗:', err);
      return null;
    }
  }

  return {
    api,
    loadCategories,
    loadRecords,
    loadYearlyRecords,
    checkHealth,
  };
}
