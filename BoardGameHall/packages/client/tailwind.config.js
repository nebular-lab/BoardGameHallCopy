module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        'bg-blue': '#e0f6fe',
        bland: '#364f6b',
      },
      width: {
        sidebar: '300px',
      },
      height: {
        header: '48px',
      },
      maxHeight: {
        'game-screen': '600px',
      },
      maxWidth: {
        'game-screen': '800px',
      },
    },
  },
  plugins: [],
};
