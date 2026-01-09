"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Fingerprint as FingerprintIcon,
  X,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Hand,
} from "lucide-react";
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
    instruction: "Place your RIGHT Index, Middle, Ring, and Pinky fingers on the scanner",
    fingers: ["R2", "R3", "R4", "R5"],
    fingerNames: ["Index", "Middle", "Ring", "Pinky"],
    fullNames: ["Right Index", "Right Middle", "Right Ring", "Right Pinky"],
  },
  {
    id: "left_four",
    name: "Left Four Fingers",
    hand: "left",
    instruction: "Place your LEFT Index, Middle, Ring, and Pinky fingers on the scanner",
    fingers: ["L2", "L3", "L4", "L5"],
    fingerNames: ["Index", "Middle", "Ring", "Pinky"],
    fullNames: ["Left Index", "Left Middle", "Left Ring", "Left Pinky"],
  },
  {
    id: "thumbs",
    name: "Both Thumbs",
    hand: "both",
    instruction: "Place BOTH thumbs on the scanner",
    fingers: ["R1", "L1"],
    fingerNames: ["Right Thumb", "Left Thumb"],
    fullNames: ["Right Thumb", "Left Thumb"],
  },
] as const;

type FingerId = "L1" | "L2" | "L3" | "L4" | "L5" | "R1" | "R2" | "R3" | "R4" | "R5";
type BatchId = "right_four" | "left_four" | "thumbs";

type FingerprintBatchData = {
  image: string;
  base64: string;
  imageName: string;
  file?: File;
};

const PY_URL = process.env.NEXT_PUBLIC_PYTHON_URL ?? "";
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const FINGER_FIELD_MAP: Record<FingerId, keyof EnrollmentFormData> = {
  L1: "left_thumb",
  L2: "left_index",
  L3: "left_middle",
  L4: "left_ring",
  L5: "left_little",
  R1: "right_thumb",
  R2: "right_index",
  R3: "right_middle",
  R4: "right_ring",
  R5: "right_little",
};

function base64ToFile(base64: string, fileName: string, fallbackType = "image/png"): File {
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
  return new File([bytes], fileName || `finger-${Date.now()}.png`, { type: mime });
}

enum Step {
  Fingerprints = 1,
  PersonalInfo = 2,
  Face = 3,
}

