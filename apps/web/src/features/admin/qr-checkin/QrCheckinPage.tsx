import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ScanLine } from "lucide-react";
import { Button, Card } from "../../../design-system";
import { Input, Select } from "../../../design-system/components/Field";
import { useAttendanceRoster, useScanCheckin } from "../../../lib/api/checkin";
import { useTournaments } from "../../../lib/api/tournaments";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";

/** Minimal shape of the experimental BarcodeDetector API — not yet in lib.dom.d.ts everywhere. */
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

export function QrCheckinPage() {
  const { data: tournaments } = useTournaments();
  const [tournamentId, setTournamentId] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerSupported, setScannerSupported] = useState(true);

  const scanCheckin = useScanCheckin();
  const { data: roster } = useAttendanceRoster(tournamentId || undefined);
  const toast = useToast();

  async function handleScanValue(qrToken: string) {
    if (!tournamentId) {
      toast.error("Select a tournament first.");
      return;
    }
    try {
      const result = await scanCheckin.mutateAsync({ qrToken, tournamentId });
      setLastResult(`${result.player.fullName} checked in`);
      toast.success(`${result.player.fullName} checked in ✅`);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  useEffect(() => {
    if (!tournamentId) return;
    if (!window.BarcodeDetector) {
      setScannerSupported(false);
      return;
    }
    let stream: MediaStream | undefined;
    let cancelled = false;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]) await handleScanValue(codes[0].rawValue);
          } catch {
            // detection errors are transient (e.g. frame not ready) — ignore and retry
          }
          if (!cancelled) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch {
        setCameraError("Camera access denied or unavailable — use manual entry below.");
      }
    }
    void start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 font-display text-xl font-bold">QR Check-in</h1>
      <Select
        label="Tournament"
        required
        placeholder="Select a tournament"
        value={tournamentId}
        onChange={(e) => setTournamentId(e.target.value)}
        options={(tournaments ?? []).map((t) => ({ value: t.id, label: t.name }))}
      />

      {tournamentId && (
        <>
          <Card className="mt-4 flex flex-col items-center gap-3 p-4">
            {scannerSupported && !cameraError ? (
              <video ref={videoRef} autoPlay muted playsInline className="aspect-square w-full rounded-sm bg-black object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-sm bg-canvas text-text-secondary">
                <ScanLine className="h-10 w-10" />
              </div>
            )}
            {cameraError && <p className="text-xs text-warning">{cameraError}</p>}
            {!scannerSupported && (
              <p className="text-xs text-text-secondary">
                Live camera scanning isn't supported in this browser — use manual entry.
              </p>
            )}
          </Card>

          <Card className="mt-4 flex gap-2">
            <div className="flex-1">
              <Input
                label="Enter code manually"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && manualCode && handleScanValue(manualCode)}
              />
            </div>
            <Button className="self-end" onClick={() => manualCode && handleScanValue(manualCode)} loading={scanCheckin.isPending}>
              Check in
            </Button>
          </Card>

          {lastResult && (
            <div className="mt-4 flex items-center gap-2 rounded-sm border border-success/30 bg-success/5 p-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> {lastResult}
            </div>
          )}

          {roster && (
            <p className="mt-4 text-center text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{roster.checkedInCount}</span> / {roster.totalConfirmed} checked in
            </p>
          )}
        </>
      )}
    </div>
  );
}
