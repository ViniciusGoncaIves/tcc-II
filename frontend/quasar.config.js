import { defineConfig } from '#q-app';

export default defineConfig(() => {
  return {
    boot: ['axios'],

    extras: ['roboto-font', 'material-icons'],

    build: {
      target: {},

      vueRouterMode: 'hash',

      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            eslint: {
              lintCommand:
                'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
              useFlatConfig: true
            }
          },
          { server: false }
        ]
      ]
    },

    devServer: {
      open: true
    },

    framework: {
      config: {},
      lang: 'pt-BR',
      plugins: ['Notify', 'Dialog', 'Loading']
    },

    animations: [],

    // Modos do Quasar não usados pelo DoseCerta (o build é SPA).
    ssr: {
      prodPort: 3000,
      middlewares: ['render']
    },

    ssg: {},

    pwa: {
      workboxMode: 'GenerateSW'
    },

    cordova: {},

    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      preloadScripts: ['electron-preload'],
      inspectPort: 5858,
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'frontend'
      }
    },

    bex: {
      extraScripts: []
    }
  };
});
