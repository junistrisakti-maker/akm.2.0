<?php
$today = date('l, d F Y');
?>
<!-- Top Navbar -->
<header class="flex items-center justify-between mb-8">
    <div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight"><?php echo $page_title ?? 'Dashboard'; ?></h2>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1"><?php echo $today; ?></p>
    </div>

    <div class="flex items-center gap-6">
        <!-- Search Bar (Fake) -->
        <div class="hidden md:flex items-center bg-white border border-slate-100 rounded-2xl px-4 py-2.5 w-64 shadow-sm focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:border-emerald-500 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Cari data..." class="bg-transparent border-none outline-none ml-3 text-sm font-medium w-full placeholder:text-slate-300">
        </div>

        <div class="h-10 w-px bg-slate-100"></div>

        <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
                <p class="text-xs font-black text-slate-900 leading-none"><?php echo $_SESSION['admin_username'] ?? 'Administrator'; ?></p>
                <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Super Admin</p>
            </div>
            <div class="relative group">
                <button class="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 font-black text-sm shadow-lg shadow-emerald-50 group-hover:scale-105 transition-transform">
                    <?php echo strtoupper(substr($_SESSION['admin_username'] ?? 'A', 0, 1)); ?>
                </button>
                
                <!-- Dropdown (CSS Only simple) -->
                <div class="absolute right-0 mt-3 w-48 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <a href="profile.php" class="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all font-bold text-xs tracking-tight">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil Saya
                    </a>
                    <a href="auth/logout.php" class="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-100 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-xs tracking-tight">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Keluar Sistem
                    </a>
                </div>
            </div>
        </div>
    </div>
</header>
