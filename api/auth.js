export default async function handler(req, res) {
  try {
    console.log("=== AUTH FUNCTION STARTED ===");

    const { code } = req.query;
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const REDIRECT_URI = "https://decap-oauth-21vi.vercel.app/api/auth";

    // If no code → redirect user to GitHub OAuth
    if (!code) {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "repo"
      });
      return res.redirect(
        "https://github.com/login/oauth/authorize?" + params.toString()
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI
        })
      }
    );

    const data = await tokenResponse.json();
    console.log("GitHub token response:", data);

    if (data.error) {
      return res.status(400).json(data);
    }

    // Send the token back to Decap CMS admin panel
    res.setHeader("Content-Type", "text/html");
    res.end(`
      <script>
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(data)}, "*");
        }
        window.close();
      </script>
      <p>Authentication complete. You may close this window.</p>
    `);
  } catch (err) {
    console.error("FUNCTION CRASH:", err);
    return res.status(500).json({
      error: "Function failed",
      message: err.message,
      stack: err.stack
    });
  }
}
