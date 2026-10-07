const { createClient } = require('@supabase/supabase-js');

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  // Use SERVICE_ROLE only server-side. For public read endpoints consider using SUPABASE_ANON_KEY + RLS instead.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return sendJson(res, 500, { error: 'Server configuration error' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Explicitly select only the fields you need (avoid SELECT *)
    const { data, error } = await supabase
      .from('players')
      .select('id, name, position, club, price, points, active')
      .eq('active', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return sendJson(res, 500, { error: 'Database query failed' });
    }

    // Cache on CDN/edge for short time to reduce DB calls (adjust values as needed)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    return sendJson(res, 200, data);
  } catch (err) {
    console.error('Unhandled error in /api/players:', err);
    return sendJson(res, 500, { error: 'Internal server error' });
  }
};
