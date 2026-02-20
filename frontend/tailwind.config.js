/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                "primary": "#ea2a33",
                "background-light": "#f8f6f6",
                "background-dark": "#211111",
                "surface-light": "#ffffff",
                "surface-dark": "#2d2d2d",
                "secondary-container": "#ffe0e2",
                "on-secondary-container": "#3e0004",
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "1rem",
                lg: "1.5rem",
                xl: "2rem",
                "2xl": "3rem",
                full: "9999px",
            },
        },
    },
    plugins: [],
};
