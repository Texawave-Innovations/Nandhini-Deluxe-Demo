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

export type MatchSourceType = 'POS_PAYMENT' | 'CHANNEL_SETTLEMENT' | 'VENDOR_PAYMENT' | 'CUSTOMER_PAYMENT';
// SUGGESTED replaces the old MISMATCH: any amount+date-proximity candidate (whether within
// tolerance or not) is a *suggestion* the accountant must confirm, not an auto-accepted match —
// only an EXACT_REFERENCE hit or an explicit manual pick is auto-accepted as MATCHED.
export type ReconciliationStatus = 'MATCHED' | 'SUGGESTED' | 'UNMATCHED';
export type MatchMethod = 'EXACT_REFERENCE' | 'AMOUNT_DATE_PROXIMITY' | 'MANUAL' | 'UNRESOLVED';

export interface ReconciliationMatch {
  id: string;
  bankTransactionId: string;
  sourceType?: MatchSourceType;
  sourceId?: string; // Payment.id / ChannelOrderSettlement.id / VendorPayment.id / CustomerPayment.id
  sourceLabel: string; // human-readable, e.g. "UPI Payment - BILL-IND-2091"
  bankAmount: number; // the bank transaction's full amount (same value on every split row, if split)
  sourceAmount?: number; // this match row's allocated amount — equals bankAmount unless split
  varianceAmount: number;
  status: ReconciliationStatus;
  matchMethod: MatchMethod;
  // Set (same value) on every row of a split match — multiple ReconciliationMatch rows sharing a
  // bankTransactionId, each allocating part of one bank line across several source records (e.g.
  // one NEFT batch credit covering 3 customer payments). Absent for a normal 1:1 match.
  splitGroupId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}
