export interface PaymentResult {
  success: boolean;
  transactionId: string;
  method: string;
  planId: string;
  timestamp: string;
  message?: string;
  error?: string;
  url?: string;
  ussdCode?: string;
  creditsUsed?: number;
}

declare const paymentService: {
  initiateStripePayment(planId: string, userId?: string | null): Promise<PaymentResult>;
  initiateFlutterwavePayment(planId: string, email?: string, name?: string, userId?: string | null): Promise<PaymentResult>;
  initiatePayPalPayment(planId: string): Promise<PaymentResult>;
  initiateEcoCashPayment(planId: string): Promise<PaymentResult>;
  initiateInnbucksPayment(planId: string): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<{ success: boolean; status?: string; transaction?: any; error?: string }>;
  getPaymentHistory(): Promise<Array<any>>;
  savePaymentHistory(transaction: any): Promise<void>;
  initiateRefund(transactionId: string, reason?: string): Promise<any>;
  getPaymentStatus(transactionId: string): Promise<any>;
};

export default paymentService;
