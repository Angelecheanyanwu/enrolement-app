"use client";
import Image from "next/image";
import React, { Dispatch, FC, SetStateAction, useMemo } from "react";
import { IoClose } from "react-icons/io5";
import FormItem from "./FormItem";
import { EnrollmentFormData } from "@/utils/types";

interface FormAltProps {
  setFormActive: Dispatch<SetStateAction<boolean>>;
  formData: EnrollmentFormData;
}

/** Safely build a data URL from a raw base64 string (no prefix) or File.
 *  Fallbacks to a placeholder if missing. */
const toImgSrc = (input?: string | File | null, mime: "image/jpeg" | "image/png" = "image/jpeg"): string => {
  if (!input) return "/assets/profile.jpg";
  if (typeof input === "string") {
    if (input.length < 8) return "/assets/profile.jpg";
    return `data:${mime};base64,${input}`;
  }
  // If input is a File, create an object URL (sync, but not base64)
  if (input instanceof File) {
    return URL.createObjectURL(input);
  }
  return "/assets/profile.jpg";
};

const FormAlt: FC<FormAltProps> = ({ setFormActive, formData }) => {
  // Face preview
  const faceSrc = useMemo(() => toImgSrc(formData?.face_image, "image/jpeg"), [formData]);

  const heightCm =
    typeof formData?.height === "number" && !Number.isNaN(formData.height)
      ? Math.round(formData.height * 100)
      : "";

  // Fingerprint sources (assuming base64 strings without data-url prefix)
  const fp = {
    right_thumb: toImgSrc(formData?.right_thumb, "image/png"),
    right_index: toImgSrc(formData?.right_index, "image/png"),
    right_middle: toImgSrc(formData?.right_middle, "image/png"),
    right_ring: toImgSrc(formData?.right_ring, "image/png"),
    right_little: toImgSrc(formData?.right_little, "image/png"),
    left_thumb: toImgSrc(formData?.left_thumb, "image/png"),
    left_index: toImgSrc(formData?.left_index, "image/png"),
    left_middle: toImgSrc(formData?.left_middle, "image/png"),
    left_ring: toImgSrc(formData?.left_ring, "image/png"),
    left_little: toImgSrc(formData?.left_little, "image/png"),
  };

  type FPKey = keyof typeof fp;

  const fpOrder: { key: FPKey; label: string }[] = [
    { key: "right_thumb",  label: "Right Thumb" },
    { key: "right_index",  label: "Right Index" },
    { key: "right_middle", label: "Right Middle" },
    { key: "right_ring",   label: "Right Ring" },
    { key: "right_little", label: "Right Little" },
    { key: "left_thumb",   label: "Left Thumb" },
    { key: "left_index",   label: "Left Index" },
    { key: "left_middle",  label: "Left Middle" },
    { key: "left_ring",    label: "Left Ring" },
    { key: "left_little",  label: "Left Little" },
  ];

  return (
    <div className="flex flex-col gap-4 w-full h-full mx-auto items-center justify-center">
      <div className="flex flex-col items-center bg-white gap-8 shadow-lg px-10 pt-6 pb-12 mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="flex justify-between w-full items-center gap-6">
          <div className="flex gap-2 items-center">
            <div className="relative h-8 w-12 md:h-12 md:w-16 rounded-lg">
              <Image
                src="/assets/logo.png"
                alt="logo"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
              />
            </div>
            <h4 className="font-medium text-base md:text-xl">Verified Info</h4>
          </div>

          <button
            className="p-1 rounded-full bg-[#F9F9FB]"
            onClick={() => setFormActive(false)}
            aria-label="Close"
            type="button"
          >
            <IoClose className="text-gray-400 text-lg" />
          </button>
        </div>

        {/* Face */}
        <div className="flex flex-col gap-2 w-full">
          <div className="w-full justify-end flex items-end pb-4 mb-4 border-b border-gray-200">
            <div className="relative h-28 w-20 md:h-36 md:w-28 rounded-lg overflow-hidden border">
              <Image
                src={faceSrc}
                alt="Face"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Identity / Bio */}
          <FormItem label="NIN" value={formData?.nin ?? ""} />
          <FormItem label="Citizen ID" value={formData?.cidstr ?? ""} />
          <FormItem label="Title" value={formData?.title ?? ""} />
          <FormItem label="Surname" value={formData?.surname ?? ""} />
          <FormItem label="First Name" value={formData?.first_name ?? ""} />
          <FormItem label="Middle Name" value={formData?.middle_name ?? ""} />
          <FormItem label="Birth Date" value={formData?.birth_date ?? ""} />
          <FormItem label="Birth State" value={formData?.birth_state ?? ""} />
          <FormItem label="Birth LGA" value={formData?.birth_lga ?? ""} />
          <FormItem label="Nationality" value={formData?.nationality ?? ""} />
          <FormItem label="Gender" value={formData?.gender ?? ""} />

          {/* Contact */}
          <FormItem label="Email Address" value={formData?.email_address ?? ""} />
          <FormItem label="Telephone No" value={formData?.telephone_no ?? ""} />

          {/* Address */}
          <FormItem label="Address Line One" value={formData?.address_line_one ?? ""} />
          <FormItem label="Address Line Two" value={formData?.address_line_two ?? ""} />
          <FormItem label="Residential LGA" value={formData?.r_lga ?? ""} />
          <FormItem label="Residential State" value={formData?.r_state ?? ""} />
          <FormItem label="Town" value={formData?.town ?? ""} />

          {/* Physical */}
          <FormItem label="Height (cm)" value={heightCm !== "" ? String(heightCm) : ""} />

          {/* Fingerprints */}
          <div className="mt-6">
            <h5 className="text-sm font-semibold mb-3">Fingerprints</h5>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {fpOrder.map(({ key, label }) => (
                <div key={key} className="flex flex-col items-center gap-2">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden border bg-gray-50">
                    <Image
                      src={fp[key]}
                      alt={label}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-gray-700 text-center">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormAlt;
