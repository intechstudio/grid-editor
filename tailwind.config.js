module.exports = {
  theme: {
    fontFamily: {
      'body': ['roboto']
    },
    extend: {
      margin:{
        '14': '3.5rem'
      },
      zIndex: {
        '-10':'-10',
      },
      fontFamily: {
        'mono' : 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        'aldo' : 'Aldo-SemiBold',
        'roboto-sans' : 'Roboto Sans',
        'gt-pressura': 'GT Pressura Pro M Trial',
        'roboto' : 'Roboto',
        'roboto-mono' : 'Roboto Mono'
      },
      cursor: {
        'helper': 'help'
      },
      minHeight: {
        '200': '200px',
        '300': '300px'
      },
      height: {
        '32': '8rem',
        '14': '3.5rem',
        '64': '16rem',
        '72': '18rem',
        '128': '32rem',
        '600': '600px',
        '300': '300px',
        'calc': 'calc(100vh - 62px)'
      },
      inset: {
        '1/2': '50%',
        '1': '1em',
        '9/10': '0.9em',
        '-1': '-1em',
      },
      borderWidth: {
        '8': '8px',
        '16': '16px'
      },
      colors: {
        primary: {
          'DEFAULT': '#1e2628',
          '100':'#d3dcde',
          '200':'#b6c5c8',
          '300':'#99adb2',
          '400':'#7c969d',
          '500':'#627d83',
          '600':'#4d6166',
          '700':'#374549',
          '800':'#212a2c',
          '900': '#0b0e0f',
          'opacity': 'rgba(30, 38, 40, 0.85)'
        },
        secondary: '#2a3439',
        normal: '#cfdbd5',
        highlight: {
          'DEFAULT': '#cc5b5b',
          '100':'#edc5c5',
          '200':'#e19e9e',
          '300':'#d57777',
          '400':'#c95050',
          '500':'#af3636',
          '600':'#882a2a'
        },
        important: {
          'DEFAULT': '#e4d203',
          '100': '#fffde6',
          '200': '#fef8b3',
          '300': '#fdf381',
          '400': '#fdef4f',
          '500': '#fcea1c',
          '600': '#e3d103',
          '700': '#b0a202'
        }
      }
    }
  },
  variants: {
    textColor: ['group-hover']
  },
  plugins: []
}