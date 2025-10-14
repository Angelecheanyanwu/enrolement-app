"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Fingerprint as FingerprintIcon,
  X,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Header from "./Header";
import FaceCapture from "./FaceCapture";
import type { EnrollmentFormData } from "@/utils/types";
import Form from "./Form";

const FINGERS = [
  { id: "L1", name: "Left Thumb", hand: "left" },
  { id: "L2", name: "Left Index", hand: "left" },
  { id: "L3", name: "Left Middle", hand: "left" },
  { id: "L4", name: "Left Ring", hand: "left" },
  { id: "L5", name: "Left Pinky", hand: "left" },
  { id: "R1", name: "Right Thumb", hand: "right" },
  { id: "R2", name: "Right Index", hand: "right" },
  { id: "R3", name: "Right Middle", hand: "right" },
  { id: "R4", name: "Right Ring", hand: "right" },
  { id: "R5", name: "Right Pinky", hand: "right" },
] as const;

type Finger = (typeof FINGERS)[number];
type FingerId = Finger["id"];

type FingerprintData = {
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

  const [currentFingerIndex, setCurrentFingerIndex] = useState<number>(0);
  const [capturedFingers, setCapturedFingers] = useState<
    Partial<Record<FingerId, FingerprintData>>
  >({});
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const [form, setForm] = useState<EnrollmentFormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof EnrollmentFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitDone, setSubmitDone] = useState<boolean>(false);

  const currentFinger = FINGERS[currentFingerIndex];
  const capturedCount = useMemo(() => Object.keys(capturedFingers).length, [capturedFingers]);
  const allFingersCaptured = capturedCount === FINGERS.length;

  const fetchFingerprint = async (fingerId: FingerId) => {
    try {
      setIsCapturing(true);
      const res = await fetch(`${PY_URL}/scan-fingerprint2`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to scan fingerprint");

      const data: { image: string; base64: string; imageName: string } = await res.json();
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
    } catch (e) {
      console.error("Error deleting fingerprint:", e);
    }
  };

  useEffect(() => {
    const id = currentFinger.id;
    if (!capturedFingers[id] && !isCapturing && step === Step.Fingerprints) {
      void fetchFingerprint(id);
    }
  }, [currentFingerIndex, step]); // eslint-disable-line

  const handleNextFinger = () => {
    if (currentFingerIndex < FINGERS.length - 1) setCurrentFingerIndex((i) => i + 1);
  };
  const handlePrevFinger = () => {
    if (currentFingerIndex > 0) setCurrentFingerIndex((i) => i - 1);
  };

  const goToPersonalInfo = () => {
    if (!allFingersCaptured) return;
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
  // Ensure all ten prints + face exist before sending
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

    // Scalars (all required by the API)
    ([
      "nin","cidstr","title","surname","first_name","middle_name",
      "birth_date","birth_state","birth_lga","nationality","gender",
      "email_address","telephone_no","address_line_one","address_line_two",
      "r_lga","r_state","town",
    ] as (keyof EnrollmentFormData)[]).forEach((k) => {
      fd.append(k, String(form[k] ?? ""));
    });
    fd.append("height", String(Number(form.height || 0)));

    // Files (face + all 10 fingers)
    ([
      "face_image",
      "right_thumb","right_index","right_middle","right_ring","right_little",
      "left_thumb","left_index","left_middle","left_ring","left_little",
    ] as (keyof EnrollmentFormData)[]).forEach((k) => {
      const f = form[k] as unknown as File | null;
      if (f) fd.append(k, f, f.name || `${String(k)}.png`);
    });

    const resp = await fetch( `${API_URL}/enroll` , {
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

      {/* Page scrolls by default; locks on lg+ */}
      <main className="flex-1 overflow-auto lg:overflow-hidden">
        {/* Step 1 */}
        {step === Step.Fingerprints && (
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:h-full">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:h-full">
              {/* Left panel */}
              <div className="min-h-[520px] rounded-lg bg-white p-6 shadow-lg overflow-visible lg:overflow-hidden flex flex-col lg:h-full">
                <div className="mb-3 flex items-center justify-between shrink-0">
                  <h3 className="text-xl font-semibold text-gray-800">Finger List</h3>
                  <div className="rounded-full bg-white px-4 py-1.5 shadow">
                    <span className="text-xs font-medium text-gray-700">
                      Progress: {capturedCount}/{FINGERS.length}
                    </span>
                  </div>
                </div>

                {/* Below lg, let the whole page scroll; on lg+, scroll only list */}
                <div className="flex-1 pr-1 space-y-3 overflow-visible lg:overflow-y-auto">
                  {FINGERS.map((finger, index) => (
                    <button
                      key={finger.id}
                      onClick={() => setCurrentFingerIndex(index)}
                      className={`flex w-full items-center justify-between rounded-lg p-3 transition-all ${
                        currentFingerIndex === index
                          ? "border-2 border-green-600 bg-green-100"
                          : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
                      }`}
                      aria-current={currentFingerIndex === index}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            capturedFingers[finger.id] ? "bg-green-600" : "bg-gray-300"
                          }`}
                        >
                          {capturedFingers[finger.id] ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : (
                            <span className="text-xs font-bold text-white">{index + 1}</span>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-800">{finger.name}</p>
                          <p className="text-xs text-gray-500">{finger.id}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right panel */}
              <div className="rounded-lg bg-white p-6 shadow-lg lg:col-span-2 flex flex-col lg:h-full">
                <div className="mb-4">
                  <h2 className="mb-1 text-xl font-bold text-gray-800">{currentFinger.name}</h2>
                  <p className="text-gray-600">
                    {capturedFingers[currentFinger.id]
                      ? "Fingerprint captured. You can recapture or proceed to the next finger."
                      : "Please place your finger on the scanner."}
                  </p>
                </div>

                {/* Capture box */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-64 overflow-hidden rounded-lg border-4 border-gray-300 bg-gray-50 h-[420px] lg:h-[52vh] lg:max-h-[28rem]">
                      {capturedFingers[currentFinger.id] && !isScanning ? (
                        <div className="relative h-full w-full">
                          <img
                            src={capturedFingers[currentFinger.id]!.image}
                            alt={currentFinger.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => deleteFingerprint(currentFinger.id)}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-2 shadow-lg transition-colors hover:bg-red-600"
                            aria-label="Delete fingerprint"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
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

                <div className="mt-6 md:mt-8 pt-4 flex items-start justify-between gap-4">
                  <button
                    onClick={handlePrevFinger}
                    disabled={currentFingerIndex === 0}
                    className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-3 text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex flex-col items-center gap-2">
                    {capturedFingers[currentFinger.id] && (
                      <>
                        <button
                          onClick={() => fetchFingerprint(currentFinger.id)}
                          disabled={isCapturing}
                          className="rounded-lg bg-yellow-500 px-4 py-3 text-white transition-colors hover:bg-yellow-600 disabled:opacity-50"
                        >
                          Recapture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedFingers({});
                            setCurrentFingerIndex(0);
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
                          className="w-full px-4 py-2 text-gray-700 underline"
                        >
                          Reset Captures
                        </button>
                      </>
                    )}
                  </div>

                  {currentFingerIndex < FINGERS.length - 1 ? (
                    <button
                      onClick={handleNextFinger}
                      disabled={!capturedFingers[currentFinger.id]}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={goToPersonalInfo}
                      disabled={!allFingersCaptured}
                      className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next 
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === Step.PersonalInfo && (
          <Form
            form={form}
            errors={errors}
            setForm={setForm}
            onBack={goBackToFingerprints}
            onSubmit={goToFace}
          />
        )}

        {/* Step 3 */}
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
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/20">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow">
            <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-green-600" />
            <p className="text-sm text-gray-600">Submitting enrollment…</p>
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
