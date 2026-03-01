<!-- Sidebar -->
<aside class="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 hidden lg:flex flex-col z-50">
    <!-- Brand -->
    <div class="p-8 border-b border-slate-50">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            </div>
            <div>
                <h1 class="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">AKM Core</h1>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Admin Suite</p>
            </div>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-6 space-y-2 overflow-y-auto">
        <p class="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Utama</p>
        
        <a href="dashboard.php" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all font-bold text-sm tracking-tight <?php echo basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'bg-emerald-50 text-emerald-600' : ''; ?>">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
        </a>

        <a href="masjid.php" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all font-bold text-sm tracking-tight <?php echo basename($_SERVER['PHP_SELF']) == 'masjid.php' ? 'bg-emerald-50 text-emerald-600' : ''; ?>">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Data Masjid
        </a>

        <a href="donations.php" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all font-bold text-sm tracking-tight <?php echo basename($_SERVER['PHP_SELF']) == 'donations.php' ? 'bg-emerald-50 text-emerald-600' : ''; ?>">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Donasi
        </a>

        <a href="backsounds.php" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all font-bold text-sm tracking-tight <?php echo basename($_SERVER['PHP_SELF']) == 'backsounds.php' ? 'bg-emerald-50 text-emerald-600' : ''; ?>">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Vibes Music
        </a>

        <div class="pt-6">
            <p class="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Moderasi</p>
            <a href="moderasi.php" class="flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all font-bold text-sm tracking-tight <?php echo basename($_SERVER['PHP_SELF']) == 'moderasi.php' ? 'bg-emerald-50 text-emerald-600' : ''; ?>">
                <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    UGC Content
                </div>
                <span class="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-lg">3</span>
            </a>
        </div>
    </nav>

    <!-- App Info -->
    <div class="p-6">
        <div class="bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versi Sistem</p>
            <p class="text-sm font-bold text-slate-900">v2.0.0-beta</p>
            <div class="mt-4 flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Sistem Online</span>
            </div>
        </div>
    </div>
</aside>
