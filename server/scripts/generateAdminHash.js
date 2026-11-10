import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error(
    'Usage: npm run hash-password -- "your-strong-password"'
  );
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    "Password must be at least 12 characters long."
  );
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

console.log("");
console.log("ADMIN_PASSWORD_HASH=" + hash);
console.log("");
console.log(
  "For server/.env when using Docker Compose, wrap the hash in single quotes:"
);
console.log("ADMIN_PASSWORD_HASH='" + hash + "'");
console.log("");
console.log(
  "For Render's dashboard, paste the raw hash without quotes."
);
console.log(
  "Then restart the server and log in with the password you just hashed."
);
console.log("");
console.log(
  "Prefer a plain-text env password? Set ADMIN_PASSWORD='your-password' (12+ chars) instead. The plain path is compared in constant time."
);
