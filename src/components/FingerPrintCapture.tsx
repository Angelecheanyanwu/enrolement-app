"use client";

import type { EnrollmentFormData } from "@/utils/types";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Home,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { PiFingerprintBold } from "react-icons/pi";
import FaceCapture from "./FaceCapture";
import Form from "./Form";
import Header from "./Header";

const FINGER_BATCHES = [
  {
    id: "right_four",
    name: "Right Four Fingers",
    hand: "right",
    instruction:
      "Place your RIGHT Index, Middle, Ring, and Pinky fingers on the scanner",
    fingers: ["R2", "R3", "R4", "R5"],
    fingerNames: ["Index", "Middle", "Ring", "Pinky"],
    fullNames: ["Right Index", "Right Middle", "Right Ring", "Right Pinky"],
  },
  {
    id: "left_four",
    name: "Left Four Fingers",
    hand: "left",
    instruction:
      "Place your LEFT Pinky, Middle, Ring, and Index fingers on the scanner",
    fingers: ["L5", "L4", "L3", "L2"],
    fingerNames: ["Pinky", "Ring", "Middle", "Index"],
    fullNames: ["Left Pinky", "Left Ring", "Left Middle", "Left Index"],
  },
  {
    id: "thumbs",
    name: "Both Thumbs",
    hand: "both",
    instruction: "Place BOTH thumbs on the scanner",
    fingers: ["L1", "R1"],
    fingerNames: ["Left Thumb", "Right Thumb"],
    fullNames: ["Left Thumb", "Right Thumb"],
  },
] as const;

type BatchId = "right_four" | "left_four" | "thumbs";

type FingerprintBatchData = {
  image: string;
  base64: string;
  imageName: string;
  file?: File;
};

const PY_URL = process.env.NEXT_PUBLIC_PYTHON_URL ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const BATCH_ENDPOINT_MAP: Record<BatchId, string> = {
  right_four: "/api/enrollment/four-fingers-right",
  left_four: "/api/enrollment/four-fingers-left",
  thumbs: "/api/enrollment/two-thumbs",
};

