"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { EnrollmentFormData } from "@/utils/types";
import { NIGERIA_STATES_AND_LGAS } from "@/utils/nigeria-data";

type Errors = Partial<Record<keyof EnrollmentFormData, string>>;

interface PersonalInfoModalProps {
  isOpen: boolean;
  form: EnrollmentFormData;
  errors: Errors;
  setForm: React.Dispatch<React.SetStateAction<EnrollmentFormData>>;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
  onClose: () => void;
  onComplete: () => void;
}

// Custom Dropdown Component
interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  searchable?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error = false,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full rounded-lg border-2 px-3 py-2.5 text-left flex items-center justify-between ${
          error ? "border-red-500" : "border-gray-300"
        } ${
          disabled
            ? "bg-gray-100 cursor-not-allowed text-gray-500"
            : "bg-white hover:border-green-400"
        } focus:border-green-500 focus:outline-none transition-colors`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-300 rounded-lg shadow-lg">
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-sm"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors ${
                    value === option
                      ? "bg-green-100 text-green-900 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  isOpen,
  form,
  errors,
  setForm,
  setErrors,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // State-dependent LGA lists
  const [birthLGAs, setBirthLGAs] = useState<string[]>([]);
  const [residentialLGAs, setResidentialLGAs] = useState<string[]>([]);

  // Update Birth LGAs when birth_state changes
  useEffect(() => {
    if (form.birth_state) {
      const lgas = NIGERIA_STATES_AND_LGAS[form.birth_state] || [];
      setBirthLGAs(lgas);
      // Reset birth_lga if it's not in the new list
      if (!lgas.includes(form.birth_lga)) {
        setForm((f) => ({ ...f, birth_lga: "" }));
      }
    } else {
      setBirthLGAs([]);
      setForm((f) => ({ ...f, birth_lga: "" }));
    }
  }, [form.birth_state]);

  // Update Residential LGAs when r_state changes
  useEffect(() => {
    if (form.r_state) {
      const lgas = NIGERIA_STATES_AND_LGAS[form.r_state] || [];
      setResidentialLGAs(lgas);
      // Reset r_lga if it's not in the new list
      if (!lgas.includes(form.r_lga)) {
        setForm((f) => ({ ...f, r_lga: "" }));
      }
    } else {
      setResidentialLGAs([]);
      setForm((f) => ({ ...f, r_lga: "" }));
    }
  }, [form.r_state]);

  // Ensure telephone has +234 prefix
  useEffect(() => {
    if (form.telephone_no && !form.telephone_no.startsWith("+234")) {
      setForm((f) => ({
        ...f,
        telephone_no: "+234" + f.telephone_no.replace(/^\+?234/, ""),
      }));
    }
  }, []);

  const validateStep1 = (): boolean => {
    const e: Errors = {};

    if (!form.nin?.trim()) e.nin = "Required";
    else if (!/^\d{11}$/.test(form.nin)) e.nin = "NIN must be 11 digits";
    if (!form.title?.trim()) e.title = "Required";
    if (!form.surname?.trim()) e.surname = "Required";
    if (!form.first_name?.trim()) e.first_name = "Required";
    // middle_name is optional
    if (!form.birth_date?.trim()) e.birth_date = "Required";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date))
      e.birth_date = "Use YYYY-MM-DD";
    if (!form.birth_state?.trim()) e.birth_state = "Required";
    if (!form.birth_lga?.trim()) e.birth_lga = "Required";
    if (!form.gender) e.gender = "Required";
    // email is optional, but validate format if provided
    if (
      form.email_address?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_address)
    ) {
      e.email_address = "Invalid email format";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Errors = {};

    if (!form.telephone_no?.trim()) e.telephone_no = "Required";
    else if (!form.telephone_no.startsWith("+234"))
      e.telephone_no = "Must start with +234";
    else if (form.telephone_no.replace("+234", "").length !== 10)
      e.telephone_no = "Must be exactly 10 digits after +234";
    if (!form.address_line_one?.trim()) e.address_line_one = "Required";
    if (!form.address_line_two?.trim()) e.address_line_two = "Required";
    if (!form.r_state?.trim()) e.r_state = "Required";
    if (!form.r_lga?.trim()) e.r_lga = "Required";
    if (!form.town?.trim()) e.town = "Required";
    if (!form.height || Number(form.height) <= 0)
      e.height = "Enter height in meters";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(2);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handlePrevStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(1);
      setIsAnimating(false);
    }, 300);
  };

  const handleComplete = () => {
    if (validateStep2()) {
      onComplete();
    }
  };

  if (!isOpen) return null;

  const nigeriaStates = Object.keys(NIGERIA_STATES_AND_LGAS);
  const titleOptions = ["Mr", "Mrs", "Miss", "Dr"];
  const genderOptions = ["Male", "Female"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Personal Information
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Step {currentStep} of 2
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: currentStep === 1 ? "50%" : "100%" }}
          />
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "calc(90vh - 180px)" }}
        >
          <div
            className={`transition-all duration-300 ${
              isAnimating
                ? "opacity-0 translate-x-4"
                : "opacity-100 translate-x-0"
            }`}
          >
            {currentStep === 1 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Title */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    value={form.title}
                    onChange={(value) =>
                      setForm((f) => ({ ...f, title: value }))
                    }
                    options={titleOptions}
                    placeholder="Select title"
                    error={!!errors.title}
                    searchable={false}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Surname */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.surname}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, surname: e.target.value }))
                    }
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.surname ? "border-red-500" : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.surname && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.surname}
                    </p>
                  )}
                </div>

                {/* First Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.first_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, first_name: e.target.value }))
                    }
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.first_name ? "border-red-500" : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                {/* NIN */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    NIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.nin}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setForm((f) => ({ ...f, nin: digits }));
                    }}
                    placeholder="11-digit NIN"
                    inputMode="numeric"
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.nin ? "border-red-500" : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.nin && (
                    <p className="mt-1 text-xs text-red-600">{errors.nin}</p>
                  )}
                </div>

                {/* Middle Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Middle Name{" "}
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    value={form.middle_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, middle_name: e.target.value }))
                    }
                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2.5 focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Birth Date */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Birth Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, birth_date: e.target.value }))
                    }
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.birth_date ? "border-red-500" : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.birth_date && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.birth_date}
                    </p>
                  )}
                </div>

                {/* Birth State */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Birth State <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    value={form.birth_state}
                    onChange={(value) =>
                      setForm((f) => ({ ...f, birth_state: value }))
                    }
                    options={nigeriaStates}
                    placeholder="Select state"
                    error={!!errors.birth_state}
                  />
                  {errors.birth_state && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.birth_state}
                    </p>
                  )}
                </div>

                {/* Birth LGA */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Birth LGA <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    value={form.birth_lga}
                    onChange={(value) =>
                      setForm((f) => ({ ...f, birth_lga: value }))
                    }
                    options={birthLGAs}
                    placeholder="Select LGA"
                    disabled={!form.birth_state}
                    error={!!errors.birth_lga}
                  />
                  {errors.birth_lga && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.birth_lga}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    value={
                      form.gender === "M"
                        ? "Male"
                        : form.gender === "F"
                          ? "Female"
                          : ""
                    }
                    onChange={(value) =>
                      setForm((f) => ({
                        ...f,
                        gender: value === "Male" ? "M" : "F",
                      }))
                    }
                    options={genderOptions}
                    placeholder="Select gender"
                    error={!!errors.gender}
                    searchable={false}
                  />
                  {errors.gender && (
                    <p className="mt-1 text-xs text-red-600">{errors.gender}</p>
                  )}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email Address{" "}
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email_address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email_address: e.target.value }))
                    }
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.email_address
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.email_address && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.email_address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Telephone */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Telephone <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.telephone_no}
                    onChange={(e) => {
                      let val = e.target.value;
                      // Ensure it starts with +234
                      if (!val.startsWith("+234")) {
                        val = "+234" + val.replace(/^\+?234/, "");
                      }
                      // Extract digits after +234
                      const digitsAfterPrefix = val.slice(4).replace(/\D/g, "");
                      // Limit to 10 digits
                      const limitedDigits = digitsAfterPrefix.slice(0, 10);
                      // Reconstruct the phone number
                      setForm((f) => ({
                        ...f,
                        telephone_no: "+234" + limitedDigits,
                      }));
                    }}
                    placeholder="+234XXXXXXXXXX"
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.telephone_no ? "border-red-500" : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.telephone_no && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.telephone_no}
                    </p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.address_line_one}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address_line_one: e.target.value,
                      }))
                    }
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.address_line_one
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.address_line_one && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.address_line_one}
                    </p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Address Line 2 <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.address_line_two}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        address_line_two: e.target.value,
                      }))
                    }
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.address_line_two
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.address_line_two && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.address_line_two}
                    </p>
                  )}
                </div>

                {/* Residential State */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Residential State <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    value={form.r_state}
                    onChange={(value) =>
                      setForm((f) => ({ ...f, r_state: value }))
                    }
                    options={nigeriaStates}
                    placeholder="Select state"
                    error={!!errors.r_state}
                  />
                  {errors.r_state && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.r_state}
                    </p>
                  )}
                </div>

                {/* Residential LGA */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Residential LGA <span className="text-red-500">*</span>
                  </label>
                  <CustomDropdown
                    value={form.r_lga}
                    onChange={(value) =>
                      setForm((f) => ({ ...f, r_lga: value }))
                    }
                    options={residentialLGAs}
                    placeholder="Select LGA"
                    disabled={!form.r_state}
                    error={!!errors.r_lga}
                  />
                  {errors.r_lga && (
                    <p className="mt-1 text-xs text-red-600">{errors.r_lga}</p>
                  )}
                </div>

                {/* Town */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.town}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, town: e.target.value }))
                    }
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.town ? "border-red-500" : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.town && (
                    <p className="mt-1 text-xs text-red-600">{errors.town}</p>
                  )}
                </div>

                {/* Height */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Height (m) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.height || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, height: Number(e.target.value) }))
                    }
                    placeholder="e.g., 1.75"
                    className={`w-full rounded-lg border-2 px-3 py-2.5 ${
                      errors.height ? "border-red-500" : "border-gray-300"
                    } focus:border-green-500 focus:outline-none`}
                  />
                  {errors.height && (
                    <p className="mt-1 text-xs text-red-600">{errors.height}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          {currentStep === 1 ? (
            <>
              <button
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Fingerprints
              </button>
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-green-700"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Page 1
                </button>
              </div>
              <button
                onClick={handleComplete}
                className="rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-green-700"
              >
                Continue to Face Capture
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoModal;
