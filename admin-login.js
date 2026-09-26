const { json } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Méthode non autorisée.' });
  }
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { success: false, message: 'Requête invalide.' });
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return json(500, { success: false, message: 'Mot de passe admin non configuré sur le serveur.' });
  }
  if (body.password === expected) {
    return json(200, { success: true });
  }
  return json(401, { success: false, message: 'Mot de passe incorrect.' });
};
