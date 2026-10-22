// Shell strings: top bar, rail, context panel, menus, settings, update UI. Owned by the shell worker.
export const shell = {
  appName: 'AI Preschool Studio',
  skipToContent: 'Skip to content',
  demoStrip: 'Demo mode — all students and observations are fictional sample data',
  demoStripCompact: 'Demo mode · fictional sample data',
  back: 'Back',
  breadcrumb: 'Breadcrumb',
  search: {
    trigger: 'Search students or pages',
    label: 'Search',
    placeholder: 'Search students or pages…',
    students: 'Students',
    pages: 'Go to',
    noResults: 'No results for “{query}”.',
    hint: '↑ ↓ to move · Enter to open · Esc to close'
  },
  nav: {
    main: 'Main',
    dashboard: 'Home',
    students: 'Students',
    observations: 'Observations',
    reports: 'Reports',
    more: 'More'
  },
  // Top-bar context label and context-panel title per module.
  module: {
    dashboard: 'Home',
    students: 'Students',
    observations: 'Observations',
    reports: 'Reports',
    settings: 'Settings'
  },
  panel: {
    label: '{module} sidebar',
    pages: '{module} pages',
    open: 'Open sidebar',
    openTip: 'Open sidebar · Ctrl+Shift+S',
    close: 'Close sidebar',
    closeTip: 'Close sidebar · Ctrl+Shift+S',
    search: 'Search students',
    noMatch: 'No students match “{query}”.',
    overview: 'Overview',
    addObservation: 'Add observation',
    latest: 'Latest',
    reportQueue: 'Report queue · Term 4',
    studentReport: '{name} · report',
    pinned: 'Pinned',
    pinnedEmpty: 'Pin a student from their profile to keep them here.',
    recent: 'Recent',
    versionPrefix: 'Version',
    updateAvailable: 'Update available'
  },
  theme: {
    label: 'Theme',
    current: 'Theme: {name}',
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  },
  language: {
    label: 'Language',
    current: 'Language: {name}'
  },
  account: {
    label: 'Account',
    trigger: 'Account menu, {name} (demo teacher)',
    role: 'Teacher · {className}',
    demoNote: 'Demo mode: no sign-in, fictional data, AI is a Mock provider.',
    settings: 'Settings',
    signOut: 'Sign out (not available in demo)'
  },
  more: {
    settings: 'Settings',
    language: 'Language'
  },
  demo: {
    heading: 'Demo controls',
    aiDown: 'Simulate AI unavailable',
    saveFail: 'Simulate save failure',
    reset: 'Reset demo data'
  },
  update: {
    button: 'Update to v{version}',
    buttonGeneric: 'Update now',
    waitNotice: 'Save or finish your work first; the update will wait.',
    dismiss: 'Dismiss',
    bannerText: 'New version ready',
    applyingTitle: 'Updating AI Preschool Studio',
    applyingBody: 'Installing v{version}…',
    applyingBodyGeneric: 'Installing the new version…',
    errorText: 'Couldn’t check for updates.',
    applyErrorText: 'The update couldn’t be installed.',
    retry: 'Retry',
    keep: 'Keep using v{version}'
  },
  ui: {
    savedAt: 'Saved at {time}',
    saving: 'Saving…',
    unsaved: 'Unsaved changes',
    saveFailed: 'Save failed',
    retry: 'Retry',
    sourceTitle: 'Source observation {id}'
  },
  notFound: {
    title: 'Not found',
    heading: 'We couldn’t find that page',
    body: 'The student or page may not exist in this demo.',
    cta: 'Go to My Students'
  },
  settings: {
    title: 'Settings',
    sections: {
      appearance: 'Appearance',
      language: 'Language',
      about: 'About & updates',
      demo: 'Demo data'
    },
    appearance: {
      themeLegend: 'Theme',
      themeHint: 'System follows your device’s light or dark setting.',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      layoutHeading: 'Layout',
      panel: 'Show the sidebar panel on desktop',
      panelHint: 'Applies at desktop width (1200px and wider). Ctrl+Shift+S also toggles it. The AI Portfolio Studio opens with it closed for more writing space.'
    },
    language: {
      legend: 'App language',
      hint: 'Menus, buttons and labels change straight away.',
      note: 'Observation text and reports stay in the language they were written in.'
    },
    about: {
      heading: 'App information',
      appName: 'App',
      version: 'Version',
      build: 'Build',
      status: 'Update status',
      lastChecked: 'Last checked',
      neverChecked: 'Not checked yet',
      lastCheckedAt: '{date}, {time}',
      statusUnsupported: 'Update checks run in the installed production build.',
      statusUnsupportedBrowser: 'This browser doesn’t support automatic updates.',
      statusUnsupportedInsecure: 'Automatic updates need a secure (HTTPS) connection.',
      statusUnsupportedBlocked: 'Automatic updates are off because this browser blocks storage for this site.',
      statusChecking: 'Checking for updates…',
      statusCurrent: 'You have the latest version',
      statusAvailable: 'v{version} is ready',
      statusAvailableGeneric: 'A new version is ready',
      statusApplying: 'Installing v{version}…',
      statusApplyingGeneric: 'Installing the new version…',
      statusOffline: 'You’re offline. Update checks resume when you reconnect.',
      statusError: 'Couldn’t check for updates. Try again in a moment.',
      check: 'Check for updates',
      checkUnsupported: 'Not available here: this is not the installed production build.',
      checkUnsupportedBrowser: 'Not available in this browser.',
      checkUnsupportedInsecure: 'Not available over an insecure connection.',
      checkUnsupportedBlocked: 'Not available while this site’s storage is blocked.',
      checkOffline: 'Not available while offline.',
      updateNow: 'Update now',
      offlineHeading: 'Offline use',
      offline: 'Works offline: the app shell and demo data on this device. The Mock provider runs locally; nothing is sent to a server.'
    },
    demo: {
      heading: 'Simulate problems',
      intro: 'Use these to see how the app behaves when things go wrong. They only affect this browser tab.',
      aiDown: 'Simulate AI unavailable',
      aiDownHint: 'The AI Assistant shows its unavailable state.',
      saveFail: 'Simulate save failure',
      saveFailHint: 'Autosave and Save observation fail so you can try Retry.',
      resetHeading: 'Reset',
      resetHint: 'Restores the fictional students, observations and reports to their starting state.',
      reset: 'Reset demo data',
      resetDone: 'Demo data reset.',
      providerHeading: 'AI provider',
      providerNote: 'AI suggestions come from the {provider}, which runs on this device and returns canned text. There is no live AI.'
    }
  }
};
