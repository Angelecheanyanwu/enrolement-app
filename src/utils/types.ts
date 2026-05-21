export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  nin: string;
  fingerprints: Record<string, string>;
  faceImage: string;
}

export interface EnrollmentFormData {
  nin: string;
  title: string;
  surname: string;
  first_name: string;
  middle_name: string;
  birth_date: string;
  birth_state: string;
  birth_lga: string;
  nationality: string;
  gender: "Male" | "Female";
  email_address: string;
  telephone_no: string;
  address_line_one: string;
  address_line_two: string;
  r_lga: string;
  r_state: string;
  town: string;
  height: number;
  face_image: File | null;
  left_four: File | null;
  right_four: File | null;
  thumbs: File | null;
}

export interface VerificationData {
  right_thumb: File | null;
  right_index: File | null;
  right_middle: File | null;
  right_ring: File | null;
  right_little: File | null;
  left_thumb: File | null;
  left_index: File | null;
  left_middle: File | null;
  left_ring: File | null;
  left_little: File | null;
}
