<script setup>
  import { inject } from 'vue';

  const accounting = inject('accounting');

  const {
    records,
    loading,
    error,
    activePage,
    viewType,
    currentDate,
    selectedDate,

    categoryChartEl,
    rankingChartEl,

    weekNames,

    currentYear,
    currentMonth,
    monthTitle,

    currentRecords,
    totalAmount,

    calendarDays,
    todayText,

    selectedDateRecords,
    selectedDateTotal,
    selectedDateText,

    availableCategories,
    availableAccounts,

    searchKeyword,
    filterCategory,
    filterAccount,
    sortType,

    showAllRecords,
    filteredRecords,
    displayedRecords,

    monthlyTop10,
    monthlyTop10Days,

    formatMoney,

    selectCalendarDate,

    previousMonth,
    nextMonth,
    goToday,

    changeType,
    clearFilters,
  } = accounting;

</script>

<template>
  <template v-if="activePage === 'monthly'">
    <!-- =====================================================
                            月份控制
    ====================================================== -->

    <section class="toolbar card">
      <div class="month-control">
        <button @click="previousMonth">‹</button>
        <strong>{{ monthTitle }}</strong>
        <button @click="nextMonth">›</button>
        <button class="today-btn" @click="goToday">今天</button>
      </div>

      <div class="type-switch">
        <button
          :class="{
            active: viewType === '支出',
          }"
          @click="changeType('支出')">
          支出
        </button>
        <button
          :class="{
            active: viewType === '收入',
          }"
          @click="changeType('收入')">
          收入
        </button>
      </div>
    </section>

    <!-- =====================================================
                            Summary
    ====================================================== -->

    <section class="summary-grid">
      <div class="summary-card card">
        <span>{{ viewType === '支出' ? '本月支出' : '本月收入' }}</span>
        <strong>{{ formatMoney(totalAmount) }}</strong>
      </div>

      <div class="summary-card card">
        <span>紀錄筆數</span>
        <strong>{{ currentRecords.length }}</strong>
      </div>

      <div class="summary-card card">
        <span>平均每筆</span>
        <strong>{{ formatMoney(currentRecords.length ? totalAmount / currentRecords.length : 0) }}</strong>
      </div>
    </section>

    <!-- =====================================================
                        月曆 + 當日明細
    ====================================================== -->

    <section class="calendar-detail-grid">
      <!-- 月曆 -->
      <div class="card calendar-card">
        <div class="section-title">
          <div>
            <h2>月曆</h2>
            <span>點擊日期查看完整明細</span>
          </div>
        </div>

        <div class="calendar">
          <div v-for="week in weekNames" :key="week" class="weekday">{{ week }}</div>

          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-cell"
            :class="{
              empty: !day,
              today: day?.dateString === todayText,
              selected: day?.dateString === selectedDate,
            }"
            @click="selectCalendarDate(day)">
            <template v-if="day">
              <div class="day-number">{{ day.date }}</div>
              <div v-if="day.total" class="day-total">{{ formatMoney(day.total) }}</div>

              <div v-for="record in day.records.slice(0, 2)" :key="record.id" class="day-item">
                {{ record.category || '未分類' }}
                <span>{{ formatMoney(record.amount) }}</span>
              </div>

              <div v-if="day.records.length > 2" class="more">+{{ day.records.length - 2 }} 筆</div>
            </template>
          </div>
        </div>
      </div>

      <!-- =================================================
                    當日明細
                    CSS 會讓這張卡 sticky
      ================================================== -->

      <div class="card selected-day-card">
        <div class="section-title">
          <div>
            <h2>{{ selectedDate ? selectedDateText : '當日明細' }}</h2>
            <span v-if="selectedDate">{{ selectedDateRecords.length }} 筆 {{ viewType }} · {{ formatMoney(selectedDateTotal) }}</span>
            <span v-else>點擊左側日期</span>
          </div>
        </div>

        <div v-if="!selectedDate" class="empty-records">
          <div class="empty-day-icon">📅</div>
          點擊月曆上的日期，顯示當天所有紀錄。
        </div>

        <div v-else-if="!selectedDateRecords.length" class="empty-records">當天沒有 {{ viewType }} 紀錄</div>

        <div v-else class="selected-day-list">
          <div v-for="record in selectedDateRecords" :key="record.id" class="selected-day-row">
            <div class="selected-day-category">{{ record.category || '未分類' }}</div>

            <div class="selected-day-main">
              <strong>{{ viewType === '支出' ? record.expenseDetail || '—' : record.incomeDetail || '—' }}</strong>
              <span>
                {{ viewType === '支出' ? record.expenseAccount || '—' : record.incomeAccount || '—' }}
                <template v-if="record.note">· {{ record.note }}</template>
              </span>
            </div>

            <div class="selected-day-amount">{{ formatMoney(record.amount) }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================
                              圖表
    ====================================================== -->

    <section class="chart-grid">
      <div class="card chart-card">
        <div class="section-title">
          <div>
            <h2>類別比例</h2>
            <span>{{ viewType }}分類</span>
          </div>
        </div>
        <div ref="categoryChartEl" class="chart"></div>
      </div>

      <div class="card chart-card">
        <div class="section-title">
          <div>
            <h2>類別排行</h2>
            <span>金額由高到低</span>
          </div>
        </div>
        <div ref="rankingChartEl" class="chart"></div>
      </div>
    </section>

    <!-- =====================================================
                        支出 / 收入明細
    ====================================================== -->

    <section class="card records-card">
      <div class="section-title">
        <div>
          <h2>{{ viewType }}明細</h2>
          <span>顯示 {{ displayedRecords.length }} / {{ filteredRecords.length }} 筆</span>
        </div>
      </div>

      <!-- 篩選 -->
      <div class="filter-panel">
        <input v-model="searchKeyword" class="filter-input" type="text" placeholder="搜尋明細、備註、帳戶..." />

        <select v-model="filterCategory" class="filter-select">
          <option value="">全部類別</option>
          <option v-for="category in availableCategories" :key="category" :value="category">{{ category }}</option>
        </select>

        <select v-model="filterAccount" class="filter-select">
          <option value="">全部帳戶</option>
          <option v-for="account in availableAccounts" :key="account" :value="account">{{ account }}</option>
        </select>

        <select v-model="sortType" class="filter-select">
          <option value="date-desc">日期：新到舊</option>
          <option value="date-asc">日期：舊到新</option>
          <option value="amount-desc">金額：高到低</option>
          <option value="amount-asc">金額：低到高</option>
        </select>

        <button class="clear-filter-btn" @click="clearFilters">清除</button>
      </div>

      <!-- 沒資料 -->
      <div v-if="!displayedRecords.length" class="empty-records">沒有符合條件的紀錄</div>

      <!-- 明細 -->
      <div v-else class="record-list">
        <div v-for="record in displayedRecords" :key="record.id" class="record-row">
          <div class="record-date">{{ record.date }}</div>
          <div class="record-main">
            <strong>{{ record.category || '未分類' }}</strong>
            <span>{{ viewType === '支出' ? record.expenseDetail : record.incomeDetail }}</span>
          </div>

          <div class="record-account">{{ viewType === '支出' ? record.expenseAccount : record.incomeAccount }}</div>
          <div class="record-amount">{{ formatMoney(record.amount) }}</div>
        </div>
      </div>

      <!-- =================================================
                      顯示全部 / 收起
      ================================================== -->

      <div v-if="filteredRecords.length > 10" class="record-more-control">
        <button type="button" @click="showAllRecords = !showAllRecords">{{ showAllRecords ? '收起，只顯示前 10 筆' : `顯示全部 ${filteredRecords.length} 筆` }}</button>
      </div>
    </section>

    <!-- =====================================================
                      TOP 10 + TOP 10 天
    ====================================================== -->

    <section class="monthly-ranking-grid">
      <!-- =================================================
                          TOP 10
      ================================================== -->

      <section class="card records-card">
        <div class="section-title">
          <div>
            <h2>此月 TOP 10 {{ viewType === '支出' ? '支出' : '收入' }}</h2>
            <span>金額最高的 12 筆實際{{ viewType === '支出' ? '支出' : '收入' }}紀錄</span>
          </div>
        </div>

        <div v-if="!monthlyTop10.length" class="empty-records">這個月份沒有{{ viewType === '支出' ? '支出' : '收入' }}紀錄</div>

        <div v-else class="record-list">
          <div v-for="(record, index) in monthlyTop10" :key="record.id" class="record-row top-record-row">
            <div class="top-rank">{{ index + 1 }}</div>
            <div class="record-date">{{ record.date }}</div>
            <div class="record-main">
              <strong>{{ record.category || '未分類' }}</strong>
              <span>{{ viewType === '支出' ? record.expenseDetail : (record.incomeDetail || '-') }}</span>
            </div>

            <div class="record-amount">{{ formatMoney(record.amount) }}</div>
          </div>
        </div>
      </section>

      <!-- =================================================
                          TOP 10 天
      ================================================== -->

      <section class="card records-card">
        <div class="section-title">
          <div>
            <h2>此月 TOP 10 天{{ viewType === '支出' ? '支出' : '收入' }}</h2>
            <span>依每日{{ viewType === '支出' ? '支出' : '收入' }}總額由高到低排序</span>
          </div>
        </div>

        <div v-if="!monthlyTop10Days.length" class="empty-records">這個月份沒有{{ viewType === '支出' ? '支出' : '收入' }}紀錄</div>

        <div v-else class="record-list">
          <div v-for="(day, index) in monthlyTop10Days" :key="day.date" class="record-row top-record-row">
            <div class="top-rank">{{ index + 1 }}</div>
            <div class="record-date">{{ day.date }}</div>
            <div class="record-main">
              <span>{{ day.count }} 筆</span>
              <!-- <span>當日總支出</span> -->
            </div>
            <div class="record-amount">{{ formatMoney(day.total) }}</div>
          </div>
        </div>
      </section>

    </section>
  </template>
</template>
