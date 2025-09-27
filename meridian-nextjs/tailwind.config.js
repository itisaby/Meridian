/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Meridian Navigation Color Palette
                primary: {
                    50: '#fef2f8',
                    100: '#fce7f3',
                    200: '#fbcfe8',
                    300: '#f9a8d4',
                    400: '#f472b6',
                    500: '#ec4899', // Main brand pink
                    600: '#db2777',
                    700: '#be185d',
                    800: '#9d174d',
                    900: '#831843',
                },
                cyber: {
                    50: '#f8faff',
                    100: '#f1f5ff',
                    200: '#e4ecff',
                    300: '#d1deff',
                    400: '#aac4ff',
                    500: '#7c3aed', // Electric purple
                    600: '#6d28d9',
                    700: '#5b21b6',
                    800: '#4c1d95',
                    900: '#3c1677',
                },
                dark: {
                    50: '#1a1a2e',
                    100: '#16213e',
                    200: '#0f0015', // Deep space black
                    300: '#16213e',
                    400: '#1a1a2e',
                    500: '#0f0015',
                    600: '#000000',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'cyber-gradient': 'linear-gradient(135deg, #ff006e 0%, #7c3aed 50%, #0f0015 100%)',
            },
            animation: {
                'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 3s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px #ff006e, 0 0 10px #ff006e, 0 0 15px #ff006e' },
                    '100%': { boxShadow: '0 0 10px #7c3aed, 0 0 20px #7c3aed, 0 0 30px #7c3aed' },
                }
            },
        },
    },
    plugins: [],
}
