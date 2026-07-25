import QRCode from "qrcode";
import type { QrCodeGenerator } from "../../domain/ports/providers";

export class QrCodeService implements QrCodeGenerator {
  async toDataUrl(payload: string): Promise<string> {
    return QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: 320 });
  }
}
