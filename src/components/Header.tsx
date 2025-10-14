import React from "react";
import { Fingerprint } from "lucide-react";

interface HeaderProps {
  currentStep: number;
  totalSteps: number;
}

const Header: React.FC<HeaderProps> = ({ currentStep, totalSteps }) => {
  const steps = [
    { number: 1, name: "Fingerprint Capture" },
    { number: 2, name: "Personal Information" },
    { number: 3, name: "Face Capture" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-7 w-7 text-green-600" />
            <h1 className="text-2xl font-bold leading-tight text-gray-800 md:text-3xl">
              Enrollment System
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    currentStep > step.number
                      ? "bg-green-600 text-white"
                      : currentStep === step.number
                      ? "bg-red-300 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {currentStep > step.number ? "✓" : step.number}
                </div>
                <span
                  className={`mt-2 text-center text-xs ${
                    currentStep === step.number
                      ? "font-semibold text-red-300"
                      : "text-gray-600"
                  }`}
                >
                  {step.name}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-1 h-1 flex-1 ${
                    currentStep > step.number ? "bg-green-600" : "bg-gray-300"
                  } -mt-4`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
