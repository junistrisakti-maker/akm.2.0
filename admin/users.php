<?php
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

$page_title = 'Kelola User';
$search = $_GET['search'] ?? '';

try {
    $query = "SELECT id, username, email, role, points, streak, created_at, avatar FROM users";
    $params = [];

    if ($search) {
        $query .= " WHERE username LIKE ? OR email LIKE ?";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $query .= " ORDER BY created_at DESC";
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $all_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

}
catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<main class="flex-1 lg:ml-64 p-8">
    <?php require_once __DIR__ . '/includes/navbar.php'; ?>

    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Manajemen User</h1>
            <p class="text-sm text-slate-500 font-medium mt-1">Total: <?php echo count($all_users); ?> User terdaftar</p>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 transition-all hover:shadow-md">
        <form action="" method="GET" class="flex flex-col md:flex-row gap-4">
            <div class="relative flex-1">
                <input type="text" name="search" value="<?php echo htmlspecialchars($search); ?>" 
                    placeholder="Cari username atau email jemaah..." 
                    class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            <button type="submit" class="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Cari User</button>
            <?php if ($search): ?>
                <a href="users.php" class="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all text-center">Reset</a>
            <?php
endif; ?>
        </form>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                        <th class="px-8 py-5">User</th>
                        <th class="px-8 py-5">Role</th>
                        <th class="px-8 py-5 text-center">Stats</th>
                        <th class="px-8 py-5">Joined</th>
                        <th class="px-8 py-5 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <?php if (empty($all_users)): ?>
                        <tr>
                            <td colspan="5" class="px-8 py-10 text-center text-slate-400 font-medium italic">Waduh, usernya gak ketemu...</td>
                        </tr>
                    <?php
else: ?>
                        <?php foreach ($all_users as $user): ?>
                        <tr class="hover:bg-slate-50/50 transition-all duration-200 group">
                            <td class="px-8 py-5">
                                <div class="flex items-center gap-4">
                                    <img src="<?php echo $user['avatar'] ?: 'https://ui-avatars.com/api/?name=' . $user['username'] . '&background=random'; ?>" class="w-10 h-10 rounded-2xl object-cover bg-slate-100 border border-slate-200">
                                    <div>
                                        <span class="font-bold text-slate-900 text-sm tracking-tight block group-hover:text-emerald-600 transition-colors"><?php echo htmlspecialchars($user['username']); ?></span>
                                        <span class="text-[10px] text-slate-400 font-bold tracking-tight"><?php echo htmlspecialchars($user['email']); ?></span>
                                    </div>
                                </div>
                            </td>
                            <td class="px-8 py-5">
                                <?php if ($user['role'] === 'admin'): ?>
                                    <span class="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-purple-100 shadow-sm shadow-purple-100">Admin</span>
                                <?php
        else: ?>
                                    <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100 shadow-sm shadow-blue-100 italic">Jemaah</span>
                                <?php
        endif; ?>
                            </td>
                            <td class="px-8 py-5">
                                <div class="flex items-center justify-center gap-3">
                                    <div class="text-center">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Points</p>
                                        <p class="text-xs font-bold text-slate-700"><?php echo number_format($user['points']); ?></p>
                                    </div>
                                    <div class="w-px h-6 bg-slate-100"></div>
                                    <div class="text-center">
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Streak</p>
                                        <p class="text-xs font-bold text-orange-500">🔥 <?php echo $user['streak']; ?></p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-8 py-5">
                                <span class="text-slate-500 text-xs font-medium"><?php echo date('d M Y', strtotime($user['created_at'])); ?></span>
                            </td>
                            <td class="px-8 py-5 text-right">
                                <div class="flex items-center justify-end gap-2 text-slate-300">
                                    <button class="p-2 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-100 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button class="p-2 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <?php
    endforeach; ?>
                    <?php
endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
