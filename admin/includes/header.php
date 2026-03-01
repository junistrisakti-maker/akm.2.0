<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title ?? 'Admin Dashboard'; ?> - AyoKeMasjid</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            letter-spacing: -0.01em;
        }
        .sidebar-active {
            background-color: #ecfdf5; 
            color: #059669;
            border-left: 4px solid #059669;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 flex min-h-screen">
