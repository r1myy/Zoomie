const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 — avoids misreads when read aloud

function block(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateRoomCode() {
  return `${block(3)}-${block(3)}`;
}

export function isValidRoomCode(code: string) {
  return /^[A-Z0-9]{3}-[A-Z0-9]{3}$/i.test(code.trim());
}