function base64ToFile(
  base64: string,
  fileName: string,
  fallbackType = "image/png"
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

enum Step {
  Fingerprints = 1,
  PersonalInfo = 2,
  Face = 3,
}

const initialForm: EnrollmentFormData = {
  nin: "",
  title: "",
  surname: "",
  first_name: "",
  middle_name: "",
  birth_date: "",
  birth_state: "",
  birth_lga: "",
  nationality: "",
  gender: "M",
  email_address: "",
  telephone_no: "",
  address_line_one: "",
  address_line_two: "",
  r_lga: "",
  r_state: "",
  town: "",
  height: 0,
  face_image: null,
  left_four: null,
  right_four: null,
  thumbs: null,
};

const FingerPrintCapture: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [step, setStep] = useState<Step>(Step.Fingerprints);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
  const [capturedBatches, setCapturedBatches] = useState<
    Partial<Record<BatchId, FingerprintBatchData>>
  >({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const [form, setForm] = useState<EnrollmentFormData>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof EnrollmentFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitDone, setSubmitDone] = useState<boolean>(false);

  const [sessionUserId] = useState<string>(
    () => `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  );

  const currentBatch = FINGER_BATCHES[currentBatchIndex];

  const capturedCount = useMemo(
    () => Object.keys(capturedBatches).length,
    [capturedBatches]
  );

  const allBatchesCaptured = capturedCount === FINGER_BATCHES.length;

  const pageTitle =
    step === Step.Fingerprints
      ? "Fingerprint Enrollment"
      : step === Step.PersonalInfo
      ? "Personal Information"
      : "Face Capture";

  const fetchFingerprintBatch = async (batchId: BatchId) => {
    try {
      setIsCapturing(true);
      setIsScanning(true);

      const endpoint = BATCH_ENDPOINT_MAP[batchId];
      const res = await fetch(`${PY_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: sessionUserId,
          timeout_ms: 15000,
        }),
      });

      if (!res.ok) throw new Error("Failed to scan fingerprint batch");

      const data: {
        success: boolean;
        message: string;
        slap_image_base64: string;
        capture_type: string;
        num_fingers: number;
        user_id: string;
      } = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Fingerprint capture failed");
      }

      setTimeout(() => {
        let base64Data = data.slap_image_base64 || "";
        let mimeType = "image/png";

        if (base64Data.startsWith("data:")) {
          const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }

        base64Data = base64Data.replace(/\s/g, "");

        if (base64Data.startsWith("Qk")) mimeType = "image/bmp";
        else if (base64Data.startsWith("/9j/") || base64Data.startsWith("/9k/"))
          mimeType = "image/jpeg";
        else if (base64Data.startsWith("R0lGOD")) mimeType = "image/gif";
        else if (base64Data.startsWith("iVBORw")) mimeType = "image/png";

        const ext = mimeType.split("/")[1] || "png";
        const imageName = `${batchId}_${Date.now()}.${ext}`;
        const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

        const file = base64ToFile(imageDataUrl, imageName, mimeType);

        setCapturedBatches((prev) => ({
          ...prev,
          [batchId]: {
            image: imageDataUrl,
            base64: base64Data,
            imageName,
            file,
          },
        }));

        setForm((f) => ({ ...f, [batchId]: file }));

        setIsScanning(false);
        setIsCapturing(false);
      }, 2000);
    } catch (e) {
      console.error("Error capturing fingerprint batch:", e);
      setIsCapturing(false);
      setIsScanning(false);
      alert(
        `Failed to scan fingerprint batch: ${
          e instanceof Error ? e.message : "Unknown error"
        }`
      );
    }
  };

  const deleteFingerprintBatch = async (batchId: BatchId) => {
    const batchData = capturedBatches[batchId];
    if (!batchData) return;

    try {
      await fetch(`${PY_URL}/delete-fingerprint`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: batchData.imageName,
      });

      setCapturedBatches((prev) => {
        const copy = { ...prev };
        delete copy[batchId];
        return copy;
      });

      setForm((f) => ({ ...f, [batchId]: null }));
    } catch (e) {
      console.error("Error deleting fingerprint batch:", e);
    }
  };

  // ✅ NO AUTO-SCAN: selecting just changes stage
  const handleBatchSelect = (index: number) => {
    setCurrentBatchIndex(index);
  };

  const handleNextBatch = () => {
    if (currentBatchIndex < FINGER_BATCHES.length - 1) {
      handleBatchSelect(currentBatchIndex + 1);
    }
  };

  const handlePrevBatch = () => {
    if (currentBatchIndex > 0) {
      handleBatchSelect(currentBatchIndex - 1);
    }
  };

  const goToPersonalInfo = () => {
    if (!allBatchesCaptured) return;
    setStep(Step.PersonalInfo);
  };

  const goBackToFingerprints = () => setStep(Step.Fingerprints);

  const validatePersonalInfo = () => {
    const e: Partial<Record<keyof EnrollmentFormData, string>> = {};
    const required: (keyof EnrollmentFormData)[] = [
      "nin",
      "title",
      "surname",
      "first_name",
      "middle_name",
      "birth_date",
      "birth_state",
      "birth_lga",
      "nationality",
      "gender",
      "email_address",
      "telephone_no",
      "address_line_one",
      "address_line_two",
      "r_lga",
      "r_state",
      "town",
    ];

    required.forEach((k) => {
      const val = form[k] as unknown as string;
      if (!val || String(val).trim() === "") e[k] = "Required";
    });

    if (!/^\d{11}$/.test(form.nin)) e.nin = "NIN must be 11 digits";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_address))
      e.email_address = "Invalid email";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date))
      e.birth_date = "Use YYYY-MM-DD";
    if (!form.height || Number(form.height) <= 0)
      e.height = "Enter height in meters";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToFace = () => {
    if (validatePersonalInfo()) setStep(Step.Face);
  };

  const handleSubmitEnrollment = async () => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();

      (
        [
          "nin",
          "title",
          "surname",
          "first_name",
          "middle_name",
          "birth_date",
          "birth_state",
          "birth_lga",
          "nationality",
          "gender",
          "email_address",
          "telephone_no",
          "address_line_one",
          "address_line_two",
          "r_lga",
          "r_state",
          "town",
        ] as (keyof EnrollmentFormData)[]
      ).forEach((k) => fd.append(k, String(form[k] ?? "")));

      fd.append("height", String(Number(form.height || 0)));

      (["face_image", "left_four", "right_four", "thumbs"] as (
        | keyof EnrollmentFormData
      )[]).forEach((k) => {
        const f = form[k] as unknown as File | null;
        if (f) fd.append(k, f, f.name || `${String(k)}.png`);
      });

      const resp = await fetch(`${API_URL}/enroll`, {
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

      setSubmitDone(true);
    } catch (err) {
      console.error("Enrollment failed:", err);
      alert(
        `Failed to submit enrollment: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col">
        <Header currentStep={4} totalSteps={3} completedSteps={[1, 2, 3]} />
        <main className="flex-1 grid place-items-center px-4 py-6">
          <div className="w-full max-w-3xl">
            <div className="w-full rounded-lg bg-white p-8 text-center shadow">
              <h2 className="mb-2 text-2xl font-bold text-green-600">
                Enrollment Complete!
              </h2>
              <p className="text-gray-600">All data submitted successfully.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const completedSteps: Step[] = [];
  if (step > Step.Fingerprints) completedSteps.push(Step.Fingerprints);
  if (step > Step.PersonalInfo) completedSteps.push(Step.PersonalInfo);
  if (step > Step.Face) completedSteps.push(Step.Face);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      <Header
        currentStep={step}
        totalSteps={3}
        completedSteps={completedSteps}
        pageTitle={pageTitle}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="flex-1 grid place-items-center px-4 py-6 overflow-auto">
        <div className="w-full">
          {step === Step.Fingerprints && (
            <div className="w-full max-w-7xl mx-auto">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                {/* LEFT */}
                <div className="rounded-lg bg-white p-4 sm:p-5 lg:p-6 shadow-lg overflow-visible lg:overflow-hidden flex flex-col lg:h-full">
                  <div className="mb-3 flex items-center justify-between shrink-0 gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                      Capture Stages
                    </h3>
                    <div className="rounded-full bg-white px-3 sm:px-4 py-1 shadow">
                      <span className="text-[11px] sm:text-xs font-medium text-gray-700">
                        {capturedCount}/{FINGER_BATCHES.length} Complete
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 pr-1 space-y-3 overflow-visible lg:overflow-y-auto">
                    {FINGER_BATCHES.map((batch, index) => (
                      <button
                        key={batch.id}
                        onClick={() => handleBatchSelect(index)}
                        className={`flex w-full items-start justify-between rounded-lg p-3 sm:p-4 transition-all ${
                          currentBatchIndex === index
                            ? "border-2 border-green-600 bg-green-50"
                            : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
                        }`}
                        aria-current={currentBatchIndex === index}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${
                              capturedBatches[batch.id]
                                ? "bg-green-600"
                                : "bg-gray-300"
                            }`}
                          >
                            {capturedBatches[batch.id] ? (
                              <CheckCircle className="h-6 w-6 text-white" />
                            ) : (
                              <span className="text-sm font-bold text-white">
                                {index + 1}
                              </span>
                            )}
                          </div>

                          <div className="text-left flex-1">
                            <p className="text-[13px] sm:text-sm font-semibold text-gray-800 mb-1">
                              {batch.name}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {batch.fingerNames.map((name, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] sm:text-xs bg-blue-100 text-navy-blue px-2 py-0.5 rounded"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* RIGHT */}
                <div className="rounded-lg bg-white p-4 sm:p-5 lg:p-6 shadow-lg lg:col-span-2 flex flex-col">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="mb-2 text-lg sm:text-xl font-bold text-gray-800">
                        {currentBatch.name}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 mb-3">
                        {capturedBatches[currentBatch.id]
                          ? "Fingerprints captured successfully. You can recapture or proceed to the next stage."
                          : currentBatch.instruction}
                      </p>
                    </div>

                    {capturedBatches[currentBatch.id] && (
                      <div className="rounded-full bg-green-100 px-4 py-1 shadow shrink-0">
                        <span className="text-xs font-medium text-green-700 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Captured
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="
                          w-[92vw] sm:w-[420px] lg:w-[520px]
                          max-w-full
                          overflow-hidden rounded-2xl
                          border-4 border-gray-300
                          bg-gray-50
                          h-[320px] sm:h-[420px] lg:h-[56vh] lg:max-h-[32rem]
                          shadow-xl
                          flex items-center justify-center
                        "
                      >
                        {capturedBatches[currentBatch.id] && !isScanning ? (
                          <div className="relative h-full w-full flex items-center justify-center bg-white p-2">
                            <img
                              src={capturedBatches[currentBatch.id]!.image}
                              alt={currentBatch.name}
                              className="max-h-full max-w-full object-contain rounded-lg"
                            />
         
                          </div>
                            ) : isScanning ? (
                            <div className="relative flex h-full w-full flex-col items-center justify-center bg-green-500/50">
                              <div className="animate-scan absolute left-0 right-0 h-1 bg-green-600" />

                          
                              <div className="flex gap-3 sm:gap-4 mb-4">
                                {currentBatch.fingers.map((_, idx) => (
                                  <PiFingerprintBold
                                    key={idx}
                                    className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 animate-pulse text-white"
                                    style={{ animationDelay: `${idx * 0.15}s` }}
                                  />
                                ))}
                              </div>

                              <p className="text-white font-semibold text-base sm:text-lg animate-pulse">
                                Scanning...
                              </p>
                            </div>
                          )
                         : (
                          <div className="flex h-full w-full items-center justify-center">
                            <PiFingerprintBold className="h-32 w-32 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {!capturedBatches[currentBatch.id] && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => fetchFingerprintBatch(currentBatch.id)}
                        disabled={isCapturing || isScanning}
                        className="rounded-lg bg-green-600 px-8 py-3 text-xs sm:text-sm text-white font-semibold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {isCapturing || isScanning ? "Scanning..." : "Start"}
                      </button>
                    </div>
                  )}

                  {capturedBatches[currentBatch.id] && (
                    <div className="mt-4 sm:mt-6 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <button
                        onClick={handlePrevBatch}
                        disabled={currentBatchIndex === 0}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 sm:px-5 py-2.5 sm:py-3 text-gray-800 font-medium transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </button>

                      <div className="w-full sm:w-auto flex flex-col items-center gap-2">
                        <button
                          onClick={() => fetchFingerprintBatch(currentBatch.id)}
                          disabled={isCapturing || isScanning}
                          className="w-full sm:w-auto rounded-lg bg-gray-600 px-5 sm:px-6 py-2.5 sm:py-3 font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                        >
                          Recapture
                        </button>
                      </div>

                      {currentBatchIndex < FINGER_BATCHES.length - 1 ? (
                        <button
                          onClick={handleNextBatch}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 sm:px-6 py-2.5 sm:py-3 font-semibold text-white transition-colors hover:bg-green-700"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={goToPersonalInfo}
                          disabled={!allBatchesCaptured}
                          className="w-full sm:w-auto rounded-lg bg-green-600 px-6 sm:px-8 py-2.5 sm:py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === Step.PersonalInfo && (
            <div className="w-full max-w-5xl mx-auto">
              <Form
                form={form}
                errors={errors}
                setForm={setForm}
                onBack={goBackToFingerprints}
                onSubmit={goToFace}
              />
            </div>
          )}

          {step === Step.Face && (
            <div className="w-full max-w-5xl mx-auto p-4 md:p-6">
              <div className="rounded-lg bg-white p-6 shadow">
                <FaceCapture
                  isSubmitting={isSubmitting}
                  onBack={() => setStep(Step.PersonalInfo)}
                  onComplete={async (file) => {
                    setIsSubmitting(true);
                    try {
                      const fd = new FormData();

                      (
                        [
                          "nin",
                          "title",
                          "surname",
                          "first_name",
                          "middle_name",
                          "birth_date",
                          "birth_state",
                          "birth_lga",
                          "nationality",
                          "gender",
                          "email_address",
                          "telephone_no",
                          "address_line_one",
                          "address_line_two",
                          "r_lga",
                          "r_state",
                          "town",
                        ] as (keyof EnrollmentFormData)[]
                      ).forEach((k) => fd.append(k, String(form[k] ?? "")));

                      fd.append("height", String(Number(form.height || 0)));

                      if (file) fd.append("face_image", file, file.name || "face.png");

                      const leftFourFile = form.left_four as unknown as File | null;
                      if (leftFourFile)
                        fd.append("left_four", leftFourFile, leftFourFile.name || "left_four.png");

                      const rightFourFile = form.right_four as unknown as File | null;
                      if (rightFourFile)
                        fd.append("right_four", rightFourFile, rightFourFile.name || "right_four.png");

                      const thumbsFile = form.thumbs as unknown as File | null;
                      if (thumbsFile)
                        fd.append("thumbs", thumbsFile, thumbsFile.name || "thumbs.png");

                      const resp = await fetch(`${API_URL}/enroll`, {
                        method: "POST",
                        body: fd,
                      });

                      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

                      setSubmitDone(true);
                    } catch (err) {
                      console.error("Enrollment failed:", err);
                      alert("Enrollment failed.");
                      setIsSubmitting(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[80]">
          <button
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-800">Menu</p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            <nav className="p-3 space-y-1">
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Home className="h-5 w-5" />
                Home
              </Link>

              <Link
                href="/verify"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ShieldCheck className="h-5 w-5" />
                Verification
              </Link>
            </nav>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-2xl">
            <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-green-600" />
            <p className="text-base font-medium text-gray-700">
              Submitting enrollment…
            </p>
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

export default FingerPrintCapture;
