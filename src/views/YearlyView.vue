<script setup>
  import { inject } from 'vue';

  const accounting = inject('accounting');

  const {
    selectedYear,
    yearlyTitle,
    yearlyLoading,
    yearlyExpenseChartEl,
    yearlyCashflowChartEl,
    yearlyTop12,
    yearlyMonthlySummary,
    yearlyTotal,
    yearlyExpenseMajorSummary,
    yearlyExpenseCategoryGroups,
    yearlyExpenseMonthlySubtotal,
    yearlyIncomeCategoryTable,
    yearlyIncomeMonthlySubtotal,
    yearlyExpenseAccountTable,
    yearlyIncomeAccountTable,
    yearlyExpenseAccountSubtotal,
    yearlyIncomeAccountSubtotal,
    formatMoney,
    previousYear,
    nextYear,
    goCurrentYear,
  } = accounting;
</script>

<template>
  <section class="toolbar card">
    <div class="month-control">
      <button @click="previousYear">‹</button>
      <strong>{{ yearlyTitle }}</strong>
      <button @click="nextYear">›</button>
      <button class="today-btn" @click="goCurrentYear">今年</button>
    </div>
  </section>

  <div v-if="yearlyLoading" class="loading-card card">正在讀取 {{ selectedYear }} 年資料…</div>

  <template v-else>
    <!-- 年度圖表 -->
    <section class="chart-grid yearly-chart-grid">
      <div class="card chart-card">
        <div class="section-title">
          <div>
            <h2>支出大分類</h2>
            <span>{{ selectedYear }} 年支出分布</span>
          </div>
        </div>

        <div ref="yearlyExpenseChartEl" class="chart"></div>
      </div>

      <div class="card chart-card">
        <div class="section-title">
          <div>
            <h2>年度收支趨勢</h2>
            <span>每月收入、支出與結餘</span>
          </div>
        </div>

        <div ref="yearlyCashflowChartEl" class="chart"></div>
      </div>
    </section>

    <!-- 年度 TOP + 收支 -->

    <section class="yearly-two-column">
      <div class="card yearly-card">
        <div class="section-title">
          <div>
            <h2>年度 TOP 10</h2>
            <span>{{ selectedYear }} 年金額最高的 12 筆支出</span>
          </div>
        </div>

        <div v-if="!yearlyTop12.length" class="empty-records">沒有支出紀錄</div>

        <div v-else class="yearly-top-list">
          <div v-for="(record, index) in yearlyTop12" :key="record.id" class="yearly-top-row">
            <div class="top-rank">{{ index + 1 }}</div>
            <div class="yearly-top-info">
              <strong>{{ record.expenseDetail || "—" }}</strong>
              <span>{{ record.date }} · {{ record.expenseCategory || record.category || "未分類" }} · {{ record.expenseAccount || "—" }}</span>
            </div>
            <strong>{{ formatMoney(record.expenseAmount || record.amount) }}</strong>
          </div>
        </div>
      </div>

      <div class="card yearly-card">
        <div class="section-title">
          <div>
            <h2>收支總表</h2>
            <span>每月收入、支出與結餘</span>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="statistics-table">
            <thead>
              <tr>
                <th>月份</th>
                <th>收入</th>
                <th>支出</th>
                <th>結餘</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in yearlyMonthlySummary" :key="item.month">
                <td>{{ item.month }}月</td>
                <td>{{ formatMoney(item.income) }}</td>
                <td>{{ formatMoney(item.expense) }}</td>
                <td
                  :class="{
                      'negative-balance': item.balance < 0,
                    }">
                  {{ formatMoney(item.balance) }}
                </td>
              </tr>

              <tr class="total-row">
                <td>年度合計</td>
                <td>{{ formatMoney(yearlyTotal.income) }}</td>
                <td>{{ formatMoney(yearlyTotal.expense) }}</td>
                <td
                  :class="{
                      'negative-balance': yearlyTotal.balance < 0,
                    }">
                  {{ formatMoney(yearlyTotal.balance) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- =================================================
                              支出類別
          ================================================= -->

    <section class="card yearly-card">
      <div class="section-title">
        <div>
          <h2>支出類別 × 1～12 月</h2>
          <span>依食、衣、住、行、育、樂、健康、其他分類</span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="statistics-table matrix-table category-matrix">
          <thead>
            <tr>
              <th>類別</th>
              <th v-for="month in 12" :key="month">{{ month }}月</th>
              <th>年度合計</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="group in yearlyExpenseCategoryGroups" :key="group.majorCategory">
              <tr class="major-category-row">
                <td colspan="14">{{ group.majorCategory }}</td>
              </tr>

              <tr v-for="row in group.rows" :key="row.category">
                <td class="sticky-column child-category">{{ row.category }}</td>
                <td v-for="(value, index) in row.months" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
                <td>{{ formatMoney(row.total) }}</td>
              </tr>

              <tr class="category-subtotal-row">
                <td>{{ group.majorCategory }} 小計</td>
                <td v-for="(value, index) in group.subtotal" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
                <td>{{ formatMoney(group.total) }}</td>
              </tr>
            </template>

            <tr class="monthly-subtotal-row">
              <td>每月小計</td>
              <td v-for="(value, index) in yearlyExpenseMonthlySubtotal" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
              <td>{{ formatMoney(yearlyTotal.expense) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================
                              收入類別
          ================================================= -->

    <section class="card yearly-card">
      <div class="section-title">
        <div>
          <h2>收入類別 × 1～12 月</h2>
          <span>每月收入類別分布</span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="statistics-table matrix-table">
          <thead>
            <tr>
              <th>類別</th>
              <th v-for="month in 12" :key="month">{{ month }}月</th>
              <th>年度合計</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in yearlyIncomeCategoryTable" :key="item.category">
              <td class="sticky-column">{{ item.category }}</td>
              <td v-for="(value, index) in item.months" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
              <td>{{ formatMoney(item.total) }}</td>
            </tr>

            <tr v-if="!yearlyIncomeCategoryTable.length">
              <td colspan="14" class="empty-table">沒有收入類別資料</td>
            </tr>

            <tr class="monthly-subtotal-row">
              <td>每月小計</td>
              <td v-for="(value, index) in yearlyIncomeMonthlySubtotal" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
              <td>{{ formatMoney(yearlyTotal.income) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================
                              支出帳戶
          ================================================= -->

    <section class="card yearly-card">
      <div class="section-title">
        <div>
          <h2>支出帳戶 × 1～12 月</h2>
          <span>每個支出帳戶的年度月份分布</span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="statistics-table matrix-table">
          <thead>
            <tr>
              <th>帳戶</th>
              <th v-for="month in 12" :key="month">{{ month }}月</th>
              <th>年度合計</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in yearlyExpenseAccountTable" :key="item.account">
              <td class="sticky-column">{{ item.account }}</td>
              <td v-for="(value, index) in item.months" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
              <td>{{ formatMoney(item.total) }}</td>
            </tr>

            <tr class="monthly-subtotal-row">
              <td>每月小計</td>
              <td v-for="(value, index) in yearlyExpenseAccountSubtotal" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
              <td>{{ formatMoney(yearlyTotal.expense) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- =================================================
                              收入帳戶
          ================================================= -->

    <section class="card yearly-card">
      <div class="section-title">
        <div>
          <h2>收入帳戶 × 1～12 月</h2>
          <span>每個收入帳戶的年度月份分布</span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="statistics-table matrix-table">
          <thead>
            <tr>
              <th>帳戶</th>
              <th v-for="month in 12" :key="month">{{ month }}月</th>
              <th>年度合計</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in yearlyIncomeAccountTable" :key="item.account">
              <td class="sticky-column">{{ item.account }}</td>
              <td v-for="(value, index) in item.months" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
              <td>{{ formatMoney(item.total) }}</td>
            </tr>

            <tr class="monthly-subtotal-row">
              <td>每月小計</td>
              <td v-for="(value, index) in yearlyIncomeAccountSubtotal" :key="index">{{ value ? formatMoney(value) : "—" }}</td>
              <td>{{ formatMoney(yearlyTotal.income) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
</template>
