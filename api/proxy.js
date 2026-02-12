// proxy.js for Shock (Vercel / serverless function style)
module.exports = async (req, res) => {
  // Optional: Only allow POST and OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://yosoykush.fun');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Expect minDate and maxDate from the client (in YYYY-MM-DD format)
    const { minDate, maxDate } = req.body;

    if (!minDate || !maxDate) {
      res.status(400).json({ error: 'Missing minDate or maxDate' });
      return;
    }

    const apiUrl = 'https://shock.com/api/v1/get-referrals';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: 'f82b9c6a-028e-4702-b315-7a73656bbeab',
        minDate: minDate,
        maxDate: maxDate,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `Shock API error: ${response.status} - ${errorText}` });
      return;
    }

    const data = await response.json();

    // Add CORS headers so your frontend[](https://yosoykush.fun) can read it
    res.setHeader('Access-Control-Allow-Origin', 'https://yosoykush.fun');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json(data);
  } catch (error) {
    console.error('Shock proxy error:', error);
    res.status(500).json({ error: `Proxy error: ${error.message}` });
  }
};
