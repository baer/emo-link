export function getHomePage(siteKey: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>EmoLink</title>

        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        ></script>
        <style>
          html,
          body {
            height: 100%;
          }

          body {
            display: flex;
            align-items: center;
            padding-top: 40px;
            padding-bottom: 40px;
            background-color: #fefefe;
          }

          .form-signin {
            width: 100%;
            max-width: 330px;
            padding: 15px;
            margin: auto;
          }

          .form-signin input[type="text"] {
            margin-bottom: -1px;
            border-bottom-right-radius: 0;
            border-bottom-left-radius: 0;
          }
        </style>
      </head>
      <body>
        <main class="form-signin">
          <h2>EmoLink</h2>
            
          <div>
            <input type="text" id="url"/>
            <label for="url">URL</label>
          </div>
        
          <div>
            <!-- The following line controls and configures the Turnstile widget. -->
            <div
              class="cf-turnstile"
              data-sitekey="${siteKey}"
              data-theme="light"
            ></div>
            <!-- end. -->
          </div>
        
          <button onClick="(() => { handleSubmitURL() })()">Submit</button>

          <div id="result" />
        </main>
      </body>
      <script>
        async function handleSubmitURL(data = {}) {
          const url = "/api/link";
          const formData = new FormData();
          formData.append("cf-turnstile-response", turnstile.getResponse());
          formData.append("url", document.getElementById('url').value);
        
          try {
            const result = await fetch(url, {
              body: formData,
              method: "POST",
            });
            const data = await result.json();
            console.log(data)
            document.getElementById('result').innerHTML = \`<a href='\${data.key}'>\${window.location.origin}\${data.key}</a>\`
          } catch (err) {
            console.error(err);
          }
        };
      </script>
    </html>
  `;
}

export function getDemo(
  uuid: string,
  uuidAsEmoji: string,
  uriEncodedEmojiUUID: string
) {
  return `
    <!DOCTYPE html>
    <body>
      <h1>EmoLink</h1>
      <p>UUID: ${uuid}</p>
      <p>Emoji: ${uuidAsEmoji}</p>
      <p>URI Encoded: ${uriEncodedEmojiUUID}</p>
    </body>
  `;
}
