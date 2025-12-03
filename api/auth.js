import fetch from "node-fetch";
import querystring from "querystring";

export default async function handler(req, res) {
  const params = querystring.parse(req.url.split("?")[1] || "");

  // STEP 1: Redirect to GitHub login
  if (!params.code) {
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
      code: params.code
    })
  });

  const data = await response.json();

  // STEP 3: Send token back to Decap CMS
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <script>
      window.opener.postMessage(${JSON.stringify(data)}, "*");
      window.close();
    </script>
  `);
}
