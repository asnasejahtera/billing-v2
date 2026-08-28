import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

function getEncryptionKey() {
  const value =
    process.env.ROUTER_CREDENTIAL_KEY;

  if (!value) {
    throw new Error(
      "ROUTER_CREDENTIAL_KEY belum dikonfigurasi",
    );
  }

  const key = Buffer.from(
    value,
    "base64",
  );

  if (key.length !== 32) {
    throw new Error(
      "ROUTER_CREDENTIAL_KEY harus berupa Base64 32 byte",
    );
  }

  return key;
}

export function encryptRouterPassword(
  password: string,
) {
  const iv = randomBytes(12);

  const cipher = createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);

  const authTag =
    cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptRouterPassword(
  value: string,
) {
  const parts = value.split(".");

  if (parts.length !== 3) {
    throw new Error(
      "Format credential router tidak valid",
    );
  }

  const [ivValue, authTagValue, encryptedValue] =
    parts;

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64"),
  );

  decipher.setAuthTag(
    Buffer.from(
      authTagValue,
      "base64",
    ),
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(
        encryptedValue,
        "base64",
      ),
    ),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}