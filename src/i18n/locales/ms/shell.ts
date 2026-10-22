import type { Dict } from '../en';

// Bahasa Melayu (Malaysia). The product name and "Mock provider" stay recognisable in English.
export const shell: Dict['shell'] = {
  appName: 'AI Preschool Studio',
  skipToContent: 'Langkau ke kandungan',
  demoStrip: 'Mod demo — semua murid dan pemerhatian ialah data contoh rekaan',
  demoStripCompact: 'Mod demo · data contoh rekaan',
  roles: { heading: 'Peranan demo', teacher: 'Guru', reviewer: 'Penyemak / Pengetua', admin: 'Pentadbir sekolah', parent: 'Ibu bapa', viewingAs: 'Melihat sebagai: {role} (peranan demo — bukan kawalan akses)', plannedTitle: 'Paparan {role} dirancang', planned: 'Paparan peranan dirancang', plannedModules: 'Modul yang dirancang', parentPurpose: 'Pengalaman keluarga akan membolehkan penjaga melihat laporan yang diterbitkan, menerima notis, mengurus persetujuan dan melengkapkan pengisytiharan pagi.', adminPurpose: 'Pentadbir sekolah akan mengurus sekolah dan akaun, aliran kerja privasi dan penyimpanan, insiden serta laporan pengetua.', returnTeacher: 'Kembali kepada Guru', familyModules: 'Portal Keluarga — Fasa 3', noticesModule: 'Notis — Fasa 3', schoolsModule: 'Sekolah & Akaun — Fasa 4', privacyModule: 'Pusat Privasi — Fasa 4', retentionModule: 'Penyimpanan Rekod — Fasa 4', incidentsModule: 'Insiden & Peristiwa yang Perlu Dilaporkan — Fasa 4', principalReportsModule: 'Laporan Pengetua — Fasa 4' , studioReadOnly: 'Akses penyemak adalah baca sahaja. Hanya guru boleh mengedit draf ini.', onlyReviewer: 'Hanya penyemak boleh meluluskan atau meminta perubahan.', switchReviewer: 'Tukar kepada penyemak (demo)' , observationBlocked: 'Hanya guru boleh menambah pemerhatian dalam demo ini.', switchTeacher: 'Tukar kepada guru (demo)' },
  back: 'Kembali',
  breadcrumb: 'Laluan navigasi',
  search: {
    trigger: 'Cari murid atau halaman',
    label: 'Carian',
    placeholder: 'Cari murid atau halaman…',
    students: 'Murid',
    pages: 'Pergi ke',
    noResults: 'Tiada hasil untuk “{query}”.',
    hint: '↑ ↓ untuk bergerak · Enter untuk buka · Esc untuk tutup'
  },
  nav: {
    main: 'Navigasi utama',
    dashboard: 'Utama',
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
    designReference: 'Rujukan reka bentuk',
    addObservation: 'Tambah pemerhatian',
    latest: 'Terkini',
    reportQueue: 'Baris gilir laporan · {term}',
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
    buttonGeneric: 'Kemas kini sekarang',
    waitNotice: 'Simpan atau selesaikan kerja anda dahulu; kemas kini akan menunggu.',
    dismiss: 'Tutup',
    bannerText: 'Versi baharu sedia',
    applyingTitle: 'Mengemas kini AI Preschool Studio',
    applyingBody: 'Memasang v{version}…',
    applyingBodyGeneric: 'Memasang versi baharu…',
    errorText: 'Tidak dapat menyemak kemas kini.',
    applyErrorText: 'Kemas kini tidak dapat dipasang.',
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
      framework: 'Rangka kerja pembelajaran',
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
      panelHint: 'Digunakan pada lebar desktop (1200px dan ke atas). Ctrl+Shift+S juga menogolnya. Studio Portfolio AI dibuka dengan panel ini ditutup untuk ruang menulis yang lebih luas.'
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
      statusUnsupportedBrowser: 'Pelayar ini tidak menyokong kemas kini automatik.',
      statusUnsupportedInsecure: 'Kemas kini automatik memerlukan sambungan selamat (HTTPS).',
      statusUnsupportedBlocked: 'Kemas kini automatik dimatikan kerana pelayar ini menyekat storan untuk laman ini.',
      statusChecking: 'Menyemak kemas kini…',
      statusCurrent: 'Anda menggunakan versi terkini',
      statusAvailable: 'v{version} sedia',
      statusAvailableGeneric: 'Versi baharu sedia',
      statusApplying: 'Memasang v{version}…',
      statusApplyingGeneric: 'Memasang versi baharu…',
      statusOffline: 'Anda di luar talian. Semakan kemas kini disambung semula apabila anda bersambung.',
      statusError: 'Tidak dapat menyemak kemas kini. Cuba lagi sebentar nanti.',
      check: 'Semak kemas kini',
      checkUnsupported: 'Tidak tersedia di sini: ini bukan binaan produksi yang dipasang.',
      checkUnsupportedBrowser: 'Tidak tersedia dalam pelayar ini.',
      checkUnsupportedInsecure: 'Tidak tersedia melalui sambungan yang tidak selamat.',
      checkUnsupportedBlocked: 'Tidak tersedia semasa storan laman ini disekat.',
      checkOffline: 'Tidak tersedia semasa di luar talian.',
      updateNow: 'Kemas kini sekarang',
      offlineHeading: 'Penggunaan luar talian',
      offline: 'Berfungsi di luar talian: rangka aplikasi dan data demo pada peranti ini. Penyedia simulasi (Mock provider) berjalan secara setempat; tiada apa-apa dihantar ke pelayan.'
    },
    framework: {
      version: 'Versi {version}',
      basis: 'Bidang pembelajaran, skala pencapaian dan tempoh laporan yang digunakan oleh setiap halaman. Bidang dipetakan kepada Rangka Kerja Nurturing Early Learners (NEL) 2022.',
      readOnly: 'Baca sahaja dalam demo ini. Dalam Studio Platform, pentadbir sekolah menyelenggarakannya; laporan yang diluluskan mengekalkan versi rangka kerja semasa ia diluluskan.',
      areas: 'Bidang pembelajaran',
      mappingNote: 'Pemetaan NEL ialah andaian demo yang perlu disahkan dengan dokumen NEL. Bahasa Cina diletakkan di bawah Bahasa dan Literasi di sini, tetapi Bahasa Ibunda mungkin mengikut rangka kerja sendiri; Sosio-Emosi dipetakan kepada kecekapan teras, bukan bidang pembelajaran.',
      scale: 'Skala pencapaian',
      scaleNote: 'Huraian pembelajaran yang diperhatikan, dipaparkan sebagai perkataan dan titik. Bukan markah, peratusan atau kedudukan.',
      periods: 'Tempoh laporan'
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
