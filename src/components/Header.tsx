import React, { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";

interface HeaderProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number[];
  pageTitle?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentStep,
  totalSteps,
  completedSteps = [],
  pageTitle,
  onMenuClick,
}) => {
  const [isVerification, setIsVerification] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsVerification(window.location.pathname === "/verify");
  }, []);

  const goTo = (to: string) => {
    if (typeof window === "undefined") return;
    window.location.href = to;
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <Fingerprint className="h-7 w-7 text-white" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isVerification ? "Verification System" : "Enrollment System"}
              </h1>
              <p className="text-sm text-gray-600">
                {isVerification
                  ? "Verify identity securely"
                  : "Three Steps to Enroll"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => goTo("/")}
              className="rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Home
            </button>

            <button
              onClick={() => goTo(isVerification ? "/enroll" : "/verify")}
              className="rounded-md bg-green-600 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              {isVerification ? "Enroll" : "Verify"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
