import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { code } = req.query;
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
    const VERCEL_URL = process.env.VERCEL_URL || "https://decap-oauth-21vi.vercel.app";
    const REDIRECT_URI = `${VERCEL_URL}/api/auth`;

    // STEP 1: Redirect to GitHub OAuth
    if (!code) {
      const authURL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo`;
      return res.redirect(authURL);
    }

    // STEP 2: Exchange code for token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });

    if (!tokenRes.ok) {
      throw new Error(`GitHub API responded with ${tokenRes.status}`);
    }

    const token = await tokenRes.json();

    // STEP 3: Return token to Decap CMS
    res.setHeader("Content-Type", "text/html");
    res.end(`
      <script>
        window.opener.postMessage(${JSON.stringify(token)}, "*");
        window.close();
      </script>
    `);
    
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message 
    });
  }
}