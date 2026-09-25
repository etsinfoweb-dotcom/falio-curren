// Utilitaires partagés pour parler à Supabase depuis les fonctions serveur.
// Ne jamais importer ce fichier depuis du code exposé au client.

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error('Configuration Supabase manquante sur le serveur.');
  }
  return { url: url.replace(/\/$/, ''), key };
}

async function pg(path, options = {}) {
  const { url, key } = config();
  const res = await fetch(url + '/rest/v1' + path, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return res;
}

function isAdminAuthorized(event) {
  const provided = event.headers['x-admin-password'] || event.headers['X-Admin-Password'];
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && provided === expected;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

module.exports = { config, pg, isAdminAuthorized, json };
