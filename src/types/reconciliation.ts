// Bank reconciliation domain: raw bank-statement lines matched against POS settlements
// (Payment.referenceNo / ChannelOrderSettlement.bankReference) and vendor payments
// (VendorPayment.referenceNo).

export type BankTxnType = 'CREDIT' | 'DEBIT';

export interface BankTransaction {
  id: string;
  transactionDate: string;
  description: string;
  referenceNo: string;
  type: BankTxnType;
  amount: number;
  narrationSource: 'UPI' | 'CARD_SETTLEMENT' | 'GATEWAY_SETTLEMENT' | 'NEFT' | 'RTGS' | 'CHEQUE' | 'OTHER';
}

export type MatchSourceType = 'POS_PAYMENT' | 'CHANNEL_SETTLEMENT' | 'VENDOR_PAYMENT';
export type ReconciliationStatus = 'MATCHED' | 'MISMATCH' | 'UNMATCHED';
export type MatchMethod = 'EXACT_REFERENCE' | 'AMOUNT_DATE_PROXIMITY' | 'MANUAL' | 'UNRESOLVED';

export interface ReconciliationMatch {
  id: string;
  bankTransactionId: string;
  sourceType?: MatchSourceType;
  sourceId?: string; // Payment.id / ChannelOrderSettlement.id / VendorPayment.id
  sourceLabel: string; // human-readable, e.g. "UPI Payment - BILL-IND-2091"
  bankAmount: number;
  sourceAmount?: number;
  varianceAmount: number;
  status: ReconciliationStatus;
  matchMethod: MatchMethod;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}
