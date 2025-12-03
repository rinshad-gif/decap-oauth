import fetch from "node-fetch";

export default async function handler(req, res) {

  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get("code");

  // STEP 1: Redirect to GitHub Auth
  if (!code) {
    const redirect = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
    res.writeHead(302, { Location: redirect });
    return res.end();
  }

  // STEP 2: Exchange code for token
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const data = await response.json();

  // STEP 3: Return token to Decap CMS
  res.setHeader("Content-Type", "text/html");
  res.end(`
    <script>
      window.opener.postMessage(${JSON.stringify(data)}, "*");
      window.close();
    </script>
  `);
}
