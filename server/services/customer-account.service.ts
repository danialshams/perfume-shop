import { customerRepository } from "@/server/repositories/customer.repository";
import { comparePassword, hashPassword } from "@/server/utils/password";
import { HttpError } from "@/server/utils/http-error";

type UpdateProfileInput = {
  first_name: string;
  last_name: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  plaque: string;
  floor?: string;
  unit?: string;
  postal_code?: string;
  phone?: string;
};

type UpdatePasswordInput = {
  current_password: string;
  password: string;
  confirm_password: string;
};

export const customerAccountService = {
  async getProfile(customerId: number) {
    const customer = await customerRepository.findById(customerId);

    if (!customer) {
      throw new HttpError("کاربر یافت نشد", 404);
    }

    if (Number(customer.is_active) !== 1) {
      throw new HttpError("حساب کاربری غیرفعال است", 403);
    }

    const defaultAddress =
      await customerRepository.getDefaultAddress(customerId);

    return {
      ...customer,
      default_address: defaultAddress,
    };
  },

  async updateProfile(customerId: number, data: UpdateProfileInput) {
    const customer = await customerRepository.findById(customerId);

    if (!customer) {
      throw new HttpError("کاربر یافت نشد", 404);
    }

    if (Number(customer.is_active) !== 1) {
      throw new HttpError("حساب کاربری غیرفعال است", 403);
    }

    const mobile = data.mobile.trim();
    const existingByMobile = await customerRepository.findByMobile(mobile);

    if (
      existingByMobile &&
      Number(existingByMobile.id) !== Number(customerId)
    ) {
      throw new HttpError("این شماره موبایل قبلا ثبت شده است", 409);
    }

    try {
      await customerRepository.updateProfile({
        id: customerId,
        first_name: data.first_name,
        last_name: data.last_name,
        mobile,
      });
    } catch (error) {
      if (customerRepository.isDuplicateEntryError(error)) {
        throw new HttpError("این شماره موبایل قبلا ثبت شده است", 409);
      }

      throw error;
    }

    await customerRepository.upsertDefaultAddress({
      customer_id: customerId,
      province: data.province,
      city: data.city,
      address: data.address,
      plaque: data.plaque,
      floor: data.floor || null,
      unit: data.unit || null,
      postal_code: data.postal_code || null,
      phone: data.phone || null,
    });

    const updatedCustomer = await customerRepository.findById(customerId);
    const defaultAddress =
      await customerRepository.getDefaultAddress(customerId);

    return {
      ...updatedCustomer,
      default_address: defaultAddress,
    };
  },

  async updatePassword(customerId: number, data: UpdatePasswordInput) {
    const customer = await customerRepository.findByIdWithPassword(customerId);

    if (!customer) {
      throw new HttpError("کاربر یافت نشد", 404);
    }

    if (Number(customer.is_active) !== 1) {
      throw new HttpError("حساب کاربری غیرفعال است", 403);
    }

    const currentPasswordIsValid = await comparePassword(
      data.current_password,
      customer.password_hash,
    );

    if (!currentPasswordIsValid) {
      throw new HttpError("رمز عبور فعلی اشتباه است", 400);
    }

    const passwordHash = await hashPassword(data.password);

    await customerRepository.updatePassword(customerId, passwordHash);

    return true;
  },
};
