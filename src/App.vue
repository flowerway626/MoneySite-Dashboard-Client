<script setup>
  import { ref, provide } from 'vue';
  import { useAccounting } from './composables/useAccounting';
  import MonthlyView from './views/MonthlyView.vue';
  import YearlyView from './views/YearlyView.vue';

  const accounting = useAccounting();
  provide('accounting', accounting);

  const { activePage, loading, yearlyLoading, error, showMonthlyPage, showYearlyPage, refreshCurrentPage, showBackToTop, scrollToTop } = accounting;
  const sidebarCollapsed = ref(false);
</script>

<template>
  <div class="app">
    <header class="header">
      <div>
        <div class="eyebrow">ACCOUNTING DASHBOARD</div>
        <h1>我的記帳</h1>
        <p>Google Sheets × Vue × Node.js</p>
      </div>

      <button class="refresh-btn" :disabled="loading || yearlyLoading" @click="refreshCurrentPage">{{ loading || yearlyLoading ? '讀取中…' : '重新整理' }}</button>
    </header>

    <div class="layout">
      <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-title">
          <span v-if="!sidebarCollapsed">功能</span>
        </div>

        <button
          class="nav-item"
          :class="{ active: activePage === 'monthly' }"
          title="月度儀表板"
          @click="showMonthlyPage"
        >
          <span class="nav-icon">📅</span>
          <span v-if="!sidebarCollapsed" class="nav-text">月度儀表板</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: activePage === 'yearly' }"
          title="年度統計"
          @click="showYearlyPage"
        >
          <span class="nav-icon">📊</span>
          <span v-if="!sidebarCollapsed" class="nav-text">年度統計</span>
        </button>

        <button
          class="sidebar-toggle"
          :title="sidebarCollapsed ? '展開功能列' : '收合功能列'"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <span>{{ sidebarCollapsed ? '›' : '‹' }}</span>
          <span v-if="!sidebarCollapsed">收合</span>
        </button>
      </aside>

      <main class="container">
        <div v-if="error" class="error">
          {{ error }}
          <div class="error-hint">請確認 Node.js 已啟動、Google Sheet ID 正確，且 Service Account 已取得試算表檢視權限。</div>
        </div>

        <MonthlyView v-if="activePage === 'monthly'" />
        <YearlyView v-else />
      </main>
    </div>

    <button v-show="showBackToTop" class="back-to-top" title="回到頂端" @click="scrollToTop">↑</button>
  </div>
</template>
