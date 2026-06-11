// Polyfill pour sockjs-client qui utilise la variable Node.js `global`
(window as any).global = window;
