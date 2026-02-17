"use client";

import React, { useRef, useState } from "react";
import { Camera, ArrowLeft, Upload, X } from "lucide-react";

interface FaceCaptureProps {
  onComplete: (faceImage: File) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({
  onComplete,
  onBack,
  isSubmitting,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setFaceFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCapturedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => fileInputRef.current?.click();

  const handleRemove = () => {
    setCapturedImage(null);
    setFaceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    console.log('Face file:', faceFile);
    if (faceFile) {
      onComplete(faceFile);
    } else {
      alert('Please capture or upload a face image first.');
    }
  };

  return (
    <div className="h-full w-full p-4 md:p-6 overflow-hidden">
      {/* ✅ SINGLE CARD – NO BORDER */}
      <div className="mx-auto flex h-full max-w-4xl flex-col rounded-lg bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="shrink-0">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Face Capture
          </h2>
          <p className="text-gray-600">
            Please capture or upload a clear photo of your face.
          </p>
        </div>

        {/* Preview (NO SCROLL) */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="
              relative
              h-[42vh] max-h-[26rem] w-80
              flex items-center justify-center
              rounded-lg
              border-2 border-gray-300
              bg-gray-50
              overflow-hidden
            "
          >
            {capturedImage ? (
              <>
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 rounded-full bg-white p-2 shadow hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Camera className="h-28 w-28" />
                <p className="text-sm">No image captured</p>
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
          </ul>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Upload / Recapture */}
        <div className="mt-4 flex justify-center shrink-0">
          {!capturedImage ? (
            <button
              onClick={handleCapture}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-3 font-semibold hover:bg-gray-200 disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              Upload Face Image
            </button>
          ) : (
            <button
              onClick={handleCapture}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />
              Recapture
            </button>
          )}
        </div>
        <div className="mt-6 flex shrink-0 gap-4 border-t pt-5">
          <button
            onClick={handleSubmit}
            disabled={!faceFile || isSubmitting}
            className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Enrollment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;