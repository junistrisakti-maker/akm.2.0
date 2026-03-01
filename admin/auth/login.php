<?php

require_once __DIR__ . '/../../api/config.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - AyoKeMasjid</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
        <div class="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10">
            <div class="text-center mb-10">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-3xl text-emerald-600 mb-6 border border-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Admin Portal</h1>
                <p class="text-slate-500 mt-3 font-medium">Masuk untuk mengelola ekosistem digital masjid</p>
            </div>

            
            <?php if (isset($_SESSION['error'])): ?>
                <div class="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-semibold border border-red-100 flex items-center gap-3 animate-head-shake">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <?php echo $_SESSION['error'];
    unset($_SESSION['error']); ?>
                </div>
            <?php
endif; ?>

            <form action="proses-login.php" method="POST" class="space-y-6">
                <div class="space-y-2">
                    <label for="username" class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username / Email</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <input type="text" id="username" name="username" required 
                            class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-semibold text-slate-700 placeholder:text-slate-300"
                            placeholder="Masukkan identitas anda">
                    </div>
                </div>

                <div class="space-y-2">
                    <label for="password" class="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input type="password" id="password" name="password" required 
                            class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-semibold text-slate-700 placeholder:text-slate-300"
                            placeholder="••••••••">
                    </div>
                </div>

                <div class="pt-4">
                    <button type="submit" 
                        class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                        Masuk Sekarang
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
        
        <div class="mt-10 flex flex-col items-center gap-4">
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Secure Core V2.0 &bull; AyoKeMasjid
            </p>
            <div class="flex gap-4 text-slate-300">
                <a href="#" class="hover:text-emerald-500 transition-colors">Bantuan</a>
                <span>&bull;</span>
                <a href="#" class="hover:text-emerald-500 transition-colors">Kebijakan</a>
            </div>
        </div>
    </div>
</body>
</html>
