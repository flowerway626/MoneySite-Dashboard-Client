import { computed } from 'vue';

/*
年度 TOP12
月度收支
年度總計
支出大分類
支出類別 × 1～12 月
收入類別 × 1～12 月
支出帳戶 × 1～12 月
收入帳戶 × 1～12 月
月度小計
*/

export function useYearlyAccounting(state) {
  const { yearlyRecords, yearlyDate, expenseCategoryGroups } = state;

  const selectedYear = computed(() => {
    return yearlyDate.value.getFullYear();
  });

  const yearlyTitle = computed(() => {
    return `${selectedYear.value} 年度統計`;
  });

  /* =========================================================
   * 年度工具
   * ========================================================= */

  function getExpenseCategory(record) {
    return String(record.expenseCategory || record.category || '')
      .trim()
      .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '');
  }

  function getIncomeCategory(record) {
    return String(record.incomeCategory || record.category || '').trim();
  }

  function getExpenseAmount(record) {
    return Number(record.expenseAmount ?? record.amount ?? 0);
  }

  function getIncomeAmount(record) {
    return Number(record.incomeAmount ?? record.amount ?? 0);
  }

  /* =========================================================
   * TOP 10
   * ========================================================= */

  const yearlyTop12 = computed(() => {
    return [...yearlyRecords.value]
      .filter(record => record.type === '支出')
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 10);
  });

  /* =========================================================
   * 每月收支
   * ========================================================= */

  const yearlyMonthlySummary = computed(() => {
    const result = [];

    const records = Array.isArray(yearlyRecords.value) ? yearlyRecords.value : [];

    for (let month = 1; month <= 12; month++) {
      const monthText = String(month).padStart(2, '0');

      const monthRecords = records.filter(record => record.date?.startsWith(`${selectedYear.value}-${monthText}-`));

      const income = monthRecords.filter(record => record.type === '收入').reduce((sum, record) => sum + getIncomeAmount(record), 0);

      const expense = monthRecords.filter(record => record.type === '支出').reduce((sum, record) => sum + getExpenseAmount(record), 0);

      result.push({
        month,
        income,
        expense,
        balance: income - expense,
      });
    }

    return result;
  });

  const yearlyTotal = computed(() => {
    return yearlyMonthlySummary.value.reduce(
      (result, item) => {
        result.income += item.income;
        result.expense += item.expense;
        result.balance += item.balance;

        return result;
      },
      {
        income: 0,
        expense: 0,
        balance: 0,
      },
    );
  });

  /* =========================================================
   * 支出大分類
   * ========================================================= */

  const yearlyExpenseMajorSummary = computed(() => {
    const records = Array.isArray(yearlyRecords.value) ? yearlyRecords.value : [];

    return Object.entries(expenseCategoryGroups.value)
      .map(([majorCategory, children]) => {
        const value = records
          .filter(record => {
            if (record.type !== '支出') {
              return false;
            }

            const category = getExpenseCategory(record);

            return children.some(child => {
              const childName = String(child).trim();

              return category === childName || category.endsWith(` ${childName}`);
            });
          })
          .reduce((sum, record) => sum + getExpenseAmount(record), 0);

        return {
          name: majorCategory,
          value,
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  });

  /* =========================================================
   * 支出類別 × 月份
   * ========================================================= */

  const yearlyExpenseCategoryGroups = computed(() => {
    const records = Array.isArray(yearlyRecords.value) ? yearlyRecords.value : [];

    return Object.entries(expenseCategoryGroups.value)
      .map(([majorCategory, children]) => {
        const rows = children.map(category => {
          const months = [];

          for (let month = 1; month <= 12; month++) {
            const monthText = String(month).padStart(2, '0');

            const total = records
              .filter(record => {
                if (record.type !== '支出') {
                  return false;
                }

                const recordCategory = getExpenseCategory(record);

                return recordCategory === String(category).trim() && record.date?.startsWith(`${selectedYear.value}-${monthText}-`);
              })
              .reduce((sum, record) => sum + getExpenseAmount(record), 0);

            months.push(total);
          }

          return {
            category,
            months,
            total: months.reduce((sum, value) => sum + value, 0),
          };
        });

        const subtotal = Array.from({ length: 12 }, (_, index) => rows.reduce((sum, row) => sum + Number(row.months[index] || 0), 0));

        return {
          majorCategory,
          rows,
          subtotal,
          total: subtotal.reduce((sum, value) => sum + value, 0),
        };
      })
      .filter(group => group.total > 0);
  });

  const yearlyExpenseMonthlySubtotal = computed(() => {
    return Array.from({ length: 12 }, (_, index) => yearlyExpenseCategoryGroups.value.reduce((sum, group) => sum + Number(group.subtotal[index] || 0), 0));
  });

  /* =========================================================
   * 收入類別
   * ========================================================= */

  const yearlyIncomeCategories = computed(() => {
    return [
      ...new Set(
        yearlyRecords.value
          .filter(record => record.type === '收入')
          .map(record => getIncomeCategory(record))
          .filter(Boolean),
      ),
    ].sort();
  });

  const yearlyIncomeCategoryTable = computed(() => {
    const records = Array.isArray(yearlyRecords.value) ? yearlyRecords.value : [];

    return yearlyIncomeCategories.value.map(category => {
      const months = [];

      for (let month = 1; month <= 12; month++) {
        const monthText = String(month).padStart(2, '0');

        const total = records
          .filter(record => {
            const incomeCategory = getIncomeCategory(record);

            return record.type === '收入' && incomeCategory === String(category).trim() && record.date?.startsWith(`${selectedYear.value}-${monthText}-`);
          })
          .reduce((sum, record) => sum + getIncomeAmount(record), 0);

        months.push(total);
      }

      return {
        category,
        months,
        total: months.reduce((sum, value) => sum + value, 0),
      };
    });
  });

  const yearlyIncomeMonthlySubtotal = computed(() => {
    return Array.from({ length: 12 }, (_, index) => yearlyIncomeCategoryTable.value.reduce((sum, row) => sum + Number(row.months[index] || 0), 0));
  });

  /* =========================================================
   * 帳戶
   * ========================================================= */

  const yearlyExpenseAccounts = computed(() => {
    return [
      ...new Set(
        yearlyRecords.value
          .filter(record => record.type === '支出')
          .map(record => record.expenseAccount)
          .filter(Boolean),
      ),
    ].sort();
  });

  const yearlyIncomeAccounts = computed(() => {
    return [
      ...new Set(
        yearlyRecords.value
          .filter(record => record.type === '收入')
          .map(record => record.incomeAccount)
          .filter(Boolean),
      ),
    ].sort();
  });

  function buildAccountMonthlyTable(type) {
    const accounts = type === '支出' ? yearlyExpenseAccounts.value : yearlyIncomeAccounts.value;

    const records = Array.isArray(yearlyRecords.value) ? yearlyRecords.value : [];

    return accounts.map(account => {
      const months = [];

      for (let month = 1; month <= 12; month++) {
        const monthText = String(month).padStart(2, '0');

        const total = records
          .filter(record => {
            const recordAccount = type === '支出' ? record.expenseAccount : record.incomeAccount;

            return record.type === type && recordAccount === account && record.date?.startsWith(`${selectedYear.value}-${monthText}-`);
          })
          .reduce((sum, record) => sum + (type === '支出' ? getExpenseAmount(record) : getIncomeAmount(record)), 0);

        months.push(total);
      }

      return {
        account,
        months,
        total: months.reduce((sum, value) => sum + value, 0),
      };
    });
  }

  const yearlyExpenseAccountTable = computed(() => buildAccountMonthlyTable('支出'));

  const yearlyIncomeAccountTable = computed(() => buildAccountMonthlyTable('收入'));

  const yearlyExpenseAccountSubtotal = computed(() => {
    return Array.from({ length: 12 }, (_, index) => yearlyExpenseAccountTable.value.reduce((sum, row) => sum + Number(row.months[index] || 0), 0));
  });

  const yearlyIncomeAccountSubtotal = computed(() => {
    return Array.from({ length: 12 }, (_, index) => yearlyIncomeAccountTable.value.reduce((sum, row) => sum + Number(row.months[index] || 0), 0));
  });

  /* =========================================================
   * 年度控制
   * ========================================================= */

  function previousYear() {
    yearlyDate.value = new Date(selectedYear.value - 1, 0, 1);
  }

  function nextYear() {
    yearlyDate.value = new Date(selectedYear.value + 1, 0, 1);
  }

  function goCurrentYear() {
    yearlyDate.value = new Date();
  }

  return {
    selectedYear,
    yearlyTitle,

    yearlyTop12,

    yearlyMonthlySummary,
    yearlyTotal,

    yearlyExpenseMajorSummary,
    yearlyExpenseCategoryGroups,
    yearlyExpenseMonthlySubtotal,

    yearlyIncomeCategories,
    yearlyIncomeCategoryTable,
    yearlyIncomeMonthlySubtotal,

    yearlyExpenseAccounts,
    yearlyIncomeAccounts,

    yearlyExpenseAccountTable,
    yearlyIncomeAccountTable,

    yearlyExpenseAccountSubtotal,
    yearlyIncomeAccountSubtotal,

    previousYear,
    nextYear,
    goCurrentYear,
  };
}