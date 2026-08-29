import { createHash } from "node:crypto";

const baseUrl = "http://103.71.162.21:8080";
const username = "root";
const password = "kmzwa88saa";

async function main() {
  const key = createHash("md5")
    .update(`${username}:${password}`)
    .digest("hex");

  const encodedPassword = Buffer
    .from(password, "utf8")
    .toString("base64");

  const payload = {
    method: "set",
    param: {
      name: username,
      key,
      value: encodedPassword,
      captcha_v: "",
      captcha_f: "",
    },
  };

  console.log("=== HSGQ LOGIN REQUEST ===");
  console.log("URL:", `${baseUrl}/userlogin?form=login`);
  console.log("Username:", username);
  console.log("Key:", key);
  console.log("Password Base64:", encodedPassword);
  console.log(
    "Payload:",
    JSON.stringify(payload, null, 2),
  );

  const response = await fetch(
    `${baseUrl}/userlogin?form=login`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type":
          "application/json;charset=UTF-8",
        "X-Token": "null",
        Origin: baseUrl,
        Referer: `${baseUrl}/`,
      },
      body: JSON.stringify(payload),
    },
  );

  const text = await response.text();

  console.log("\n=== HSGQ LOGIN RESPONSE ===");
  console.log("Status:", response.status);
  console.log(
    "Content-Type:",
    response.headers.get("content-type"),
  );
  console.log(
    "Content-Length:",
    response.headers.get("content-length"),
  );

  const token =
    response.headers.get("x-token");

  console.log("X-Token:", token);
  console.log("Raw Response:");
  console.log(text);

  if (text) {
    try {
      console.log("\nParsed JSON:");
      console.dir(
        JSON.parse(text),
        { depth: null },
      );
    } catch {
      console.log("Response bukan JSON");
    }
  }

  if (token) {
    console.log("\n=== LOGIN SUCCESS ===");
    console.log("Token:", token);
  }
}

main().catch((error) => {
  console.error(
    "\n=== ERROR ===",
    error,
  );
});