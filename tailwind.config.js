/** Paleta Autcar: azul escuro, preto e branco. */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0B1F3A', soft: '#C9D3E3', line: '#D5DAE3', muted: '#4A5468' },
        ink: '#0A0A0A',
      },
      fontFamily: { sans: ['Inter', 'Arial', 'sans-serif'] },
    },
  },
  plugins: [],
};
