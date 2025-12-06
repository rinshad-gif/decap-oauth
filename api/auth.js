export default async function handler(req, res) {
  try {
    const { code } = req.query;

    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: "Missing GitHub credentials" });
    }

    const REDIRECT_URI = "https://decap-oauth-21vi.vercel.app/api/auth";

    // Step 1: Redirect to GitHub
    if (!code) {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "repo",
      });

      res.statusCode = 302;
      res.setHeader(
        "Location",
        "https://github.com/login/oauth/authorize?" + params.toString()
      );
      return res.end();
    }

    // Step 2: Exchange code for token
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

    if (!data.access_token) {
      return res.status(400).json(data);
    }

    // Step 3: Send token to Decap CMS
    const message =
      "authorization:github:success:" +
      JSON.stringify({
        token: data.access_token,
        provider: "github",
      });

    res.setHeader("Content-Type", "text/html");
    res.end(`<!DOCTYPE html>
<html>
  <body>
    <script>
      if (window.opener) {
        window.opener.postMessage(
          ${JSON.stringify(message)},
          "https://rinshad-gif.github.io"
        );
      }
      window.close();
    </script>
    Authentication complete. You may close this window.
  </body>
</html>`);
  } catch (err) {
    res.status(500).json({
      error: "OAuth failed",
      message: err.message,
    });
  }
}
