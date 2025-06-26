import { Payment, User, Order } from "@/types/common-interfaces";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PaymentsTableProps {
  payments: Payment[];
  users: User[];
  orders: Order[];
  search: string;
}

export default function PaymentsTable({ payments, users, orders, search }: PaymentsTableProps) {
  const filteredPayments = payments.filter(payment => {
    if (!search) return true;
    // Match by order id or order number
    const order = orders.find(o =>
      (o.razorpayOrderId && o.razorpayOrderId === payment.razorpay_order_id) ||
      (o.userId === payment.userId && Math.abs(new Date(o.timestamp).getTime() - new Date(payment.timestamp).getTime()) < 5 * 60 * 1000)
    );
    const matchesOrderId = order && order.id && order.id.toLowerCase().includes(search.toLowerCase());
    const matchesOrderNumber = order && order.orderNumber && order.orderNumber.toString().includes(search);
    return matchesOrderId || matchesOrderNumber;
  });
  return (
    <div className="w-full max-w-7xl mx-auto my-8 p-6 bg-white rounded-lg shadow-lg" style={{ minHeight: '70vh' }}>
      <Table className="w-full">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">Amount</TableHead>
            <TableHead className="font-semibold text-gray-700">Method</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="font-semibold text-gray-700">Timestamp</TableHead>
            <TableHead className="font-semibold text-gray-700">User</TableHead>
            <TableHead className="font-semibold text-gray-700">Order ID</TableHead>
            <TableHead className="font-semibold text-gray-700">Order #</TableHead>
            <TableHead className="font-semibold text-gray-700">Razorpay Order ID</TableHead>
            <TableHead className="font-semibold text-gray-700">Razorpay Payment ID</TableHead>
            <TableHead className="font-semibold text-gray-700">Verified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            filteredPayments.map((payment, idx) => {
              const user = users.find(u => u.email === payment.userId || u.rollNo === payment.userId);
              const order = orders.find(o =>
                (o.razorpayOrderId && o.razorpayOrderId === payment.razorpay_order_id) ||
                (o.userId === payment.userId && Math.abs(new Date(o.timestamp).getTime() - new Date(payment.timestamp).getTime()) < 5 * 60 * 1000)
              );
              return (
                <TableRow key={payment.razorpay_payment_id || idx}>
                  <TableCell>₹{payment.amount}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{payment.status}</TableCell>
                  <TableCell>{payment.timestamp ? new Date(payment.timestamp).toLocaleString() : '-'}</TableCell>
                  <TableCell>{user ? `${user.name} (${user.email})` : payment.userId}</TableCell>
                  <TableCell>{order ? order.id : '-'}</TableCell>
                  <TableCell>{order && order.orderNumber !== undefined ? order.orderNumber : '-'}</TableCell>
                  <TableCell>{payment.razorpay_order_id}</TableCell>
                  <TableCell>{payment.razorpay_payment_id}</TableCell>
                  <TableCell>{payment.verified ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
} 