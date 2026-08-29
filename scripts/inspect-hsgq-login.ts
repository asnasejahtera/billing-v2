const baseUrl = "http://103.71.162.21:8080";

async function main() {
  console.log("=== GET INDEX ===");

  const indexResponse = await fetch(`${baseUrl}/`);
  const html = await indexResponse.text();

  console.log("Status:", indexResponse.status);
  console.log("Length:", html.length);

  const scripts = [
    ...html.matchAll(
      /<script[^>]+src=["']?([^"' >]+)["']?[^>]*>/gi,
    ),
  ].map((match) => match[1]);

  console.log("\n=== SCRIPT FILES ===");

  for (const script of scripts) {
    console.log(script);
  }

  const keywords = [
    "userlogin",
    "form=login",
    "captcha_f",
    "captcha_v",
    "Password check failed",
    "btoa",
    "CryptoJS",
    "MD5",
    "md5",
    "encrypt",
  ];

  for (const script of scripts) {
    const url = new URL(
      script,
      `${baseUrl}/`,
    ).toString();

    console.log(`\n=== FETCH ${url} ===`);

    const response = await fetch(url);
    const js = await response.text();

    console.log("Status:", response.status);
    console.log("Length:", js.length);

    for (const keyword of keywords) {
      let start = 0;
      let count = 0;

      while (true) {
        const index = js.indexOf(
          keyword,
          start,
        );

        if (index === -1) break;

        count++;

        console.log(
          `\n===== ${keyword} #${count} =====`,
        );

        console.log(
          js.slice(
            Math.max(0, index - 1500),
            Math.min(
              js.length,
              index + 2500,
            ),
          ),
        );

        start =
          index +
          keyword.length;

        if (count >= 5) break;
      }
    }
  }
}

main().catch(console.error);