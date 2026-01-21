"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Fingerprint as FingerprintIcon, X } from "lucide-react";
import Header from "./Header";
import NinModal from "./modals/Ninmodal";
import VerificationResult from "./VerificationResult";
import type { EnrollmentFormData } from "@/utils/types";
import { FaCheck } from "react-icons/fa";
import { Verify } from "crypto";
import type { VerificationData } from "@/utils/types";
import Loader from "./Loader";

const FINGERS = [{ id: "R1", name: "Right Thumb", hand: "right" }] as const;

type Finger = (typeof FINGERS)[number];
type FingerId = Finger["id"];

type FingerprintData = {
  image: string;
  base64: string;
  imageName: string;
  file?: File;
};

const PY_URL = process.env.NEXT_PUBLIC_PYTHON_URL_VERIFICATION ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const FINGER_FIELD_MAP: Record<FingerId, keyof VerificationData> = {
  R1: "right_thumb",
};

function base64ToFile(
  base64: string,
  fileName: string,
  fallbackType = "image/png",
): File {
  let mime = fallbackType;
  let data = base64;
  if (base64.startsWith("data:")) {
    const [header, body] = base64.split(",");
    const m = header.match(/data:(.*?);base64/);
    if (m) mime = m[1];
    data = body;
  }
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], fileName || `finger-${Date.now()}.png`, {
    type: mime,
  });
}

const initialForm: VerificationData= {
  nin: "",
  right_thumb: null,
  right_index: null,
  right_middle: null,
  right_ring: null,
  right_little: null,
  left_thumb: null,
  left_index: null,
  left_middle: null,
  left_ring: null,
  left_little: null,
};

