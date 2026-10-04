<script setup>
  import { ref, provide } from 'vue';
  import { useAccounting } from './composables/useAccounting';
  import MonthlyView from './views/MonthlyView.vue';
  import YearlyView from './views/YearlyView.vue';

  const accounting = useAccounting();
  provide('accounting', accounting);

  const { checkingAuth, loginPassword, isAuthenticated, loginError, logout, activePage, loading, yearlyLoading, error, login, showMonthlyPage, showYearlyPage, refreshCurrentPage, showBackToTop, scrollToTop } = accounting;
  
  const sidebarCollapsed = ref(false);
  async function handleLogin() {
    const success = await login();

    if (!success) return;

    await loadCategories();
    await loadMonthlyRecords();
  }
</script>

<template>
  <div class="app">
    <div v-if="checkingAuth">
      載入中...
    </div>

    <div>{{ isAuthenticated }}</div>
    <div v-if="!isAuthenticated" class="login-page">
      <div class="login-box">
        <h1>記帳儀表板</h1>

        <input v-model="loginPassword" type="password" placeholder="芝麻開門" @keyup.enter="login" />
        <button @click="handleLogin">登入</button>

        <div v-if="loginError">{{ loginError }}</div>
      </div>
    </div>

    <template v-else>
  <!-- 原本的 Dashboard -->
  <header class="header">
    <div>
      <div class="eyebrow">ACCOUNTING DASHBOARD</div>
      <h1>我的記帳</h1>
      <p>Google Sheets × Vue × Node.js</p>
    </div>
    <div style="text-align: right;">
      <button class="refresh-btn" :disabled="loading || yearlyLoading" @click="refreshCurrentPage">{{ loading || yearlyLoading ? '讀取中…' : '重新整理' }}</button>
      <button class="logout-btn" @click="logout">登出</button>
    </div>
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
    </template>
  </div>
</template>
