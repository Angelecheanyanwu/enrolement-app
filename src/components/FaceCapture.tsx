import React, { useState, useRef } from "react";
import { Camera, ArrowLeft, Upload, X } from "lucide-react";

interface FaceCaptureProps {
  onComplete: (faceImage: File) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({ onComplete, onBack, isSubmitting }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setFaceFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setCapturedImage(event.target?.result as string);
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
    if (faceFile) onComplete(faceFile);
  };

  return (
    // Fill parent and HIDE scrolling
    <div className="h-full w-full p-4 md:p-6 overflow-hidden">
      {/* Card fills available height, internal sections flex without scrolling */}
      <div className="mx-auto flex h-full max-w-4xl flex-col rounded-lg bg-white p-6 shadow-lg">
        {/* Header (no growth) */}
        <div className="shrink-0">
          <h2 className="mb-3 text-2xl font-bold text-gray-800">Face Capture</h2>
          <p className="text-gray-600">
            Please capture or upload a clear photo of your face for identification purposes.
          </p>
        </div>

        {/* Preview area grows, but still no scrolling */}
        <div className="flex-1 min-h-0">
          <div className="mt-5 flex h-full items-center justify-center">
            <div className="relative">
              {/* Box height capped to keep layout fixed; no overflow scrollbars */}
              <div className="flex h-[42vh] max-h-[26rem] w-80 items-center justify-center overflow-hidden rounded-lg border-4 border-gray-300 bg-gray-50">
                {capturedImage ? (
                  <div className="relative h-full w-full">
                    <img src={capturedImage} alt="Captured face" className="h-full w-full object-cover" />
                    <button
                      onClick={handleRemove}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-2 shadow-lg transition-colors hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-gray-400">
                    <Camera className="h-32 w-32" />
                    <p className="text-sm">No image captured</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines (no scroll, truncated if needed on very small heights) */}
        <div className="mt-5 shrink-0 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">Photo Guidelines:</h3>
          <ul className="list-inside list-disc text-sm text-blue-800">
            <li>Face should be clearly visible and well-lit</li>
            <li>Remove glasses, hats, or face coverings</li>
            <li>Look directly at the camera with a neutral expression</li>
            <li>Ensure the background is plain and uncluttered</li>
          </ul>
        </div>


        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="mt-4 flex justify-center shrink-0">
          {!capturedImage ? (
            <button
              onClick={handleCapture}
              className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-4 text-lg font-semibold text-black"
            >
              <Upload className="h-6 w-6" />
              Upload Face Image
            </button>
          ) : (
            <button
              onClick={handleCapture}
              className="flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 text-white transition-colors hover:bg-yellow-600"
            >
              <Camera className="h-5 w-5" />
              Recapture
            </button>
          )}
        </div>

    
        <div className="mt-6 flex shrink-0 gap-4 border-t pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-3 text-gray-800 transition-colors hover:bg-gray-300 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={!faceFile || isSubmitting}
            className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Enrollment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;
