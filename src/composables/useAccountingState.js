import { computed, ref } from 'vue';

/*
所有共用狀態
*/

export function useAccountingState() {
  // =========================
  // 基本資料
  // =========================

  const records = ref([]);
  const yearlyRecords = ref([]);

  const expenseCategoryGroups = ref({});
  const paymentMethods = ref({});

  // =========================
  // Loading / Error
  // =========================

  const loading = ref(false);
  const yearlyLoading = ref(false);
  const error = ref('');

  // =========================
  // 頁面狀態
  // =========================

  const activePage = ref('monthly');
  const viewType = ref('支出');

  // =========================
  // 日期
  // =========================

  const currentDate = ref(new Date());
  const yearlyDate = ref(new Date());

  const selectedDate = ref(null);

  // =========================
  // 月度篩選
  // =========================

  const searchKeyword = ref('');
  const filterCategory = ref('');
  const filterAccount = ref('');
  const sortType = ref('date-desc');

  const showAllRecords = ref(false);

  // =========================
  // UI
  // =========================

  const showBackToTop = ref(false);

  // =========================
  // ECharts DOM
  // =========================

  const categoryChartEl = ref(null);
  const rankingChartEl = ref(null);

  const yearlyExpenseChartEl = ref(null);
  const yearlyCashflowChartEl = ref(null);

  // =========================
  // 日期 Computed
  // =========================

  const currentYear = computed(() => currentDate.value.getFullYear());

  const currentMonth = computed(() => currentDate.value.getMonth());

  const selectedYear = computed(() => yearlyDate.value.getFullYear());

  const monthTitle = computed(() => {
    return `${currentYear.value} 年 ${currentMonth.value + 1} 月`;
  });

  const yearlyTitle = computed(() => {
    return `${selectedYear.value} 年度統計`;
  });

  return {
    // 資料
    records,
    yearlyRecords,
    expenseCategoryGroups,
    paymentMethods,

    // loading
    loading,
    yearlyLoading,
    error,

    // page
    activePage,
    viewType,

    // date
    currentDate,
    yearlyDate,
    selectedDate,

    currentYear,
    currentMonth,
    selectedYear,

    monthTitle,
    yearlyTitle,

    // filter
    searchKeyword,
    filterCategory,
    filterAccount,
    sortType,
    showAllRecords,

    // UI
    showBackToTop,

    // charts
    categoryChartEl,
    rankingChartEl,
    yearlyExpenseChartEl,
    yearlyCashflowChartEl,
  };
}