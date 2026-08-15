import { getConnection } from "@/lib/db";
import { addressRepository } from "@/server/repositories/address.repository";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "@/server/validations/address.validation";

export class AddressService {
  async list(userId: number) {
    return addressRepository.findByUserId(userId);
  }

  async getById(userId: number, id: number) {
    const address = await addressRepository.findByIdForUser(id, userId);
    if (!address) {
      throw new Error("Address not found");
    }

    return address;
  }

  async create(userId: number, data: CreateAddressInput) {
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      if (data.is_default) {
        await addressRepository.unsetDefaultForUser(userId, connection);
      }

      const created = await addressRepository.create(userId, data, connection);

      await connection.commit();
      return created;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(userId: number, id: number, data: UpdateAddressInput) {
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      const existing = await addressRepository.findByIdForUser(id, userId, connection);
      if (!existing) {
        throw new Error("Address not found");
      }

      if (data.is_default) {
        await addressRepository.unsetDefaultForUser(userId, connection);
      }

      const updated = await addressRepository.update(id, userId, data, connection);
      if (!updated) {
        throw new Error("Address not found");
      }

      await connection.commit();
      return updated;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async remove(userId: number, id: number) {
    const deleted = await addressRepository.delete(id, userId);
    if (!deleted) {
      throw new Error("Address not found");
    }

    return { deleted: true };
  }
}

export const addressService = new AddressService();
