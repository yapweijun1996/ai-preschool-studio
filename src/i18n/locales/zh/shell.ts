import type { Dict } from '../en';

// Simplified Chinese. The product name and "Mock provider" stay recognisable in English.
export const shell: Dict['shell'] = {
  appName: 'AI Preschool Studio',
  skipToContent: '跳到主要内容',
  demoStrip: '演示模式——所有学生和观察记录均为虚构的示例数据',
  demoStripCompact: '演示模式 · 虚构示例数据',
  back: '返回',
  breadcrumb: '导航路径',
  search: {
    trigger: '搜索学生或页面',
    label: '搜索',
    placeholder: '搜索学生或页面…',
    students: '学生',
    pages: '前往',
    noResults: '没有与“{query}”匹配的结果。',
    hint: '↑ ↓ 移动 · Enter 打开 · Esc 关闭'
  },
  nav: {
    main: '主导航',
    dashboard: '首页',
    students: '学生',
    observations: '观察记录',
    reports: '报告',
    more: '更多'
  },
  module: {
    dashboard: '首页',
    students: '学生',
    observations: '观察记录',
    reports: '报告',
    settings: '设置'
  },
  panel: {
    label: '{module}侧边栏',
    pages: '{module}页面',
    open: '打开侧边栏',
    openTip: '打开侧边栏 · Ctrl+Shift+S',
    close: '关闭侧边栏',
    closeTip: '关闭侧边栏 · Ctrl+Shift+S',
    search: '搜索学生',
    noMatch: '没有与“{query}”匹配的学生。',
    overview: '概览',
    addObservation: '添加观察记录',
    latest: '最新',
    reportQueue: '报告队列 · 第 4 学期',
    studentReport: '{name} · 报告',
    pinned: '已置顶',
    pinnedEmpty: '在学生档案中置顶学生，即可固定显示在这里。',
    recent: '最近查看',
    versionPrefix: '版本',
    updateAvailable: '有可用更新'
  },
  theme: {
    label: '主题',
    current: '主题：{name}',
    light: '浅色',
    dark: '深色',
    system: '跟随系统'
  },
  language: {
    label: '语言',
    current: '语言：{name}'
  },
  account: {
    label: '账户',
    trigger: '账户菜单，{name}（示范教师）',
    role: '教师 · {className}',
    demoNote: '演示模式：无需登录，数据为虚构，AI 为模拟服务（Mock provider）。',
    settings: '设置',
    signOut: '退出登录（演示中不可用）'
  },
  more: {
    settings: '设置',
    language: '语言'
  },
  demo: {
    heading: '演示控制',
    aiDown: '模拟 AI 不可用',
    saveFail: '模拟保存失败',
    reset: '重置演示数据'
  },
  update: {
    button: '更新到 v{version}',
    buttonGeneric: '立即更新',
    waitNotice: '请先保存或完成当前工作，更新会等候。',
    dismiss: '关闭',
    bannerText: '新版本已就绪',
    applyingTitle: '正在更新 AI Preschool Studio',
    applyingBody: '正在安装 v{version}…',
    applyingBodyGeneric: '正在安装新版本…',
    errorText: '无法检查更新。',
    applyErrorText: '无法安装更新。',
    retry: '重试',
    keep: '继续使用 v{version}'
  },
  ui: {
    savedAt: '已于 {time} 保存',
    saving: '正在保存…',
    unsaved: '有未保存的更改',
    saveFailed: '保存失败',
    retry: '重试',
    sourceTitle: '来源观察记录 {id}'
  },
  notFound: {
    title: '找不到页面',
    heading: '找不到该页面',
    body: '此演示中可能没有该学生或页面。',
    cta: '前往我的学生'
  },
  settings: {
    title: '设置',
    sections: {
      appearance: '外观',
      language: '语言',
      about: '关于与更新',
      demo: '演示数据'
    },
    appearance: {
      themeLegend: '主题',
      themeHint: '“跟随系统”会使用设备的浅色或深色设置。',
      light: '浅色',
      dark: '深色',
      system: '跟随系统',
      layoutHeading: '布局',
      panel: '在桌面端显示侧边栏面板',
      panelHint: '适用于桌面宽度（1200px 及以上）。也可按 Ctrl+Shift+S 切换。AI 学习档案工作室打开时会收起侧边栏，留出更多写作空间。'
    },
    language: {
      legend: '应用语言',
      hint: '菜单、按钮和标签会立即切换。',
      note: '观察记录和报告的内容会保留撰写时所用的语言。'
    },
    about: {
      heading: '应用信息',
      appName: '应用',
      version: '版本',
      build: '构建',
      status: '更新状态',
      lastChecked: '上次检查',
      neverChecked: '尚未检查',
      lastCheckedAt: '{date} {time}',
      statusUnsupported: '更新检查仅在已安装的正式版中运行。',
      statusUnsupportedBrowser: '此浏览器不支持自动更新。',
      statusUnsupportedInsecure: '自动更新需要安全的（HTTPS）连接。',
      statusUnsupportedBlocked: '此浏览器阻止了本网站的存储，因此自动更新已关闭。',
      statusChecking: '正在检查更新…',
      statusCurrent: '已是最新版本',
      statusAvailable: 'v{version} 已就绪',
      statusAvailableGeneric: '新版本已就绪',
      statusApplying: '正在安装 v{version}…',
      statusApplyingGeneric: '正在安装新版本…',
      statusOffline: '当前处于离线状态。恢复联网后会继续检查更新。',
      statusError: '无法检查更新，请稍后再试。',
      check: '检查更新',
      checkUnsupported: '此处不可用：当前不是已安装的正式版。',
      checkUnsupportedBrowser: '此浏览器中不可用。',
      checkUnsupportedInsecure: '在不安全的连接下不可用。',
      checkUnsupportedBlocked: '本网站的存储被阻止时不可用。',
      checkOffline: '离线时不可用。',
      updateNow: '立即更新',
      offlineHeading: '离线使用',
      offline: '可离线使用：本设备上的应用界面和演示数据。模拟服务（Mock provider）在本地运行，不会向服务器发送任何内容。'
    },
    demo: {
      heading: '模拟问题',
      intro: '用这些控制查看出错时应用的表现。只影响当前浏览器标签页。',
      aiDown: '模拟 AI 不可用',
      aiDownHint: 'AI 助手会显示不可用状态。',
      saveFail: '模拟保存失败',
      saveFailHint: '自动保存和“保存观察记录”会失败，方便你试用“重试”。',
      resetHeading: '重置',
      resetHint: '将虚构的学生、观察记录和报告恢复到初始状态。',
      reset: '重置演示数据',
      resetDone: '演示数据已重置。',
      providerHeading: 'AI 服务',
      providerNote: 'AI 建议来自{provider}，它在本设备上运行并返回预设文本，没有使用真实 AI。'
    }
  }
};
