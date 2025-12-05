// Use CommonJS instead of ES modules for better compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
  try {
    console.log('=== AUTH FUNCTION STARTED ===');
    console.log('Method:', req.method);
    console.log('Query:', req.query);
    console.log('Headers:', req.headers);
    
    const { code } = req.query;
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const REDIRECT_URI = `https://decap-oauth-21vi.vercel.app/api/auth`;
    
    // If no code, redirect to GitHub
    if (!code) {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'repo'
      });
      const authURL = `https://github.com/login/oauth/authorize?${params}`;
      console.log('Redirecting to:', authURL);
      return res.redirect(authURL);
    }
    
    // Exchange code for token
    console.log('Exchanging code for token');
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });
    
    const data = await tokenResponse.json();
    console.log('GitHub response:', data);
    
    if (data.error) {
      return res.status(400).json(data);
    }
    
    // Return to Decap CMS
    res.setHeader('Content-Type', 'text/html');
    const html = `
      <script>
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(data)}, "*");
        } else {
          console.log('Token:', ${JSON.stringify(data)});
        }
        window.close();
      </script>
      <p>Authentication complete. You can close this window.</p>
    `;
    res.end(html);
    
  } catch (error) {
    console.error('FUNCTION CRASH:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Function failed',
      message: error.message,
      stack: error.stack
    });
  }
};