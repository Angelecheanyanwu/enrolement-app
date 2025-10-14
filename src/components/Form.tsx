"use client";
import React from "react";
import type { EnrollmentFormData } from "@/utils/types";

type Errors = Partial<Record<keyof EnrollmentFormData, string>>;

interface PersonalInfoFormProps {
  form: EnrollmentFormData;
  errors: Errors;
  setForm: React.Dispatch<React.SetStateAction<EnrollmentFormData>>;
  onBack: () => void;
  onSubmit: () => void; 
}

const Form: React.FC<PersonalInfoFormProps> = ({
  form,
  errors,
  setForm,
  onBack,
  onSubmit,
}) => {
  return (
    <div className="mx-auto h-full max-w-5xl overflow-auto p-4 md:p-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Personal Information</h2>

        <form
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {/* Row 1 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">NIN</label>
            <input
              value={form.nin}
              onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value }))}
              maxLength={11}
              inputMode="numeric"
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.nin ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="11-digit NIN"
              required
            />
            {errors.nin && <p className="mt-1 text-xs text-red-600">{errors.nin}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">CIDSTR</label>
            <input
              value={form.cidstr}
              onChange={(e) => setForm((f) => ({ ...f, cidstr: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.cidstr ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          {/* Row 2 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <select
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              required
            >
              <option value="" disabled>
                Select title
              </option>
              <option>Mr</option>
              <option>Mrs</option>
              <option>Miss</option>
              <option>Dr</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Surname</label>
            <input
              value={form.surname}
              onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.surname ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          {/* Row 3 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
            <input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.first_name ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Middle Name</label>
            <input
              value={form.middle_name}
              onChange={(e) => setForm((f) => ({ ...f, middle_name: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.middle_name ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          {/* Row 4 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Birth Date</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.birth_date ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.birth_date && (
              <p className="mt-1 text-xs text-red-600">{errors.birth_date}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Birth State</label>
            <input
              value={form.birth_state}
              onChange={(e) => setForm((f) => ({ ...f, birth_state: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.birth_state ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          {/* Row 5 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Birth LGA</label>
            <input
              value={form.birth_lga}
              onChange={(e) => setForm((f) => ({ ...f, birth_lga: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.birth_lga ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nationality</label>
            <input
              value={form.nationality}
              onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.nationality ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          {/* Row 6 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
            <select
              value={form.gender}
              onChange={(e) =>
                setForm((f) => ({ ...f, gender: e.target.value as "M" | "F" }))
              }
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.gender ? "border-red-500" : "border-gray-300"
              }`}
              required
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={form.email_address}
              onChange={(e) => setForm((f) => ({ ...f, email_address: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.email_address ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.email_address && (
              <p className="mt-1 text-xs text-red-600">{errors.email_address}</p>
            )}
          </div>

          {/* Row 7 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Telephone</label>
            <input
              value={form.telephone_no}
              onChange={(e) => setForm((f) => ({ ...f, telephone_no: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.telephone_no ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address Line 1</label>
            <input
              value={form.address_line_one}
              onChange={(e) => setForm((f) => ({ ...f, address_line_one: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.address_line_one ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          {/* Row 8 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address Line 2</label>
            <input
              value={form.address_line_two}
              onChange={(e) => setForm((f) => ({ ...f, address_line_two: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.address_line_two ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Residential LGA</label>
            <input
              value={form.r_lga}
              onChange={(e) => setForm((f) => ({ ...f, r_lga: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.r_lga ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          {/* Row 9 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Residential State</label>
            <input
              value={form.r_state}
              onChange={(e) => setForm((f) => ({ ...f, r_state: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.r_state ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Town</label>
            <input
              value={form.town}
              onChange={(e) => setForm((f) => ({ ...f, town: e.target.value }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.town ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
          </div>

          {/* Row 10 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Height (m)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.height}
              onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))}
              className={`w-full rounded-lg border-2 px-3 py-2 ${
                errors.height ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.height && <p className="mt-1 text-xs text-red-600">{errors.height}</p>}
          </div>

          <div className="col-span-1 mt-4 flex items-center justify-between md:col-span-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg bg-gray-200 px-6 py-3 text-gray-800 transition-colors hover:bg-gray-300"
            >
              Back to Fingerprints
            </button>
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;