const VerifyCapture: React.FC = () => {
  const [currentFingerIndex] = useState<number>(0); 
  const [capturedFingers, setCapturedFingers] = useState<
    Partial<Record<FingerId, FingerprintData>>
  >({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const [form, setForm] = useState<VerificationData>(initialForm);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitDone, setSubmitDone] = useState<boolean>(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const currentFinger = FINGERS[currentFingerIndex];

  const capturedCount = useMemo(
    () => Object.keys(capturedFingers).length,
    [capturedFingers],
  );

  const isCaptured = !!capturedFingers[currentFinger.id];

  const fetchFingerprint = async (fingerId: FingerId) => {
    try {
      setIsCapturing(true);
      const res = await fetch(`${PY_URL}/scan-fingerprint2`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Scan failed (${res.status}). ${text}`);
      }

      const data: { image: string; base64: string; imageName: string } =
        await res.json();

      setIsScanning(true);

      setTimeout(() => {
        const file = base64ToFile(data.base64, data.imageName, "image/png");

        setCapturedFingers((prev) => ({
          ...prev,
          [fingerId]: {
            image: `${PY_URL}/${data.image}`,
            base64: data.base64,
            imageName: data.imageName,
            file,
          },
        }));

        const field = FINGER_FIELD_MAP[fingerId];
        setForm((f) => ({ ...f, [field]: file }));

        setIsScanning(false);
        setIsCapturing(false);
      }, 2000);
    } catch (e) {
      console.error("Error capturing fingerprint:", e);
      setIsCapturing(false);
      setIsScanning(false);
      setError(
        `Failed to scan fingerprint: ${
          e instanceof Error ? e.message : "Unknown error"
        }`,
      );
    }
  };

  const deleteFingerprint = async (fingerId: FingerId) => {
    const fingerData = capturedFingers[fingerId];
    if (!fingerData) return;

    try {
      await fetch(`${PY_URL}/delete-fingerprint`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: fingerData.imageName,
      });

      setCapturedFingers((prev) => {
        const copy = { ...prev };
        delete copy[fingerId];
        return copy;
      });

      const field = FINGER_FIELD_MAP[fingerId];
      setForm((f) => ({ ...f, [field]: null }));
      setShowModal(false);
    } catch (e) {
      console.error("Error deleting fingerprint:", e);
    }
  };

  const resetForRecapture = async (fingerId: FingerId) => {
    const fingerData = capturedFingers[fingerId];
    if (!fingerData) return;

    try {
      await fetch(`${PY_URL}/delete-fingerprint`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: fingerData.imageName,
      });

      setCapturedFingers((prev) => {
        const copy = { ...prev };
        delete copy[fingerId];
        return copy;
      });

      const field = FINGER_FIELD_MAP[fingerId];
      setForm((f) => ({ ...f, [field]: null }));
    } catch (e) {
      console.error("Error resetting fingerprint:", e);
    }
  };

  const handleSubmitEnrollment = async (nin: string) => {
    const fp = form.right_thumb;
    if (!fp) {
      alert("No fingerprint captured. Please scan again.");
      setShowModal(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("nin", nin);
      fd.append("fingerprint_image", fp, fp.name || "right_thumb.png");

      const resp = await fetch(`${API_URL}/verify/fingerprint`, {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const data = await resp.json();
          msg = (data?.message || data?.detail || msg) as string;
        } catch {}
        throw new Error(msg);
      }
      const responseData = await resp.json();
      console.log("Backend response:", responseData);
      setVerifiedData(responseData);
      setSubmitDone(true);
      setShowModal(false);
    } catch (err) {
      console.error("Verify/submit failed:", err);
      setError(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitDone) {
    return <VerificationResult data={verifiedData} />;
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col">
    <Header currentStep={4} totalSteps={3} completedSteps={[1, 2, 3]} />

    <main className="flex-1 grid place-items-center px-4 py-6">
      <div className="w-full max-w-4xl">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex-1 text-left">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                Place a Finger on the Scanner
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                {isCaptured
                  ? "Fingerprint captured. Proceed to enter NIN."
                  : "Click Start to begin scanning your fingerprint."}
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            {isCaptured && (
              <div className="rounded-full bg-green-100 px-6 py-2 shadow ml-4 flex-shrink-0">
                <span className="text-xs sm:text-sm font-medium text-green-700 flex items-center gap-2">
                  <FaCheck />
                  Captured
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <div className="relative">
              <div
                className="
                  w-40 h-[260px]
                  sm:w-48 sm:h-[320px]
                  md:w-56 md:h-[380px]
                  lg:w-64 lg:h-[420px]
                  overflow-hidden
                  rounded-lg
                  border-4 border-gray-300
                  bg-gray-50
                "
              >
                {isCaptured && !isScanning ? (
                  <img
                    src={capturedFingers[currentFinger.id]!.image}
                    alt={currentFinger.name}
                    className="h-full w-full object-cover"
                  />
                ) : isScanning ? (
                  <div className="relative flex h-full w-full items-center justify-center bg-green-500/50">
                    <div className="animate-scan absolute left-0 right-0 h-1 bg-green-600" />
                    <FingerprintIcon className="h-32 w-32 animate-pulse text-white" />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FingerprintIcon className="h-32 w-32 text-gray-300" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            {!isCaptured && (
              <button
                onClick={() => fetchFingerprint(currentFinger.id)}
                disabled={isCapturing || isScanning}
                className="rounded-lg bg-green-600 px-8 py-3 text-xs sm:text-sm text-white font-semibold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
              >
                {isCapturing ? "Scanning..." : "Start"}
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-4 items-center justify-center">
            {isCaptured && (
              <>
                <button
                  onClick={() => resetForRecapture(currentFinger.id)}
                  disabled={isCapturing || isScanning}
                  className="rounded-md border border-gray-300 bg-white px-6 py-4 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Recapture
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-md bg-green-600 px-6 py-4 text-xs sm:text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  Enter NIN
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>

    <NinModal
      open={showModal}
      onClose={() => setShowModal(false)}
      onSubmit={handleSubmitEnrollment}
      loading={isSubmitting}
    />
    {isSubmitting && (
      <div className="fixed inset-0 z-[80] grid place-items-center bg-white/100 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-lg">
          <Loader />
          <p className="text-sm text-gray-600">Submitting…</p>
        </div>
      </div>
    )}

    <style>{`
      @keyframes scan {
        0% { top: 0; }
        50% { top: calc(100% - 4px); }
        100% { top: 0; }
      }
      .animate-scan { animation: scan 2s ease-in-out infinite; }
    `}</style>
  </div>
);


};

export default VerifyCapture;
