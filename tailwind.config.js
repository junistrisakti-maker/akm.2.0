/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./admin-portal/index.html",
        "./admin-portal/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    900: '#1e293b',
                    950: '#0f172a',
                    1000: '#020617',
                },
                emerald: {
                    500: '#10b981',
                }
            },
            fontFamily: {
                sans: ['IBM Plex Sans', 'sans-serif'],
                mono: ['IBM Plex Mono', 'monospace'],
            },
            borderRadius: {
                'none': '0',
            }
        },
    },
    plugins: [],
}
