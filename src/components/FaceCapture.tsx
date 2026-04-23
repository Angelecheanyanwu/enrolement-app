"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ArrowLeft, RefreshCw, Upload, X } from "lucide-react";

interface FaceCaptureProps {
  onComplete: (faceImage: File) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

type CaptureState = "idle" | "streaming" | "captured";

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onComplete,
  onBack,
  isSubmitting,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // ── stop webcam stream ────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (detectionTimerRef.current) {
      clearTimeout(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
  }, []);

  // ── start webcam stream ───────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setFaceDetected(false);
    setCountdown(null);
    setCapturedDataUrl(null);
    setCapturedFile(null);
    setCaptureState("idle");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCaptureState("streaming");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(
        "Could not access the camera. Please allow camera permissions and try again."
      );
    }
  }, []);

  // ── snap a frame from the video onto the canvas ───────────────────────────
  const snapFrame = useCallback((): File | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Mirror the image to match what the user sees
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    // Convert data-URL → File
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    const bytes = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) bytes[i] = bstr.charCodeAt(i);
    const file = new File([bytes], `face_${Date.now()}.jpg`, { type: mime });

    return file;
  }, []);

  // ── simple "face present" heuristic via brightness variance ──────────────
  // A real app would use face-api.js or similar; this lightweight approach
  // checks that the video frame has meaningful content (not a black/blank feed).
  const detectFacePresence = useCallback((): boolean => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return false;

    const W = 160;
    const H = 120;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(video, 0, 0, W, H);

    const data = ctx.getImageData(0, 0, W, H).data;
    let sum = 0;
    let sumSq = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += luma;
      sumSq += luma * luma;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    // Threshold: non-trivial variance → something is in front of camera
    return variance > 200 && mean > 30;
  }, []);

  // ── polling loop that fires once face is detected, then counts down ───────
  useEffect(() => {
    if (captureState !== "streaming") return;

    let countdownValue = 3;
    let phase: "detecting" | "counting" = "detecting";

    const tick = () => {
      if (captureState !== "streaming") return;

      const present = detectFacePresence();
      setFaceDetected(present);

      if (phase === "detecting") {
        if (present) {
          phase = "counting";
          setCountdown(countdownValue);
        }
        detectionTimerRef.current = setTimeout(tick, 300);
      } else {
        // countdown phase
        if (!present) {
          // face left frame – reset
          phase = "detecting";
          countdownValue = 3;
          setCountdown(null);
          detectionTimerRef.current = setTimeout(tick, 300);
          return;
        }

        if (countdownValue > 1) {
          countdownValue -= 1;
          setCountdown(countdownValue);
          detectionTimerRef.current = setTimeout(tick, 1000);
        } else {
          // take the photo
          setCountdown(null);

          // Restore canvas size before snapping
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }

          const file = snapFrame();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              setCapturedDataUrl(ev.target?.result as string);
              setCapturedFile(file);
              setCaptureState("captured");
              stopStream();
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    detectionTimerRef.current = setTimeout(tick, 500);

    return () => {
      if (detectionTimerRef.current) clearTimeout(detectionTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureState]);

  // ── clean up on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedFile(null);
    setFaceDetected(false);
    setCountdown(null);
    startCamera();
  };

  const handleSubmit = () => {
    if (capturedFile) {
      onComplete(capturedFile);
    }
  };

  // ── derived UI booleans ───────────────────────────────────────────────────
  const isStreaming = captureState === "streaming";
  const isCaptured = captureState === "captured";
  const isIdle = captureState === "idle";

  return (
    <div className="h-full w-full p-4 md:p-6 overflow-hidden">
      <div className="mx-auto flex h-full max-w-4xl flex-col rounded-lg bg-white p-6 shadow-lg">

        {/* Header */}
        <div className="shrink-0">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Face Capture</h2>
          <p className="text-gray-600">
            {isCaptured
              ? "Photo captured! Review and click Upload to proceed."
              : "Position your face in the frame — a photo will be taken automatically."}
          </p>
        </div>

        {/* Preview */}
        <div className="flex-1 flex items-center justify-center mt-4">
          <div
            className={`relative h-[42vh] max-h-[26rem] w-80 flex items-center justify-center rounded-lg overflow-hidden
              ${isStreaming && faceDetected ? "border-4 border-green-400" : "border-2 border-gray-300"}
              bg-gray-900 transition-all duration-200`}
          >
            {/* Live video (mirrored so it feels natural) */}
            <video
              ref={videoRef}
              muted
              playsInline
              className={`absolute inset-0 h-full w-full object-cover scale-x-[-1] ${isStreaming ? "block" : "hidden"}`}
            />

            {/* Hidden canvas used for capture / detection */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Captured still */}
            {isCaptured && capturedDataUrl && (
              <>
                <img
                  src={capturedDataUrl}
                  alt="Captured face"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRetake}
                  className="absolute top-2 right-2 rounded-full bg-white p-2 shadow hover:bg-gray-100 z-10"
                  title="Retake"
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>
              </>
            )}

            {/* Idle placeholder */}
            {isIdle && !cameraError && (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Camera className="h-28 w-28" />
                <p className="text-sm">Camera not started</p>
              </div>
            )}

            {/* Error */}
            {cameraError && (
              <div className="flex flex-col items-center gap-3 text-center text-red-400 px-4">
                <Camera className="h-16 w-16" />
                <p className="text-sm">{cameraError}</p>
              </div>
            )}

            {/* Countdown overlay */}
            {isStreaming && countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-8xl font-bold text-white drop-shadow-lg animate-pulse">
                  {countdown}
                </span>
              </div>
            )}

            {/* Face-detected indicator */}
            {isStreaming && faceDetected && countdown === null && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow">
                  Face detected
                </span>
              </div>
            )}

            {/* Searching indicator */}
            {isStreaming && !faceDetected && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <span className="rounded-full bg-gray-700/80 px-3 py-1 text-xs font-semibold text-white shadow">
                  Searching for face…
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-4 shrink-0 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
          <ul className="list-disc list-inside space-y-1">
            <li>Face must be clear and well-lit</li>
            <li>No hats, glasses, or face coverings</li>
            <li>Look directly at the camera</li>
            <li>Plain background recommended</li>
            <li>Hold still — photo is taken automatically when your face is detected</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-center shrink-0">
          {isIdle && (
            <button
              onClick={startCamera}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />
              Start Camera
            </button>
          )}

          {isStreaming && (
            <button
              onClick={handleRetake}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-3 font-semibold hover:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw className="h-5 w-5" />
              Restart
            </button>
          )}

          {isCaptured && (
            <button
              onClick={handleRetake}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              <RefreshCw className="h-5 w-5" />
              Retake
            </button>
          )}
        </div>

        {/* Submit row */}
        <div className="mt-6 flex shrink-0 gap-4 border-t pt-5">
          <button
            onClick={handleSubmit}
            disabled={!capturedFile || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
            {isSubmitting ? "Submitting…" : "Upload & Submit Enrollment"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FaceCapture;