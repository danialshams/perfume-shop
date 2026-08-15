import { findProfileByUserId, upsertUserProfile } from "../repositories/profile.repository";

function normalizeOptional(value?: string) {
  if (!value) return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function saveUserProfile(
  userId: number,
  input: {
    nationalCode?: string;
    postalCode?: string;
    province?: string;
    city?: string;
    address?: string;
    buildingNumber?: string;
    unit?: string;
    landlinePhone?: string;
    extraDescription?: string;
  },
) {
  await upsertUserProfile(userId, {
    nationalCode: normalizeOptional(input.nationalCode),
    postalCode: normalizeOptional(input.postalCode),
    province: normalizeOptional(input.province),
    city: normalizeOptional(input.city),
    address: normalizeOptional(input.address),
    buildingNumber: normalizeOptional(input.buildingNumber),
    unit: normalizeOptional(input.unit),
    landlinePhone: normalizeOptional(input.landlinePhone),
    extraDescription: normalizeOptional(input.extraDescription),
  });

  return findProfileByUserId(userId);
}
