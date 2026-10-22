import type { Dict } from '../en';

// Bahasa Melayu (Malaysia). The product name and "Mock provider" stay recognisable in English.
export const shell: Dict['shell'] = {
  appName: 'AI Preschool Studio',
  skipToContent: 'Langkau ke kandungan',
  demoStrip: 'Mod demo — semua murid dan pemerhatian ialah data contoh rekaan',
  demoStripCompact: 'Mod demo · data contoh rekaan',
  back: 'Kembali',
  nav: {
    main: 'Navigasi utama',
    dashboard: 'Papan pemuka',
    students: 'Murid',
    observations: 'Pemerhatian',
    reports: 'Laporan',
    more: 'Lagi'
  },
  module: {
    dashboard: 'Utama',
    students: 'Murid',
    observations: 'Pemerhatian',
    reports: 'Laporan',
    settings: 'Tetapan'
  },
  panel: {
    label: 'Bar sisi {module}',
    pages: 'Halaman {module}',
    open: 'Buka bar sisi',
    openTip: 'Buka bar sisi · Ctrl+Shift+S',
    close: 'Tutup bar sisi',
    closeTip: 'Tutup bar sisi · Ctrl+Shift+S',
    search: 'Cari murid',
    noMatch: 'Tiada murid yang sepadan dengan “{query}”.',
    overview: 'Gambaran keseluruhan',
    addObservation: 'Tambah pemerhatian',
    latest: 'Terkini',
    reportQueue: 'Baris gilir laporan · Penggal 4',
    studentReport: '{name} · laporan',
    pinned: 'Disemat',
    pinnedEmpty: 'Semat murid dari profilnya untuk menyimpannya di sini.',
    recent: 'Terkini dibuka',
    versionPrefix: 'Versi',
    updateAvailable: 'Kemas kini tersedia'
  },
  theme: {
    label: 'Tema',
    current: 'Tema: {name}',
    light: 'Cerah',
    dark: 'Gelap',
    system: 'Ikut sistem'
  },
  language: {
    label: 'Bahasa',
    current: 'Bahasa: {name}'
  },
  account: {
    label: 'Akaun',
    trigger: 'Menu akaun, {name} (guru demo)',
    role: 'Guru · {className}',
    demoNote: 'Mod demo: tiada log masuk, data rekaan, AI ialah penyedia simulasi (Mock provider).',
    settings: 'Tetapan',
    signOut: 'Log keluar (tidak tersedia dalam demo)'
  },
  more: {
    settings: 'Tetapan',
    language: 'Bahasa'
  },
  demo: {
    heading: 'Kawalan demo',
    aiDown: 'Simulasi AI tidak tersedia',
    saveFail: 'Simulasi simpanan gagal',
    reset: 'Set semula data demo'
  },
  update: {
    button: 'Kemas kini ke v{version}',
    waitNotice: 'Simpan atau selesaikan kerja anda dahulu; kemas kini akan menunggu.',
    dismiss: 'Tutup',
    bannerText: 'Versi baharu sedia',
    applyingTitle: 'Mengemas kini AI Preschool Studio',
    applyingBody: 'Memasang v{version}…',
    errorText: 'Tidak dapat menyemak kemas kini.',
    retry: 'Cuba lagi',
    keep: 'Terus guna v{version}'
  },
  ui: {
    savedAt: 'Disimpan pada {time}',
    saving: 'Menyimpan…',
    unsaved: 'Perubahan belum disimpan',
    saveFailed: 'Simpanan gagal',
    retry: 'Cuba lagi',
    sourceTitle: 'Pemerhatian sumber {id}'
  },
  notFound: {
    title: 'Tidak ditemui',
    heading: 'Kami tidak menemui halaman itu',
    body: 'Murid atau halaman itu mungkin tiada dalam demo ini.',
    cta: 'Pergi ke Murid Saya'
  },
  settings: {
    title: 'Tetapan',
    sections: {
      appearance: 'Paparan',
      language: 'Bahasa',
      about: 'Perihal & kemas kini',
      demo: 'Data demo'
    },
    appearance: {
      themeLegend: 'Tema',
      themeHint: 'Ikut sistem menggunakan tetapan cerah atau gelap peranti anda.',
      light: 'Cerah',
      dark: 'Gelap',
      system: 'Ikut sistem',
      layoutHeading: 'Susun atur',
      panel: 'Tunjukkan panel bar sisi pada desktop',
      panelHint: 'Digunakan pada lebar desktop (1200px dan ke atas). Ctrl+Shift+S juga menogolnya.'
    },
    language: {
      legend: 'Bahasa aplikasi',
      hint: 'Menu, butang dan label bertukar serta-merta.',
      note: 'Teks pemerhatian dan laporan kekal dalam bahasa asal ia ditulis.'
    },
    about: {
      heading: 'Maklumat aplikasi',
      appName: 'Aplikasi',
      version: 'Versi',
      build: 'Binaan',
      status: 'Status kemas kini',
      lastChecked: 'Kali terakhir disemak',
      neverChecked: 'Belum disemak',
      lastCheckedAt: '{date}, {time}',
      statusUnsupported: 'Semakan kemas kini berjalan dalam binaan produksi yang dipasang.',
      statusChecking: 'Menyemak kemas kini…',
      statusCurrent: 'Anda menggunakan versi terkini',
      statusAvailable: 'v{version} sedia',
      statusApplying: 'Memasang v{version}…',
      statusOffline: 'Anda di luar talian. Semakan kemas kini disambung semula apabila anda bersambung.',
      statusError: 'Tidak dapat menyemak kemas kini. Cuba lagi sebentar nanti.',
      check: 'Semak kemas kini',
      checkUnsupported: 'Tidak tersedia di sini: ini bukan binaan produksi yang dipasang.',
      checkOffline: 'Tidak tersedia semasa di luar talian.',
      updateNow: 'Kemas kini sekarang',
      offlineHeading: 'Penggunaan luar talian',
      offline: 'Berfungsi di luar talian: rangka aplikasi dan data demo pada peranti ini. Penyedia simulasi (Mock provider) berjalan secara setempat; tiada apa-apa dihantar ke pelayan.'
    },
    demo: {
      heading: 'Simulasi masalah',
      intro: 'Gunakan kawalan ini untuk melihat cara aplikasi bertindak apabila berlaku masalah. Ia hanya menjejaskan tab pelayar ini.',
      aiDown: 'Simulasi AI tidak tersedia',
      aiDownHint: 'Pembantu AI menunjukkan keadaan tidak tersedia.',
      saveFail: 'Simulasi simpanan gagal',
      saveFailHint: 'Simpan automatik dan Simpan pemerhatian akan gagal supaya anda boleh mencuba Cuba lagi.',
      resetHeading: 'Set semula',
      resetHint: 'Memulihkan murid, pemerhatian dan laporan rekaan kepada keadaan asal.',
      reset: 'Set semula data demo',
      resetDone: 'Data demo telah diset semula.',
      providerHeading: 'Penyedia AI',
      providerNote: 'Cadangan AI datang daripada {provider}, yang berjalan pada peranti ini dan memulangkan teks sedia ada. Tiada AI sebenar digunakan.'
    }
  }
};
