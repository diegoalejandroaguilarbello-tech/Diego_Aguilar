import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.error("Ejecuta este comando en una terminal interactiva.");
  process.exit(1);
}

const password = await readHidden("Escribe la nueva contraseña: ");
const confirmation = await readHidden("Repítela para confirmar: ");

if (password !== confirmation) {
  console.error("Las contraseñas no coinciden.");
  process.exit(1);
}
if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
  console.error("Usa al menos 12 caracteres e incluye mayúscula, minúscula y número.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);
const salt = randomBytes(32).toString("base64url");

console.log("\nCopia solo estos valores en tu archivo privado .env.local:");
console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
console.log(`SECURITY_HASH_SALT=${salt}`);
console.log("La contraseña original no fue guardada.");

function readHidden(prompt) {
  return new Promise((resolve) => {
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    function finish() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("data", onData);
      process.stdout.write("\n");
      resolve(value);
    }

    function onData(character) {
      if (character === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdout.write("\n");
        process.exit(130);
      }
      if (character === "\r" || character === "\n") return finish();
      if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
        return;
      }
      if (character >= " ") value += character;
    }

    process.stdin.on("data", onData);
  });
}
