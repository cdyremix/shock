// proxy.js for Shock (Vercel serverless function)
// Updated: correct date format (Unix ms), optional dates, better error handling

module.exports = async (req, res) => {
  // Handle CORS preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://yosoykush.fun');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed - use POST' });
  }

  try {
    // Parse incoming body (minDate and maxDate expected as YYYY-MM-DD strings)
    const { minDate, maxDate } = req.body || {};

    // Build payload for Shock API
    const payload = {
      apiKey: 'f82b9c6a-028e-4702-b315-7a73656bbeab',
    };

    // Convert string dates to Unix milliseconds if provided
    if (minDate) {
      const minTimestamp = new Date(minDate).getTime();
      if (!isNaN(minTimestamp)) {
        payload.minDate = minTimestamp;
      } else {
        return res.status(400).json({ error: 'Invalid minDate format (use YYYY-MM-DD)' });
      }
    }

    if (maxDate) {
      const maxTimestamp = new Date(maxDate).getTime();
      if (!isNaN(maxTimestamp)) {
        payload.maxDate = maxTimestamp;
      } else {
        return res.status(400).json({ error: 'Invalid maxDate format (use YYYY-MM-DD)' });
      }
    }

    // If no dates provided → Shock returns lifetime data (as per their docs)

    console.log('Shock proxy - sending payload:', JSON.stringify(payload, null, 2));

    const apiUrl = 'https://shock.com/api/v1/get-referrals';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      const text = await response.text();
      console.error('Shock API - non-JSON response:', text);
      return res.status(response.status || 500).json({
        error: 'Shock API returned non-JSON response',
        status: response.status,
        body: text.slice(0, 500), // truncate for logs
      });
    }

    // Log the full upstream response for debugging (visible in Vercel logs)
    console.log('Shock API response status:', response.status);
    console.log('Shock API response body:', JSON.stringify(data, null, 2));

    // Set CORS headers for frontend
    res.setHeader('Access-Control-Allow-Origin', 'https://yosoykush.fun');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Forward errors from Shock with proper status
    if (!response.ok || data.error || data.message?.includes('error')) {
      return res.status(response.status || 400).json(data);
    }

    // Success - return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('Shock proxy error:', error.message, error.stack);
    return res.status(500).json({
      error: 'Proxy failed to connect to Shock API',
      message: error.message,
    });
  }
};
