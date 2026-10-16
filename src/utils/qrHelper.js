import QRCode from 'qrcode';

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
 * Create a signed token payload for E-Tickets (HMAC-like signature simulation)
 */
export function createTicketToken(orderData) {
  const payload = {
    ref: orderData.bookingRef,
    movie: orderData.movieTitle,
    seats: orderData.seats.map(s => s.id),
    hall: orderData.hall,
    time: orderData.time,
    date: orderData.date,
    issuedAt: new Date().toISOString()
  };
  const token = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return `CINE-PASS::v1::${token}`;
}

/**
 * Decode and verify ticket QR token
 */
export function verifyTicketToken(tokenString) {
  try {
    if (!tokenString.startsWith("CINE-PASS::v1::")) {
      return { valid: false, error: "Invalid ticket format" };
    }
    const base64Data = tokenString.replace("CINE-PASS::v1::", "");
    const decodedJson = decodeURIComponent(escape(atob(base64Data)));
    const parsed = JSON.parse(decodedJson);
    return { valid: true, data: parsed };
  } catch (e) {
    return { valid: false, error: "Signature verification failed" };
  }
}
