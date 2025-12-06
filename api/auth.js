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

    // STEP 1: Redirect user to GitHub OAuth (first visit, no code yet)
    if (!code) {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "repo",
      });

      return res.redirect(
        "https://github.com/login/oauth/authorize?" + params.toString()
      );
    }

    // STEP 2: Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
        }),
      }
    );

    const data = await tokenResponse.json();
    console.log("GitHub token response:", data);

    if (data.error || !data.access_token) {
      return res.status(400).json(data);
    }

    // STEP 3: Send token back to Decap CMS in REQUIRED format
    const message =
      "authorization:github:success:" +
      JSON.stringify({
        token: data.access_token,
        provider: "github",
      });

    res.setHeader("Content-Type", "text/html");
    res.end(
      "<!doctype html>" +
        "<html><body>" +
        "<script>" +
        "  if (window.opener) {" +
        "    window.opener.postMessage(" +
        JSON.stringify(message) +
        ', "*");' +
        "  }" +
        "  window.close();" +
        "</script>" +
        "<p>Authentication complete. You may close this window.</p>" +
        "</body></html>"
    );
  } catch (err) {
    console.error("FUNCTION CRASH:", err);
    res.status(500).json({
      error: "Function failed",
      message: err.message,
    });
  }
}
