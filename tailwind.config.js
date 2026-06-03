/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: '#185FA5',
          mid: '#2070C0',
          light: '#E6F1FB',
          dark: '#0C447C',
        },
        teal: {
          DEFAULT: '#0E7C7B',
          light: '#CBF0EF',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
