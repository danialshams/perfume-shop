import { paymentRepository } from "@/server/repositories/payment.repository";

type CreatePaymentIntentInput = {
  orderId: number;
  amount: number;
  customerId?: number | null;
};

type VerifyPaymentInput = {
  paymentIntentId?: string | null;
  authority?: string | null;
  status?: string | null;
};

export type PaymentVerificationStatus = "SUCCESS" | "FAILED" | "CANCELLED";

export type VerifyPaymentResult = {
  success: boolean;
  status: PaymentVerificationStatus;
  transactionId: string | null;
  refId: string | null;
  raw: VerifyPaymentInput;
};

class PaymentService {
  private generateAuthority() {
    return `AUTH_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private generatePaymentIntentId(orderId: number) {
    return `pi_${orderId}_${Date.now()}`;
  }

  private normalizeVerificationStatus(
    status?: string | null,
  ): PaymentVerificationStatus {
    const normalized = (status || "").trim().toLowerCase();

    if (normalized === "ok" || normalized === "success") {
      return "SUCCESS";
    }

    if (
      normalized === "cancelled" ||
      normalized === "canceled" ||
      normalized === "cancel" ||
      normalized === "c"
    ) {
      return "CANCELLED";
    }

    return "FAILED";
  }

  async createPaymentIntent(input: CreatePaymentIntentInput) {
    const authority = this.generateAuthority();
    const paymentIntentId = this.generatePaymentIntentId(input.orderId);

    return {
      provider: "sandbox",
      authority,
      paymentIntentId,
      paymentUrl: `/sandbox/payment?authority=${encodeURIComponent(authority)}`,
      amount: input.amount,
      metadata: {
        orderId: input.orderId,
        customerId: input.customerId ?? null,
      },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const status = this.normalizeVerificationStatus(input.status);

    if (status === "SUCCESS") {
      return {
        success: true,
        status,
        transactionId: `tx_${Date.now()}`,
        refId: `REF_${Date.now()}`,
        raw: input,
      };
    }

    return {
      success: false,
      status,
      transactionId: null,
      refId: null,
      raw: input,
    };
  }

  async findPaymentByAuthority(authority: string) {
    return paymentRepository.findByAuthority(authority);
  }
}

export const paymentService = new PaymentService();
