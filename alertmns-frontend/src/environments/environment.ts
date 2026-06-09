/**
 * Variables d'environnement Angular — mode développement.
 * Le proxy Angular (proxy.conf.json) redirige /api et /ws vers localhost:4000.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  wsUrl: '/ws'
};
