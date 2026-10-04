import { computed } from 'vue';

/*
月份
月曆
當日明細
月度統計
篩選
TOP 10 支出
TOP 10 天支出
明細顯示 10 筆
金額計算
*/

export function useMonthlyAccounting(state) {
  const { records, viewType, currentYear, currentMonth, selectedDate, searchKeyword, filterCategory, filterAccount, sortType, showAllRecords } = state;

  // =========================
  // 星期
  // =========================

  const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

  // =========================
  // 當月紀錄
  // =========================

  const currentRecords = computed(() => {
    return records.value.filter(record => {
      const type = String(record.type || '').trim();

      return type === viewType.value;
    });
  });

  // =========================
  // 當月總金額
  // =========================

  const totalAmount = computed(() => {
    return currentRecords.value.reduce((total, record) => {
      const amount = Number(record.amount ?? record.expenseAmount ?? record.incomeAmount ?? 0);

      return total + amount;
    }, 0);
  });

  // =========================
  // 取得紀錄日期
  // =========================

  function getRecordDate(record) {
    return String(record.date ?? record.recordDate ?? record.日期 ?? '').slice(0, 10);
  }

  // =========================
  // 金額
  // =========================

  function getRecordAmount(record) {
    return Number(record.amount ?? record.expenseAmount ?? record.incomeAmount ?? 0);
  }

  // =========================
  // 月曆
  // =========================

  const calendarDays = computed(() => {
    const year = currentYear.value;
    const month = currentMonth.value;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days = [];

    // 月初空白
    for (let i = 0; i < startWeekday; i += 1) {
      days.push({
        date: null,
        records: [],
        total: 0,
      });
    }

    // 每一天
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const dayRecords = currentRecords.value.filter(record => {
        return getRecordDate(record) === dateString;
      });

      const total = dayRecords.reduce((sum, record) => {
        return sum + getRecordAmount(record);
      }, 0);

      days.push({
        date: day,
        dateString,
        records: dayRecords,
        total,
      });
    }

    return days;
  });

  // =========================
  // 今天
  // =========================

  const todayText = computed(() => {
    const today = new Date();

    return `${today.getFullYear()}-` + `${String(today.getMonth() + 1).padStart(2, '0')}-` + `${String(today.getDate()).padStart(2, '0')}`;
  });

  // =========================
  // 選擇月曆日期
  // =========================

  function selectCalendarDate(day) {
    if (!day?.dateString) {
      selectedDate.value = null;
      return;
    }

    selectedDate.value = day.dateString;
  }

  // =========================
  // 選擇日期紀錄
  // =========================

  const selectedDateRecords = computed(() => {
    if (!selectedDate.value) {
      return [];
    }

    return currentRecords.value
      .filter(record => {
        return getRecordDate(record) === selectedDate.value;
      })
      .sort((a, b) => {
        return Number(a.id || 0) - Number(b.id || 0);
      });
  });

  // =========================
  // 選擇日期總金額
  // =========================

  const selectedDateTotal = computed(() => {
    return selectedDateRecords.value.reduce((total, record) => {
      return total + getRecordAmount(record);
    }, 0);
  });

  // =========================
  // 選擇日期文字
  // =========================

  const selectedDateText = computed(() => {
    if (!selectedDate.value) {
      return '';
    }

    const date = new Date(`${selectedDate.value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return selectedDate.value;
    }

    return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  });

  // =========================
  // 取得支出類別
  // =========================

  function getExpenseCategory(record) {
    return String(record.expenseCategory ?? record.category ?? '')
      .trim()
      .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '');
  }

  // =========================
  // 取得收入類別
  // =========================

  function getIncomeCategory(record) {
    return String(record.incomeCategory ?? record.category ?? '').trim();
  }

  // =========================
  // 類別統計
  // =========================

  const categorySummary = computed(() => {
    const map = {};

    currentRecords.value.forEach(record => {
      const category = viewType.value === '支出' ? getExpenseCategory(record) : getIncomeCategory(record);

      const amount = getRecordAmount(record);

      if (!category) {
        return;
      }

      map[category] = (map[category] || 0) + amount;
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  // =========================
  // 可選類別
  // =========================

  const availableCategories = computed(() => {
    const categories = new Set();

    currentRecords.value.forEach(record => {
      const category = viewType.value === '支出' ? getExpenseCategory(record) : getIncomeCategory(record);

      if (category) {
        categories.add(category);
      }
    });

    return [...categories].sort((a, b) => {
      return a.localeCompare(b, 'zh-Hant');
    });
  });

  // =========================
  // 可選帳戶
  // =========================

  const availableAccounts = computed(() => {
    const accounts = new Set();

    currentRecords.value.forEach(record => {
      const account = String(record.account ?? record.paymentMethod ?? record.payment ?? '').trim();

      if (account) {
        accounts.add(account);
      }
    });

    return [...accounts].sort((a, b) => {
      return a.localeCompare(b, 'zh-Hant');
    });
  });

  // =========================
  // 篩選 + 排序
  // =========================

  const filteredRecords = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();

    const result = currentRecords.value.filter(record => {
      // 關鍵字
      if (keyword) {
        const text = Object.values(record)
          .map(value => String(value ?? ''))
          .join(' ')
          .toLowerCase();

        if (!text.includes(keyword)) {
          return false;
        }
      }

      // 類別
      if (filterCategory.value) {
        const category = viewType.value === '支出' ? getExpenseCategory(record) : getIncomeCategory(record);

        if (category !== filterCategory.value) {
          return false;
        }
      }

      // 帳戶
      if (filterAccount.value) {
        const account = String(record.account ?? record.paymentMethod ?? record.payment ?? '').trim();

        if (account !== filterAccount.value) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortType.value === 'amount-desc') {
        return getRecordAmount(b) - getRecordAmount(a);
      }

      if (sortType.value === 'amount-asc') {
        return getRecordAmount(a) - getRecordAmount(b);
      }

      if (sortType.value === 'date-asc') {
        return getRecordDate(a).localeCompare(getRecordDate(b));
      }

      // 預設：日期新 → 舊
      return getRecordDate(b).localeCompare(getRecordDate(a));
    });

    return result;
  });

  // =========================
  // 顯示紀錄
  // =========================

  const displayedRecords = computed(() => {
    if (showAllRecords.value) {
      return filteredRecords.value;
    }

    return filteredRecords.value.slice(0, 10);
  });

  // =========================
  // TOP 10
  // =========================

  const monthlyTop10 = computed(() => {
    return [...currentRecords.value]
      .sort((a, b) => {
        return getRecordAmount(b) - getRecordAmount(a);
      })
      .slice(0, 10);
  });

  // =========================
  // TOP 10 消費日期
  // =========================

  const monthlyTop10Days = computed(() => {
    const map = {};
  
    currentRecords.value.forEach(record => {
      const date = getRecordDate(record);
  
      if (!date) {
        return;
      }
  
      if (!map[date]) {
        map[date] = {
          date,
          total: 0,
          count: 0,
        };
      }
  
      map[date].total += getRecordAmount(record);
      map[date].count += 1;
    });
  
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  });

  return {
    weekNames,

    currentRecords,
    totalAmount,

    calendarDays,
    todayText,
    selectCalendarDate,

    selectedDateRecords,
    selectedDateTotal,
    selectedDateText,

    categorySummary,
    availableCategories,
    availableAccounts,

    filteredRecords,
    displayedRecords,

    monthlyTop10,
    monthlyTop10Days,

    getRecordDate,
    getRecordAmount,
    getExpenseCategory,
    getIncomeCategory,
  };
}
