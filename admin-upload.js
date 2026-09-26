const { config, json, isAdminAuthorized } = require('./_supabase');

exports.handler = async (event) => {
  if (!isAdminAuthorized(event)) {
    return json(401, { success: false, message: 'Non autorisé.' });
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Méthode non autorisée.' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { filename, contentType, dataBase64 } = body;
    if (!filename || !contentType || !dataBase64) {
      return json(400, { success: false, message: 'filename, contentType et dataBase64 requis.' });
    }
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + safeName;

    const { url, key } = config();
    const buffer = Buffer.from(dataBase64, 'base64');

    const res = await fetch(url + '/storage/v1/object/product-images/' + path, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'apikey': key,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!res.ok) {
      const text = await res.text();
      return json(res.status, { success: false, message: 'Échec upload.', detail: text });
    }

    const publicUrl = url + '/storage/v1/object/public/product-images/' + path;
    return json(200, { success: true, url: publicUrl, path });
  } catch (err) {
    return json(500, { success: false, message: err.message });
  }
};
