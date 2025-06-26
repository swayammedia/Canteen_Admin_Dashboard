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