import { DocumentReference, Timestamp } from "firebase/firestore";

export interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryId: string;
  categoryName: string;
  imageUrl?: string;
  qty: number;
  defaultOrderStatus: string;
  isAvailable: boolean;
  categoryRef?: DocumentReference;
  status?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: Item[];
  totalAmount: number;
  timestamp: string;
  status: string;
  collectionTimeSlot?: {
    displayText: string;
    endTime: string;
    startTime: string;
  };
  orderDate?: string;
  orderNumber?: number;
  razorpayOrderId?: string;
  blockUntil?: string;
  displayText?: string;
}

export interface Payment {
  amount: number;
  method: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  status: string;
  timestamp: string; // store as ISO string for consistency
  userId: string;
  verified: boolean;
}

export interface User {
  createdAt: string; // store as ISO string for consistency
  email: string;
  isAdmin: boolean;
  isCashier: boolean;
  name: string;
  phone: string;
  profileComplete: boolean;
  rollNo: string;
  uid?: string;
} 