const initialForm: EnrollmentFormData = {
  nin: "",
  cidstr: "",
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

const FingerPrintCapture: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.Fingerprints);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
  const [capturedBatches, setCapturedBatches] = useState<
    Partial<Record<BatchId, FingerprintBatchData>>
  >({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const [form, setForm] = useState<EnrollmentFormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof EnrollmentFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitDone, setSubmitDone] = useState<boolean>(false);

  const currentBatch = FINGER_BATCHES[currentBatchIndex];
  const capturedCount = useMemo(() => Object.keys(capturedBatches).length, [capturedBatches]);
  const allBatchesCaptured = capturedCount === FINGER_BATCHES.length;

  const fetchFingerprintBatch = async (batchId: BatchId) => {
    try {
      setIsCapturing(true);
      const res = await fetch(`${PY_URL}/scan-fingerprint-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_type: batchId }),
      });
      
      if (!res.ok) throw new Error("Failed to scan fingerprint batch");

      const data: { image: string; base64: string; imageName: string } = await res.json();
      setIsScanning(true);
      
      setTimeout(() => {
        const file = base64ToFile(data.base64, data.imageName, "image/png");
        setCapturedBatches((prev) => ({
          ...prev,
          [batchId]: {
            image: `${PY_URL}/${data.image}`,
            base64: data.base64,
            imageName: data.imageName,
            file,
          },
        }));
        
        const batch = FINGER_BATCHES.find(b => b.id === batchId);
        if (batch) {
          const updates: any = {};
          batch.fingers.forEach((fingerId) => {
            const field = FINGER_FIELD_MAP[fingerId];
            updates[field] = file;
          });
          setForm((f) => ({ ...f, ...updates }));
        }
        
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
      
      const batch = FINGER_BATCHES.find(b => b.id === batchId);
      if (batch) {
        const updates: any = {};
        batch.fingers.forEach((fingerId) => {
          const field = FINGER_FIELD_MAP[fingerId];
          updates[field] = null;
        });
        setForm((f) => ({ ...f, ...updates }));
      }
    } catch (e) {
      console.error("Error deleting fingerprint batch:", e);
    }
  };

  useEffect(() => {
    const id = currentBatch.id;
    if (!capturedBatches[id] && !isCapturing && step === Step.Fingerprints) {
      void fetchFingerprintBatch(id);
    }
  }, [currentBatchIndex, step]); // eslint-disable-line

  const handleNextBatch = () => {
    if (currentBatchIndex < FINGER_BATCHES.length - 1) setCurrentBatchIndex((i) => i + 1);
  };
  
  const handlePrevBatch = () => {
    if (currentBatchIndex > 0) setCurrentBatchIndex((i) => i - 1);
  };

  const goToPersonalInfo = () => {
    if (!allBatchesCaptured) return;
    setStep(Step.PersonalInfo);
  };
  
  const goBackToFingerprints = () => setStep(Step.Fingerprints);

  const validatePersonalInfo = () => {
    const e: Partial<Record<keyof EnrollmentFormData, string>> = {};
    const required: (keyof EnrollmentFormData)[] = [
      "nin","cidstr","title","surname","first_name","middle_name",
      "birth_date","birth_state","birth_lga","nationality","gender",
      "email_address","telephone_no","address_line_one","address_line_two",
      "r_lga","r_state","town",
    ];
    
    required.forEach((k) => {
      const val = form[k] as unknown as string;
      if (!val || String(val).trim() === "") e[k] = "Required";
    });
    
    if (!/^\d{11}$/.test(form.nin)) e.nin = "NIN must be 11 digits";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_address)) e.email_address = "Invalid email";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date)) e.birth_date = "Use YYYY-MM-DD";
    if (!form.height || Number(form.height) <= 0) e.height = "Enter height in meters";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  
  const goToFace = () => {
    if (validatePersonalInfo()) setStep(Step.Face);
  };

  const handleSubmitEnrollment = async () => {
    const fingerKeys: (keyof EnrollmentFormData)[] = [
      "right_thumb","right_index","right_middle","right_ring","right_little",
      "left_thumb","left_index","left_middle","left_ring","left_little",
    ];
    
    const missing = fingerKeys.find((k) => !form[k]);
    if (missing) {
      alert(`Missing fingerprint: ${String(missing).replaceAll("_", " ")}`);
      setStep(Step.Fingerprints);
      return;
    }
    
    if (!form.face_image) {
      alert("Please capture face image");
      setStep(Step.Face);
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();

      ([
        "nin","cidstr","title","surname","first_name","middle_name",
        "birth_date","birth_state","birth_lga","nationality","gender",
        "email_address","telephone_no","address_line_one","address_line_two",
        "r_lga","r_state","town",
      ] as (keyof EnrollmentFormData)[]).forEach((k) => {
        fd.append(k, String(form[k] ?? ""));
      });
      
      fd.append("height", String(Number(form.height || 0)));

      ([
        "face_image",
        "right_thumb","right_index","right_middle","right_ring","right_little",
        "left_thumb","left_index","left_middle","left_ring","left_little",
      ] as (keyof EnrollmentFormData)[]).forEach((k) => {
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
      alert(`Failed to submit enrollment: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitDone) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentStep={3} totalSteps={3} />
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center p-6">
          <div className="w-full rounded-lg bg-white p-8 text-center shadow">
            <h2 className="mb-2 text-2xl font-bold text-green-600">Enrollment Complete!</h2>
            <p className="text-gray-600">All data submitted successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      <Header currentStep={step} totalSteps={3} />

      <main className="flex-1 overflow-auto lg:overflow-hidden">
        {step === Step.Fingerprints && (
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:h-full">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:h-full">
              {/* Left panel - Batch List */}
              <div className="min-h-[520px] rounded-lg bg-white p-6 shadow-lg overflow-visible lg:overflow-hidden flex flex-col lg:h-full">
                <div className="mb-3 flex items-center justify-between shrink-0">
                  <h3 className="text-xl font-semibold text-gray-800">Capture Stages</h3>
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
                      onClick={() => setCurrentBatchIndex(index)}
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
                            capturedBatches[batch.id] ? "bg-green-600" : "bg-gray-300"
                          }`}
                        >
                          {capturedBatches[batch.id] ? (
                            <CheckCircle className="h-6 w-6 text-white" />
                          ) : (
                            <span className="text-sm font-bold text-white">{index + 1}</span>
                          )}
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-semibold text-gray-800 mb-1">{batch.name}</p>
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
                  <h2 className="mb-2 text-2xl font-bold text-gray-800">{currentBatch.name}</h2>
                  <p className="text-gray-600 mb-3">
                    {capturedBatches[currentBatch.id]
                      ? "Fingerprints captured successfully. You can recapture or proceed to the next stage."
                      : currentBatch.instruction}
                  </p>
                  
                  {/* Visual finger indicators */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {currentBatch.hand === "both" ? (
                      <>
                  
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                      </div>
                    )}
                  </div>
                </div>

                {/* Capture box */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-80 overflow-hidden rounded-xl border-4 border-gray-300 bg-gray-50 h-[420px] lg:h-[52vh] lg:max-h-[28rem] shadow-inner">
                      {capturedBatches[currentBatch.id] && !isScanning ? (
                        <div className="relative h-full w-full">
                          <img
                            src={capturedBatches[currentBatch.id]!.image}
                            alt={currentBatch.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => deleteFingerprintBatch(currentBatch.id)}
                            className="absolute -right-3 -top-3 rounded-full bg-red-500 p-2.5 shadow-lg transition-all hover:bg-red-600 hover:scale-110"
                            aria-label="Delete fingerprints"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ) : isScanning ? (
                        <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-green-400/40 to-green-600/40">
                          <div className="animate-scan absolute left-0 right-0 h-2 bg-green-600 shadow-lg" />
                          <div className="flex gap-3 mb-4">
                            {currentBatch.fingers.map((_, idx) => (
                              <PiFingerprintBold
                                key={idx} 
                                className="h-16 w-16 animate-pulse text-white drop-shadow-lg" 
                                style={{ animationDelay: `${idx * 0.2}s` }}
                              />
                            ))}
                          </div>
                          <p className="text-white font-semibold text-lg animate-pulse">Scanning...</p>
                        </div>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center">
                          <div className="flex gap-4 mb-4">
                            {currentBatch.fingers.map((_, idx) => (
                              <PiFingerprintBold
                                key={idx} 
                                className="h-20 w-20 text-gray-300" 
                              />
                            ))}
                          </div>
                         
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
                  setForm((f) => ({ ...f, face_image: file }));
                  void handleSubmitEnrollment();
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
            <p className="text-base font-medium text-gray-700">Submitting enrollment…</p>
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