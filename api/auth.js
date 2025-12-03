export default async function handler(req) {

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
  
    // STEP 1: Send user to GitHub login
    if (!code) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`
        }
      });
    }
  
    // STEP 2: Exchange code for token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
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
  
    const data = await tokenRes.json();
  
    // STEP 3: Return token to Decap
    return new Response(`
      <script>
        window.opener.postMessage(${JSON.stringify(data)}, "*");
        window.close();
      </script>
    `, {
      headers: { "Content-Type": "text/html" }
    });
  
  }
  