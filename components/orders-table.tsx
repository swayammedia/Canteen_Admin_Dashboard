"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Search, ChefHat, Package, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, updateDoc, Timestamp, collection, getDocs } from "firebase/firestore"
import { Item, Order } from "@/types/common-interfaces"
import { toast } from "@/hooks/use-toast"
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OrdersTableProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  payments: Payment[];
  users: User[];
  search: string;
}

const statusOptions = [
  {
    value: "Preparing",
    label: "Preparing the Order",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: ChefHat,
  },
  {
    value: "Ready",
    label: "Collect your order",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Package,
  },
  {
    value: "Delivered",
    label: "Order Delivered",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle,
  },
]

export default function OrdersTable({ orders, onStatusUpdate, payments, users, search }: OrdersTableProps) {
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [userNames, setUserNames] = useState<Record<string, string>>({}); // New state for user names
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCol = collection(db, "users");
      const userSnapshot = await getDocs(usersCol);
      const namesMap: Record<string, string> = {};
      userSnapshot.docs.forEach(doc => {
        namesMap[doc.id] = doc.data().name || "Unknown User"; // Assuming 'name' field in user document
      });
      setUserNames(namesMap);
    };

    fetchUsers();
  }, []); // Run once on component mount

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrders((prev) => new Set(prev).add(orderId));

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      onStatusUpdate(orderId, newStatus); // Notify parent component to update its state
      toast({
        title: "Order Status Updated",
        description: `Order ${orderId} status updated to: ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Failed to Update Order Status",
        description: "Failed to update order status. Please try again.",
      });
    } finally {
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.trim();
    return statusOptions.find((option) => option.value.toLowerCase() === normalizedStatus.toLowerCase()) || statusOptions[0];
  };

  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const matchesOrderId = order.id && order.id.toLowerCase().includes(search.toLowerCase());
    const matchesOrderNumber = order.orderNumber && order.orderNumber.toString().includes(search);
    return matchesOrderId || matchesOrderNumber;
  });

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Order #</TableHead>
              <TableHead className="font-semibold text-gray-700">Token</TableHead>
              <TableHead className="font-semibold text-gray-700">User Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Items Ordered</TableHead>
              <TableHead className="font-semibold text-gray-700">Amount</TableHead>
              <TableHead className="font-semibold text-gray-700">Date</TableHead>
              <TableHead className="font-semibold text-gray-700">Time</TableHead>
              <TableHead className="font-semibold text-gray-700">Collection Slot</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-lg font-medium">No orders found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order, index) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                const isUpdating = updatingOrders.has(order.id);
                // Parse string timestamp for date/time
                const orderDateObj = order.timestamp ? new Date(order.timestamp) : null;
                const orderDate = orderDateObj ? orderDateObj.toLocaleDateString() : '';
                const orderTime = orderDateObj ? orderDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <TableRow key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <TableCell className="font-bold text-purple-600">{order.orderNumber ?? '-'}</TableCell>
                    <TableCell className="font-bold text-blue-600">{order.id}</TableCell>
                    <TableCell className="text-gray-700">{userNames[order.userId] || order.userId}</TableCell>
                    <TableCell>
                      <div className="max-w-xs sm:max-w-md overflow-hidden text-ellipsis text-gray-600 flex flex-wrap gap-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 mb-1">
                            <span>{item.name} (x{item.qty})</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">{order.orderDate || orderDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">{orderTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{order.collectionTimeSlot?.displayText || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className={`w-48 ${statusConfig.color}`}>
                            <SelectValue>{statusConfig.label}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => {
                              const OptionIcon = option.icon;
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <OptionIcon className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {isUpdating && <div className="text-sm text-blue-600 animate-pulse">Updating...</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setDetailsOrder(order); setDetailsOpen(true); }}>
                        More Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {detailsOrder && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Order Info</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(detailsOrder, null, 2)}</pre>
                  </div>
                  <div>
                    <h4 className="font-semibold">Payment Info</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{
                      (() => {
                        const payment = payments.find(p =>
                          (detailsOrder.razorpayOrderId && p.razorpay_order_id === detailsOrder.razorpayOrderId) ||
                          (p.userId === detailsOrder.userId && Math.abs(new Date(p.timestamp).getTime() - new Date(detailsOrder.timestamp).getTime()) < 5 * 60 * 1000)
                        );
                        return payment ? JSON.stringify(payment, null, 2) : 'No payment found';
                      })()
                    }</pre>
                  </div>
                  <div>
                    <h4 className="font-semibold">User Info</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{
                      (() => {
                        const user = users.find(u => u.email && detailsOrder.userId && (u.email === detailsOrder.userId || u.rollNo === detailsOrder.userId));
                        return user ? JSON.stringify(user, null, 2) : 'No user found';
                      })()
                    }</pre>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
