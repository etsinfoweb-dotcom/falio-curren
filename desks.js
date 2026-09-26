// Renvoie la liste des points relais (stop desk) Noest. Le token reste côté serveur.
exports.handler = async () => {
  const token = process.env.NOEST_API_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Configuration Noest manquante sur le serveur.' }) };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('https://app.noest-dz.com/api/public/desks', {
      headers: { 'Authorization': 'Bearer ' + token },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    return {
      statusCode: res.status,
      headers: { 'Cache-Control': 'public, max-age=3600' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ success: false, message: 'Impossible de contacter Noest pour le moment.' }) };
  }
};
