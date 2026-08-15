import { db } from "@/server/db/mysql";
import { ResultSetHeader, RowDataPacket } from "mysql2";

type UserProfileRow = RowDataPacket & {
  id: number;
  user_id: number;
  national_code: string | null;
  postal_code: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  building_number: string | null;
  unit: string | null;
  landline_phone: string | null;
  extra_description: string | null;
};

export async function findProfileByUserId(userId: number) {
  const [rows] = await db.query<UserProfileRow[]>(
    `
      SELECT
        id,
        user_id,
        national_code,
        postal_code,
        province,
        city,
        address,
        building_number,
        unit,
        landline_phone,
        extra_description
      FROM user_profiles
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] || null;
}

export async function upsertUserProfile(
  userId: number,
  data: {
    nationalCode: string | null;
    postalCode: string | null;
    province: string | null;
    city: string | null;
    address: string | null;
    buildingNumber: string | null;
    unit: string | null;
    landlinePhone: string | null;
    extraDescription: string | null;
  },
) {
  const [result] = await db.execute<ResultSetHeader>(
    `
      INSERT INTO user_profiles
      (
        user_id,
        national_code,
        postal_code,
        province,
        city,
        address,
        building_number,
        unit,
        landline_phone,
        extra_description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        national_code = VALUES(national_code),
        postal_code = VALUES(postal_code),
        province = VALUES(province),
        city = VALUES(city),
        address = VALUES(address),
        building_number = VALUES(building_number),
        unit = VALUES(unit),
        landline_phone = VALUES(landline_phone),
        extra_description = VALUES(extra_description)
    `,
    [
      userId,
      data.nationalCode,
      data.postalCode,
      data.province,
      data.city,
      data.address,
      data.buildingNumber,
      data.unit,
      data.landlinePhone,
      data.extraDescription,
    ],
  );

  return result;
}
