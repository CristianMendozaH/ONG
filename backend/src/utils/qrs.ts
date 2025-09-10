import QRCode from 'qrcode';

export async function generarQR(texto: string) {
  // Devuelve DataURL (PNG Base64); también puedes usar toFile si quieres archivo físico
  return QRCode.toDataURL(texto, { errorCorrectionLevel: 'M' });
}
