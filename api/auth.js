export default async function handler(req, res) {
    const code = req.query.code;
  
    // STEP 1: Redirect user to GitHub
    if (!code) {
      const githubURL =
        "https://github.com/login/oauth/authorize" +
        `?client_id=${process.env.GITHUB_CLIENT_ID}` +
        "&scope=repo";
  
      return res.redirect(githubURL);
    }
  
    // STEP 2: Exchange code for access token
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
  
    // STEP 3: Send token back to Decap CMS
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <script>
        window.opener.postMessage(${JSON.stringify(data)}, "*");
        window.close();
      </script>
    `);
  }
  