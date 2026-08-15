import { customerRepository } from "@/server/repositories/customer.repository";
import { comparePassword, hashPassword } from "@/server/utils/password";
import { signAccessToken } from "@/server/utils/jwt";
import { HttpError } from "@/server/utils/http-error";

type RegisterInput = {
  first_name: string;
  last_name: string;
  mobile: string;
  password: string;
  confirm_password: string;
  province: string;
  city: string;
  address: string;
  plaque: string;
  floor?: string;
  unit?: string;
  postal_code?: string;
  phone?: string;
};

type LoginInput = {
  mobile: string;
  password: string;
};

function toSafeCustomer(customer: any) {
  return {
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    mobile: customer.mobile,
    role: customer.role,
  };
}

export const customerAuthService = {
  async register(data: RegisterInput) {
    const mobile = data.mobile.trim();

    const existingByMobile = await customerRepository.findByMobile(mobile);

    if (existingByMobile) {
      throw new HttpError("این شماره موبایل قبلا ثبت شده است", 409);
    }

    const password_hash = await hashPassword(data.password);

    try {
      const customer = await customerRepository.createWithDefaultAddress(
        {
          first_name: data.first_name,
          last_name: data.last_name,
          mobile,
          password_hash,
        },
        {
          province: data.province,
          city: data.city,
          address: data.address,
          plaque: data.plaque,
          floor: data.floor || null,
          unit: data.unit || null,
          postal_code: data.postal_code || null,
          phone: data.phone || null,
          is_default: 1,
        },
      );

      await customerRepository.attachGuestOrdersByMobile(
        Number(customer.id),
        customer.mobile,
      );

      const accessToken = signAccessToken({
        userId: customer.id,
        mobile: customer.mobile,
        role: "USER",
      });

      return {
        customer: toSafeCustomer(customer),
        accessToken,
      };
    } catch (error) {
      if (customerRepository.isDuplicateEntryError(error)) {
        throw new HttpError("این شماره موبایل قبلا ثبت شده است", 409);
      }

      throw error;
    }
  },

  async login(data: LoginInput) {
    const mobile = data.mobile.trim();

    const customer = await customerRepository.findByMobile(mobile);

    if (!customer) {
      throw new HttpError("اطلاعات ورود نامعتبر است", 401);
    }

    if (Number(customer.is_active) !== 1) {
      throw new HttpError("حساب کاربری شما غیرفعال است", 403);
    }

    const valid = await comparePassword(data.password, customer.password_hash);

    if (!valid) {
      throw new HttpError("اطلاعات ورود نامعتبر است", 401);
    }

    await customerRepository.updateLastLoginAt(customer.id);

    await customerRepository.attachGuestOrdersByMobile(
      Number(customer.id),
      customer.mobile,
    );

    const accessToken = signAccessToken({
      userId: customer.id,
      mobile: customer.mobile,
      role: "USER",
    });

    return {
      customer: toSafeCustomer(customer),
      accessToken,
    };
  },

  async me(customerId: number) {
    const customer = await customerRepository.findById(customerId);

    if (!customer) {
      throw new HttpError("کاربر یافت نشد", 404);
    }

    if (Number(customer.is_active) !== 1) {
      throw new HttpError("حساب کاربری غیرفعال است", 403);
    }

    const address = await customerRepository.getDefaultAddress(customerId);

    return {
      ...customer,
      default_address: address,
    };
  },
};
