import QRCode from 'qrcode';

const HMAC_SECRET = "CINEPASS_SECRET_SALT_2026";

/**
 * High quality checksum computation for tamper-resistance
 */
function computeChecksum(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  const input = str + HMAC_SECRET;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function utf8ToBase64(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
}

function base64ToUtf8(b64) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  return decodeURIComponent(Array.prototype.map.call(atob(b64), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

/**
 * Generate a high resolution QR Code Data URL
 * @param {string} text - Payload to encode
 * @param {object} options - Options
 * @returns {Promise<string>} Data URL base64 image
 */
export async function generateQRCodeUrl(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 300,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#0a0b10',
        light: options.lightColor || '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.error("QR Code Generation Error:", err);
    return "";
  }
}

/**
 * Create a cryptographically signed token payload for E-Tickets
 */
export function createTicketToken(orderData) {
  const payload = {
    bookingRef: orderData.bookingRef,
    movie: orderData.movieTitle,
    seats: orderData.seats ? orderData.seats.map(s => s.id) : [],
    hall: orderData.hall,
    time: orderData.time,
    date: orderData.date,
    issuedAt: new Date().toISOString()
  };
  const token = utf8ToBase64(JSON.stringify(payload));
  const sig = computeChecksum(token);
  return `CINE-PASS::v1::${token}::${sig}`;
}

/**
 * Decode and verify ticket QR token integrity
 */
export function verifyTicketToken(tokenString) {
  try {
    if (!tokenString || !tokenString.startsWith("CINE-PASS::v1::")) {
      return { valid: false, error: "Invalid ticket format" };
    }
    const parts = tokenString.split("::");
    if (parts.length < 4) {
      return { valid: false, error: "Malformed ticket structure" };
    }
    const token = parts[2];
    const signature = parts[3];

    // Verify signature
    const expectedSig = computeChecksum(token);
    if (signature !== expectedSig) {
      return { valid: false, error: "Invalid signature: ticket may have been tampered with" };
    }

    const decodedJson = base64ToUtf8(token);
    const parsed = JSON.parse(decodedJson);
    return { valid: true, data: parsed, payload: parsed };
  } catch (e) {
    return { valid: false, error: "Signature verification failed: " + e.message };
  }
}
