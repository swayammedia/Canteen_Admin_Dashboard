import { DocumentReference, Timestamp } from "firebase/firestore";

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  qty: number;
  defaultOrderStatus: string;
  categoryRef?: DocumentReference;
}

export interface Order {
  id: string;
  userId: string;
  items: Item[];
  totalAmount: number;
  timestamp: Timestamp;
  status: string;
  collectionTimeSlot?: {
    displayText: string;
    endTime: string;
    startTime: string;
  };
  blockUntil?: Timestamp;
} 