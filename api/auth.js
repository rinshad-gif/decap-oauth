export default async function (req, res) {
  const code = req.query.code;

  if (!code) {
    const redirect = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
    return res.redirect(redirect);
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const data = await tokenResponse.json();

  res.setHeader("Content-Type", "text/html");
  res.end(`
    <!DOCTYPE html>
    <html>
    <body>
      <script>
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(data)}, "*");
          window.close();
        } else {
          document.body.innerText = JSON.stringify(${JSON.stringify(data)}, null, 2);
        }
      </script>
    </body>
    </html>
  `);
}
