"use client";
import React, { useMemo, useState } from "react";
import { X, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { PiFingerprintBold } from "react-icons/pi";
import Header from "./Header";
import FaceCapture from "./FaceCapture";
import type { EnrollmentFormData } from "@/utils/types";
import Form from "./Form";
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

      if (!data.success)
        throw new Error(data.message || "Fingerprint capture failed");

      setTimeout(() => {
        // Clean the base64 string - remove whitespace, newlines, and any prefix
        let base64Data = data.slap_image_base64 || "";
        let mimeType = "image/png";

        // If it already has a data URL prefix, extract mime type and base64 part
        if (base64Data.startsWith("data:")) {
          const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          }
        }

        // Remove any whitespace or newlines
        base64Data = base64Data.replace(/\s/g, "");

        // Detect image format from base64 header bytes
        // PNG starts with: iVBORw0KGgo (89 50 4E 47)
        // BMP starts with: Qk (42 4D)
        // JPEG starts with: /9j/ (FF D8 FF)
        // GIF starts with: R0lGOD (47 49 46)
        if (base64Data.startsWith("Qk")) {
          mimeType = "image/bmp";
        } else if (
          base64Data.startsWith("/9j/") ||
          base64Data.startsWith("/9k/")
        ) {
          mimeType = "image/jpeg";
        } else if (base64Data.startsWith("R0lGOD")) {
          mimeType = "image/gif";
        } else if (base64Data.startsWith("iVBORw")) {
          mimeType = "image/png";
        }

        const ext = mimeType.split("/")[1] || "png";
        const imageName = `${batchId}_${Date.now()}.${ext}`;
        const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

        const file = base64ToFile(imageDataUrl, imageName, mimeType);

        setCapturedBatches((prev) => ({
          ...prev,
          [batchId]: {
            image: imageDataUrl,
            base64: base64Data,
            imageName: imageName,
            file,
          },
        }));

        // Update form with batch file using batch ID as field name
        setForm((f) => ({ ...f, [batchId]: file }));

        setIsScanning(false);
        setIsCapturing(false);
      }, 2000);
    } catch (e) {
      console.error("Error capturing fingerprint batch:", e);
      setIsCapturing(false);
      setIsScanning(false);
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

      // Clear the batch field in form
      setForm((f) => ({ ...f, [batchId]: null }));
    } catch (e) {
      console.error("Error deleting fingerprint batch:", e);
    }
  };

  const handleBatchSelect = (index: number) => {
    const batch = FINGER_BATCHES[index];
    setCurrentBatchIndex(index);

    // Only trigger capture if batch hasn't been captured yet and not currently capturing
    if (
      !capturedBatches[batch.id] &&
      !isCapturing &&
      step === Step.Fingerprints
    ) {
      void fetchFingerprintBatch(batch.id);
    }
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
      ).forEach((k) => {
        fd.append(k, String(form[k] ?? ""));
      });

      fd.append("height", String(Number(form.height || 0)));

      // Append biometric files
      (
        [
          "face_image",
          "left_four",
          "right_four",
          "thumbs",
        ] as (keyof EnrollmentFormData)[]
      ).forEach((k) => {
        const f = form[k] as unknown as File | null;
        if (f) fd.append(k, f, f.name || `${String(k)}.png`);
      });

      const resp = await fetch(`${API_URL}/api/enrollment/enroll`, {
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
      <div className="min-h-screen bg-gray-50">
        <Header currentStep={4} totalSteps={3} completedSteps={[1, 2, 3]} />
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center p-6">
          <div className="w-full rounded-lg bg-white p-8 text-center shadow">
            <h2 className="mb-2 text-2xl font-bold text-green-600">
              Enrollment Complete!
            </h2>
            <p className="text-gray-600">All data submitted successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  const completedSteps = [];
  if (step > Step.Fingerprints) completedSteps.push(Step.Fingerprints);
  if (step > Step.PersonalInfo) completedSteps.push(Step.PersonalInfo);
  if (step > Step.Face) completedSteps.push(Step.Face);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      <Header
        currentStep={step}
        totalSteps={3}
        completedSteps={completedSteps}
      />

      <main className="flex-1 overflow-auto lg:overflow-hidden">
        {step === Step.Fingerprints && (
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:h-full">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:h-full">
              {/* Left panel - Batch List */}
              <div className="min-h-[520px] rounded-lg bg-white p-6 shadow-lg overflow-visible lg:overflow-hidden flex flex-col lg:h-full">
                <div className="mb-3 flex items-center justify-between shrink-0">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Capture Stages
                  </h3>
                  <div className="rounded-full bg-white px-4 py-1.5 shadow">
                    <span className="text-xs font-medium text-gray-700">
                      {capturedCount}/{FINGER_BATCHES.length} Complete
                    </span>
                  </div>
                </div>

                <div className="flex-1 pr-1 space-y-3 overflow-visible lg:overflow-y-auto">
                  {FINGER_BATCHES.map((batch, index) => (
                    <button
                      key={batch.id}
                      onClick={() => handleBatchSelect(index)}
                      className={`flex w-full items-start justify-between rounded-lg p-4 transition-all ${
                        currentBatchIndex === index
                          ? "border-2 border-green-600 bg-green-50"
                          : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
                      }`}
                      aria-current={currentBatchIndex === index}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
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
                          <p className="text-sm font-semibold text-gray-800 mb-1">
                            {batch.name}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {batch.fingerNames.map((name, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 text-navy-blue px-2 py-0.5 rounded"
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

              {/* Right panel - Capture Area */}
              <div className="rounded-lg bg-white p-6 shadow-lg lg:col-span-2 flex flex-col lg:h-full">
                <div className="mb-4">
                  <h2 className="mb-2 text-2xl font-bold text-gray-800">
                    {currentBatch.name}
                  </h2>
                  <p className="text-gray-600 mb-3">
                    {capturedBatches[currentBatch.id]
                      ? "Fingerprints captured successfully. You can recapture or proceed to the next stage."
                      : currentBatch.instruction}
                  </p>

                  {/* Visual finger indicators */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {currentBatch.hand === "both" ? (
                      <></>
                    ) : (
                      <div className="flex flex-col items-center gap-1"></div>
                    )}
                  </div>
                </div>

                {/* Capture box */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-[400px] max-w-[90vw] overflow-hidden rounded-2xl border-4 border-green-600 bg-gray-900 h-[480px] lg:h-[56vh] lg:max-h-[32rem] shadow-xl">
                      {capturedBatches[currentBatch.id] && !isScanning ? (
                        <div className="relative h-full w-full flex items-center justify-center bg-gray-900 p-2">
                          <img
                            src={capturedBatches[currentBatch.id]!.image}
                            alt={currentBatch.name}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                          <button
                            onClick={() =>
                              deleteFingerprintBatch(currentBatch.id)
                            }
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-2.5 shadow-lg transition-all hover:bg-red-600 hover:scale-110"
                            aria-label="Delete fingerprints"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ) : isScanning ? (
                        <div className="relative flex h-full w-full flex-col items-center justify-center bg-gray-900">
                          <div className="animate-scan absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)]" />
                          <div className="flex gap-4 mb-4">
                            {currentBatch.fingers.map((_, idx) => (
                              <PiFingerprintBold
                                key={idx}
                                className="h-16 w-16 animate-pulse text-green-500 drop-shadow-lg"
                                style={{ animationDelay: `${idx * 0.15}s` }}
                              />
                            ))}
                          </div>
                          <p className="text-green-400 font-semibold text-lg animate-pulse">
                            Scanning...
                          </p>
                        </div>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-200">
                          <div className="flex gap-4 mb-4">
                            {currentBatch.fingers.map((_, idx) => (
                              <PiFingerprintBold
                                key={idx}
                                className="h-20 w-20 text-gray-600"
                              />
                            ))}
                          </div>
                          <p className="text-gray-500 text-sm">
                            Waiting for scanner...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 md:mt-8 pt-4 flex items-start justify-between gap-4">
                  <button
                    onClick={handlePrevBatch}
                    disabled={currentBatchIndex === 0}
                    className="flex items-center gap-2 rounded-lg bg-gray-200 px-5 py-3 text-gray-800 font-medium transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex flex-col items-center gap-2">
                    {capturedBatches[currentBatch.id] && (
                      <>
                        <button
                          onClick={() => fetchFingerprintBatch(currentBatch.id)}
                          disabled={isCapturing}
                          className="rounded-lg bg-yellow-500 px-6 py-3 font-medium text-white transition-colors hover:bg-yellow-600 disabled:opacity-50"
                        >
                          Recapture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedBatches({});
                            setCurrentBatchIndex(0);
                            setForm((f) => ({
                              ...f,
                              left_four: null,
                              right_four: null,
                              thumbs: null,
                            }));
                          }}
                          className="px-4 py-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                          Reset All Captures
                        </button>
                      </>
                    )}
                  </div>

                  {currentBatchIndex < FINGER_BATCHES.length - 1 ? (
                    <button
                      onClick={handleNextBatch}
                      disabled={!capturedBatches[currentBatch.id]}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={goToPersonalInfo}
                      disabled={!allBatchesCaptured}
                      className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === Step.PersonalInfo && (
          <Form
            form={form}
            errors={errors}
            setForm={setForm}
            onBack={goBackToFingerprints}
            onSubmit={goToFace}
          />
        )}

        {step === Step.Face && (
          <div className="mx-auto max-w-5xl p-4 md:p-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <FaceCapture
                isSubmitting={isSubmitting}
                onBack={() => setStep(Step.PersonalInfo)}
                onComplete={(file) => {
                  // Submit immediately with face image
                  setIsSubmitting(true);
                  (async () => {
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
                      ).forEach((k) => {
                        fd.append(k, String(form[k] ?? ""));
                      });

                      fd.append("height", String(Number(form.height || 0)));

                      // Append face image
                      if (file)
                        fd.append("face_image", file, file.name || "face.png");

                      // Append fingerprint files
                      const leftFourFile =
                        form.left_four as unknown as File | null;
                      if (leftFourFile)
                        fd.append(
                          "left_four",
                          leftFourFile,
                          leftFourFile.name || "left_four.png"
                        );

                      const rightFourFile =
                        form.right_four as unknown as File | null;
                      if (rightFourFile)
                        fd.append(
                          "right_four",
                          rightFourFile,
                          rightFourFile.name || "right_four.png"
                        );

                      const thumbsFile = form.thumbs as unknown as File | null;
                      if (thumbsFile)
                        fd.append(
                          "thumbs",
                          thumbsFile,
                          thumbsFile.name || "thumbs.png"
                        );

                      const resp = await fetch(
                        `${API_URL}/api/enrollment/enroll`,
                        {
                          method: "POST",
                          body: fd,
                        }
                      );

                      if (!resp.ok) {
                        let msg = `HTTP ${resp.status}`;
                        try {
                          const data = await resp.json();
                          msg = (data?.message ||
                            data?.detail ||
                            msg) as string;
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
                      setIsSubmitting(false);
                    }
                  })();
                }}
              />
            </div>
          </div>
        )}
      </main>

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
          50% { top: calc(100% - 8px); }
          100% { top: 0; }
        }
        .animate-scan { animation: scan 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default FingerPrintCapture;
