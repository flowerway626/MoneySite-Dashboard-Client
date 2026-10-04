import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useAccountingState } from './useAccountingState';
import { useAccountingApi } from './useAccountingApi';
import { useMonthlyAccounting } from './useMonthlyAccounting';
import { useYearlyAccounting } from './useYearlyAccounting';
import { useAccountingCharts } from './useAccountingCharts';

/*
唯一入口，負責組合其他 composable
*/

export function useAccounting() {
  // =========================================================
  // State
  // =========================================================

  const state = useAccountingState();

  // =========================================================
  // API
  // =========================================================

  const api = useAccountingApi(state);

  // =========================================================
  // 月度
  // =========================================================

  const monthly = useMonthlyAccounting(state);

  // =========================================================
  // 年度
  // =========================================================

  const yearly = useYearlyAccounting(state);

  // =========================================================
  // 金額格式
  // =========================================================

  const currencyFormatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  });

  function formatMoney(value) {
    return currencyFormatter.format(Number(value) || 0);
  }

  // =========================================================
  // ECharts
  // =========================================================

  const charts = useAccountingCharts({
    categoryChartEl: state.categoryChartEl,
    rankingChartEl: state.rankingChartEl,

    yearlyExpenseChartEl: state.yearlyExpenseChartEl,

    yearlyCashflowChartEl: state.yearlyCashflowChartEl,

    categorySummary: monthly.categorySummary,

    monthlyTop10: monthly.monthlyTop10,

    yearlyExpenseMajorSummary: yearly.yearlyExpenseMajorSummary,

    yearlyMonthlySummary: yearly.yearlyMonthlySummary,

    getRecordAmount: monthly.getRecordAmount,

    formatMoney,
  });

  // =========================================================
  // 月度 API + 圖表
  // =========================================================

  async function loadMonthlyRecords() {
    await api.loadRecords();

    await nextTick();

    if (state.activePage.value === 'monthly') {
      charts.renderMonthlyCharts();
    }
  }

  // =========================================================
  // 年度 API + 圖表
  // =========================================================

  async function loadYearlyRecords() {
    await api.loadYearlyRecords();
    await nextTick();
    
    if (state.activePage.value === 'yearly') {
      charts.renderYearlyCharts();
    }
  }

  // =========================================================
  // 切換到月度
  // =========================================================

  async function showMonthlyPage() {
    state.activePage.value = 'monthly';

    await nextTick();

    charts.renderMonthlyCharts();
  }

  // =========================================================
  // 切換到年度
  // =========================================================

  async function showYearlyPage() {
    state.activePage.value = 'yearly';

    await loadYearlyRecords();
  }

  // =========================================================
  // 重新整理
  // =========================================================

  async function refreshCurrentPage() {
    if (state.activePage.value === 'monthly') {
      await loadMonthlyRecords();
      await charts.renderMonthlyCharts();
      return;
    }
  
    await loadYearlyRecords();
    await renderYearlyCharts();
  }

  // =========================================================
  // 切換月份
  // =========================================================

  async function previousMonth() {
    const date = new Date(state.currentDate.value);

    date.setMonth(date.getMonth() - 1);

    state.currentDate.value = date;
  }

  async function nextMonth() {
    const date = new Date(state.currentDate.value);

    date.setMonth(date.getMonth() + 1);

    state.currentDate.value = date;
  }

  function goCurrentMonth() {
    state.currentDate.value = new Date();
  }

  // =========================================================
  // 切換年度
  // =========================================================

  function previousYear() {
    const date = new Date(state.yearlyDate.value);

    date.setFullYear(date.getFullYear() - 1);

    state.yearlyDate.value = date;
  }

  function nextYear() {
    const date = new Date(state.yearlyDate.value);

    date.setFullYear(date.getFullYear() + 1);

    state.yearlyDate.value = date;
  }

  function goCurrentYear() {
    state.yearlyDate.value = new Date();
  }

  // =========================================================
  // 支出 / 收入
  // =========================================================

  function setViewType(type) {
    state.viewType.value = type;

    state.searchKeyword.value = '';
    state.filterCategory.value = '';
    state.filterAccount.value = '';
    state.showAllRecords.value = false;

    state.selectedDate.value = null;
  }

  // =========================================================
  // 清除篩選
  // =========================================================

  function clearFilters() {
    state.searchKeyword.value = '';
    state.filterCategory.value = '';
    state.filterAccount.value = '';
    state.sortType.value = 'date-desc';

    state.showAllRecords.value = false;
  }

  // =========================================================
  // 顯示全部
  // =========================================================

  function toggleShowAllRecords() {
    state.showAllRecords.value = !state.showAllRecords.value;
  }

  // =========================================================
  // 回到頂端
  // =========================================================

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // =========================================================
  // Scroll
  // =========================================================

  function handleScroll() {
    state.showBackToTop.value = window.scrollY > 300;
  }

  // =========================================================
  // Watch：月份
  // =========================================================

  watch([state.currentYear, state.currentMonth, state.viewType], async () => {
    if (state.activePage.value !== 'monthly') {
      return;
    }

    state.selectedDate.value = null;

    await loadMonthlyRecords();
  });

  // =========================================================
  // Watch：年度
  // =========================================================

  watch(state.selectedYear, async () => {
    if (state.activePage.value !== 'yearly') {
      return;
    }

    await loadYearlyRecords();
  });

  // =========================================================
  // Watch：月度篩選
  // =========================================================

  watch([state.searchKeyword, state.filterCategory, state.filterAccount, state.sortType, state.viewType], () => {
    state.showAllRecords.value = false;
  });

  // =========================================================
  // Resize
  // =========================================================

  function handleResize() {
    charts.handleResize();
  }

  // =========================================================
  // Mounted
  // =========================================================

  onMounted(async () => {
    window.addEventListener('resize', handleResize);

    window.addEventListener('scroll', handleScroll, { passive: true });

    await api.loadCategories();

    await loadMonthlyRecords();
  });

  // =========================================================
  // Unmounted
  // =========================================================

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);

    window.removeEventListener('scroll', handleScroll);

    charts.dispose();
  });

  // =========================================================
  // Return
  // =========================================================

  return {
    // =======================================================
    // State
    // =======================================================

    ...state,

    // =======================================================
    // API
    // =======================================================

    api: api.api,

    loadCategories: api.loadCategories,

    loadRecords: loadMonthlyRecords,

    loadYearlyRecords,

    checkHealth: api.checkHealth,

    // =======================================================
    // 月度
    // =======================================================

    ...monthly,

    // =======================================================
    // 年度
    // =======================================================

    ...yearly,

    // =======================================================
    // 頁面
    // =======================================================

    showMonthlyPage,
    showYearlyPage,
    refreshCurrentPage,

    // =======================================================
    // 月份
    // =======================================================

    previousMonth,
    nextMonth,
    goToday: goCurrentMonth,

    // =======================================================
    // 年度
    // =======================================================

    previousYear,
    nextYear,
    goCurrentYear,

    // =======================================================
    // 支出 / 收入
    // =======================================================

    setViewType,
    changeType: setViewType,

    // =======================================================
    // Filter
    // =======================================================

    clearFilters,
    toggleShowAllRecords,

    // =======================================================
    // UI
    // =======================================================

    scrollToTop,
    handleScroll,
    handleResize,

    // =======================================================
    // Charts
    // =======================================================

    ...charts,

    // =======================================================
    // Format
    // =======================================================

    formatMoney,
  };
}
