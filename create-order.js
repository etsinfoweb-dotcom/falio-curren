// Crée une commande Noest côté serveur. Le token API reste secret (variables d'environnement Netlify).
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Méthode non autorisée.' }) };
  }

  const token = process.env.NOEST_API_TOKEN;
  const userGuid = process.env.NOEST_USER_GUID;

  if (!token || !userGuid) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Configuration Noest manquante sur le serveur.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Requête invalide.' }) };
  }

  const { client, phone, phone2, adresse, wilaya_id, commune, montant, produit, stop_desk, station_code, reference, remarque } = body;

  if (!client || !phone || !montant || !produit || wilaya_id == null || stop_desk == null) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Champs obligatoires manquants.' }) };
  }
  if (stop_desk === 1 && !station_code) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Code de station requis pour le stop desk.' }) };
  }

  const payload = {
    user_guid: userGuid,
    client: String(client).slice(0, 255),
    phone: String(phone),
    montant,
    produit: String(produit).slice(0, 255),
    type_id: 1,
    stop_desk
  };
  if (phone2) payload.phone_2 = String(phone2);
  if (reference) payload.reference = String(reference).slice(0, 255);
  if (remarque) payload.remarque = String(remarque).slice(0, 255);
  if (wilaya_id != null) payload.wilaya_id = Number(wilaya_id);
  if (stop_desk === 1) {
    payload.station_code = station_code;
  } else {
    if (adresse) payload.adresse = String(adresse).slice(0, 255);
    if (commune) payload.commune = String(commune);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('https://app.noest-dz.com/api/public/create/order', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    return { statusCode: res.status, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ success: false, message: 'Impossible de contacter Noest pour le moment.' }) };
  }
};
