import { nextTick } from 'vue';
import * as echarts from 'echarts';

/*
ECharts 圖表
*/

export function useAccountingCharts({
  categoryChartEl,
  rankingChartEl,
  yearlyExpenseChartEl,
  yearlyCashflowChartEl,

  categorySummary,
  monthlyTop10,
  yearlyExpenseMajorSummary,
  yearlyMonthlySummary,

  getRecordAmount,
  formatMoney,
}) {
  let categoryChart = null;
  let rankingChart = null;
  let yearlyExpenseChart = null;
  let yearlyCashflowChart = null;

  // =========================
  // 初始化 Chart
  // =========================

  function ensureCharts() {
    if (categoryChartEl.value && !categoryChart) {
      categoryChart = echarts.init(categoryChartEl.value);
    }

    if (rankingChartEl.value && !rankingChart) {
      rankingChart = echarts.init(rankingChartEl.value);
    }

    if (yearlyExpenseChartEl.value && !yearlyExpenseChart) {
      yearlyExpenseChart = echarts.init(yearlyExpenseChartEl.value);
    }

    if (yearlyCashflowChartEl.value && !yearlyCashflowChart) {
      yearlyCashflowChart = echarts.init(yearlyCashflowChartEl.value);
    }
  }

  // =========================
  // 月度：類別圓餅圖
  // =========================

  function renderCategoryChart() {
    if (!categoryChartEl.value) {
      return;
    }

    ensureCharts();

    if (!categoryChart) {
      return;
    }

    const data = categorySummary.value.map(item => ({
      name: item.category,
      value: item.amount,
    }));

    categoryChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: params => {
          return `
            ${params.name}<br/>
            ${formatMoney(params.value)}
            (${params.percent}%)
          `;
        },
      },

      legend: {
        type: 'scroll',
        bottom: 0,
      },

      series: [
        {
          type: 'pie',
          radius: ['42%', '72%'],
          center: ['50%', '45%'],

          avoidLabelOverlap: true,

          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },

          label: {
            formatter: params => {
              return `${params.name}\n${formatMoney(params.value)}`;
            },
          },

          data,
        },
      ],
    });
  }

  // =========================
  // 月度：TOP 10
  // =========================

  function renderRankingChart() {
    if (!rankingChartEl.value) {
      return;
    }
  
    ensureCharts();
  
    if (!rankingChart) {
      return;
    }
  
    const data = categorySummary.value.slice(0, 10);
  
    const names = data.map((record, index) => {
      return `${record.category}`;
    });
  
    const values = data.map(record => {
      return record.amount;
    });
  
    rankingChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: params => {
          const item = params[0];
  
          return `
            ${item.name}<br/>
            ${formatMoney(item.value)}
          `;
        },
      },
  
      grid: {
        left: 20,
        right: 30,
        top: 20,
        bottom: 20,
        containLabel: true,
      },
  
      xAxis: {
        type: 'value',
  
        axisLabel: {
          formatter: value => {
            return formatMoney(value);
          },
        },
      },
  
      yAxis: {
        type: 'category',
        inverse: true,
        data: names,
  
        axisLabel: {
          width: 180,
          overflow: 'truncate',
        },
      },
  
      series: [
        {
          type: 'bar',
          data: values,
          barMaxWidth: 28,
  
          label: {
            show: true,
            position: 'right',
  
            formatter: params => {
              return formatMoney(params.value);
            },
          },
        },
      ],
    });
  }

  // =========================
  // 年度：支出大分類
  // =========================

  function renderYearlyExpenseChart() {
    if (!yearlyExpenseChartEl.value) {
      return;
    }

    ensureCharts();

    if (!yearlyExpenseChart) {
      return;
    }

    const data = yearlyExpenseMajorSummary.value.map(item => ({
      name: item.majorCategory,
      value: item.amount,
    }));

    yearlyExpenseChart.setOption({
      tooltip: {
        trigger: 'item',

        formatter: params => {
          return `
            ${params.name}<br/>
            ${formatMoney(params.value)}
            (${params.percent}%)
          `;
        },
      },

      legend: {
        type: 'scroll',
        bottom: 0,
      },

      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],

          label: {
            formatter: params => {
              return `${params.name}\n${formatMoney(params.value)}`;
            },
          },

          data,
        },
      ],
    });
  }

  // =========================
  // 年度：收支趨勢
  // =========================

  function renderYearlyCashflowChart() {
    if (!yearlyCashflowChartEl.value) {
      return;
    }

    ensureCharts();

    if (!yearlyCashflowChart) {
      return;
    }

    const months = yearlyMonthlySummary.value.map(item => `${item.month}月`);

    const income = yearlyMonthlySummary.value.map(item => item.income);

    const expense = yearlyMonthlySummary.value.map(item => item.expense);

    const balance = yearlyMonthlySummary.value.map(item => item.balance);

    yearlyCashflowChart.setOption({
      tooltip: {
        trigger: 'axis',

        formatter: params => {
          if (!params.length) {
            return '';
          }

          let html = `${params[0].axisValue}<br/>`;

          params.forEach(item => {
            html += `
              ${item.marker}
              ${item.seriesName}：
              ${formatMoney(item.value)}<br/>
            `;
          });

          return html;
        },
      },

      legend: {
        top: 0,
      },

      grid: {
        left: 20,
        right: 30,
        top: 45,
        bottom: 20,
        containLabel: true,
      },

      xAxis: {
        type: 'category',
        data: months,
      },

      yAxis: {
        type: 'value',

        axisLabel: {
          formatter: value => {
            return formatMoney(value);
          },
        },
      },

      series: [
        {
          name: '收入',
          type: 'line',
          smooth: true,
          data: income,
        },

        {
          name: '支出',
          type: 'line',
          smooth: true,
          data: expense,
        },

        {
          name: '結餘',
          type: 'line',
          smooth: true,
          data: balance,
        },
      ],
    });
  }

  // =========================
  // 月度所有圖表
  // =========================

  async function renderMonthlyCharts() {
    await nextTick();

    ensureCharts();

    renderCategoryChart();
    renderRankingChart();
  }

  // =========================
  // 年度所有圖表
  // =========================

  async function renderYearlyCharts() {
    await nextTick();

    ensureCharts();

    renderYearlyExpenseChart();
    renderYearlyCashflowChart();
  }

  // =========================
  // Resize
  // =========================

  function handleResize() {
    categoryChart?.resize();
    rankingChart?.resize();

    yearlyExpenseChart?.resize();
    yearlyCashflowChart?.resize();
  }

  // =========================
  // Dispose
  // =========================

  function dispose() {
    categoryChart?.dispose();
    rankingChart?.dispose();

    yearlyExpenseChart?.dispose();
    yearlyCashflowChart?.dispose();

    categoryChart = null;
    rankingChart = null;

    yearlyExpenseChart = null;
    yearlyCashflowChart = null;
  }

  return {
    ensureCharts,

    renderCategoryChart,
    renderRankingChart,

    renderYearlyExpenseChart,
    renderYearlyCashflowChart,

    renderMonthlyCharts,
    renderYearlyCharts,

    handleResize,
    dispose,
  };
}
