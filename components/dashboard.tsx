"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  IndianRupee,
  TrendingUp,
  Clock,
  Users,
  ShoppingBag,
  Plus,
  CheckCircle,
  FileSpreadsheet,
  ChefHat,
} from "lucide-react"
import OrdersTable from "./orders-table"
import ProductManagement from "./product-management"
import { Button } from "@/components/ui/button"
import { utils, write } from "xlsx"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, getDoc } from "firebase/firestore"
import { Item, Order, Payment, User } from "@/types/common-interfaces"
import { toast } from "@/hooks/use-toast"
import PaymentsTable from "./payments-table"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isWithinInterval, parseISO } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Category {
  id: string;
  name: string;
}

const generateMonths = () => {
  const monthsArray = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) { // Generate last 12 months
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    monthsArray.push({ value, label });
  }
  return monthsArray;
};

export default function Dashboard({ /* onLogout */ }: {}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [months, setMonths] = useState(generateMonths())
  const [selectedMonth, setSelectedMonth] = useState(months[0].value)
  const [selectedOrderCategory, setSelectedOrderCategory] = useState("all")
  const [activeTab, setActiveTab] = useState("orders")
  const [isDownloading, setIsDownloading] = useState(false)
  const { user, signOut } = useAuth()
  const [monthlyEarningsData, setMonthlyEarningsData] = useState<{ [key: string]: { amount: number; change: number; orders: number } }>({})
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [exportDate, setExportDate] = useState<Date | null>(null);
  const [exportWeek, setExportWeek] = useState<Date | null>(null);
  const [exportMonth, setExportMonth] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    setMonths(generateMonths())
    setSelectedMonth(generateMonths()[0].value)

    const fetchCategories = async () => {
      const categoriesCol = collection(db, "categories")
      const categorySnapshot = await onSnapshot(categoriesCol, (snapshot) => {
        const categoryList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        })) as Category[]
        setCategories(categoryList)
      })
      return categorySnapshot
    }

    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"))
    const unsubscribeOrders = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
      }

      const ordersListPromises = snapshot.docs.map(async (orderDoc) => {
        const data = orderDoc.data();
        const items = Array.isArray(data.items) ? data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          status: item.status,
          imageUrl: item.imageUrl,
        })) : [];

        return {
          id: orderDoc.id,
          userId: data.userId || '',
          items: items,
          totalAmount: data.totalAmount || 0,
          timestamp: data.timestamp || '',
          status: data.status || '',
          collectionTimeSlot: data.collectionTimeSlot || undefined,
          orderDate: data.orderDate || '',
          orderNumber: data.orderNumber || undefined,
          razorpayOrderId: data.razorpayOrderId || '',
          blockUntil: data.blockUntil || undefined,
          displayText: data.collectionTimeSlot?.displayText || '',
        };
      });
      const ordersList = await Promise.all(ordersListPromises);
      setOrders(ordersList as Order[]);

      const earnings: { [key: string]: { amount: number; orders: number } } = {};
      ordersList.forEach(order => {
        const date = order.timestamp instanceof Timestamp ? order.timestamp.toDate() : new Date();
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        if (!earnings[yearMonth]) {
          earnings[yearMonth] = { amount: 0, orders: 0 }
        }
        earnings[yearMonth].amount += order.totalAmount
        earnings[yearMonth].orders += 1
      })

      const calculatedMonthlyEarnings: { [key: string]: { amount: number; change: number; orders: number } } = {}
      months.forEach((month, index) => {
        const currentMonthTotal = earnings[month.value]?.amount || 0
        const currentMonthOrders = earnings[month.value]?.orders || 0
        let change = 0

        if (index < months.length - 1) {
          const previousMonthValue = months[index + 1].value
          const previousMonthTotal = earnings[previousMonthValue]?.amount || 0
          if (previousMonthTotal > 0) {
            change = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
          }
        }
        calculatedMonthlyEarnings[month.value] = {
          amount: currentMonthTotal,
          change: parseFloat(change.toFixed(2)),
          orders: currentMonthOrders,
        }
      })
      setMonthlyEarningsData(calculatedMonthlyEarnings)
    })

    // Fetch payments
    const paymentsCol = collection(db, "payments");
    const unsubscribePayments = onSnapshot(paymentsCol, (snapshot) => {
      const paymentList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          amount: data.amount,
          method: data.method,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          status: data.status,
          timestamp: data.timestamp ? (typeof data.timestamp === 'string' ? data.timestamp : data.timestamp.toDate().toISOString()) : '',
          userId: data.userId,
          verified: data.verified,
        };
      });
      setPayments(paymentList as Payment[]);
    });

    // Fetch users
    const usersCol = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersCol, (snapshot) => {
      const userList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toDate().toISOString()) : '',
          email: data.email,
          isAdmin: data.isAdmin,
          isCashier: data.isCashier,
          name: data.name,
          phone: data.phone,
          profileComplete: data.profileComplete,
          rollNo: data.rollNo,
          uid: doc.id,
        };
      });
      setUsers(userList as User[]);
    });

    const unsubscribeCategories = fetchCategories()

    return () => {
      unsubscribeOrders()
      unsubscribePayments()
      unsubscribeUsers()
    }
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, { status: newStatus })
      toast({
        title: "Order status updated",
        description: `Order status updated to: ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Failed to update order status",
        description: "Failed to update order status. Please try again.",
      })
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      orderSearch === "" ||
      (order.id && order.id.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (order.orderNumber && order.orderNumber.toString().includes(orderSearch));
    // Month filter
    const orderDateObj = order.timestamp ? new Date(order.timestamp) : null;
    const orderMonth = orderDateObj ? `${orderDateObj.getFullYear()}-${(orderDateObj.getMonth() + 1).toString().padStart(2, '0')}` : '';
    const matchesMonth = selectedMonth === orderMonth;
    return matchesSearch && matchesMonth;
  })

  const currentMonthData = monthlyEarningsData[selectedMonth]

  const deliveredOrders = filteredOrders.filter((order) => order.status === "Delivered").length
  const preparingOrders = filteredOrders.filter((order) => order.status === "Preparing").length
  const readyOrders = filteredOrders.filter((order) => order.status === "Ready").length

  const downloadDailyOrders = () => {
    setIsDownloading(true)

    try {
      const today = new Date()
      const todayString = today.toISOString().split("T")[0]
      const todayOrders = orders.filter((order) => {
        const orderDateObj = order.timestamp ? new Date(order.timestamp) : null;
        return orderDateObj &&
          orderDateObj.getFullYear() === today.getFullYear() &&
          orderDateObj.getMonth() === today.getMonth() &&
          orderDateObj.getDate() === today.getDate();
      })

      const excelData = todayOrders.map((order) => {
        const orderDateObj = order.timestamp ? new Date(order.timestamp) : null;
        return {
        "Order ID": order.id,
        "User Name": order.userId,
        "Items Ordered": order.items.map(item => `${item.name} (x${item.qty})`).join(", "),
        "Amount (₹)": order.totalAmount,
          Date: orderDateObj ? orderDateObj.toLocaleDateString() : '',
          Time: orderDateObj ? orderDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        Status: order.status,
        }
      })

      const worksheet = utils.json_to_sheet(excelData)
      const workbook = utils.book_new()
      utils.book_append_sheet(workbook, worksheet, "Orders")

      const columnWidths = [
        { wch: 20 },
        { wch: 30 },
        { wch: 50 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
      ]
      worksheet["!cols"] = columnWidths

      const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" })

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `canteen-orders-${todayString}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Downloaded orders",
        description: `Downloaded ${todayOrders.length} orders for ${todayString} as Excel file`,
      })
    } catch (error) {
      console.error("Error generating Excel file:", error)
      toast({
        title: "Error generating Excel file",
        description: "Error generating Excel file. Please try again.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Export helpers
  const exportOrders = (ordersToExport: Order[], label: string) => {
    setIsExporting(true);
    try {
      const excelData = ordersToExport.map((order) => ({
        "Order ID": order.id,
        "Order #": order.orderNumber,
        "User ID": order.userId,
        "Items Ordered": order.items.map(item => `${item.name} (x${item.qty})`).join(", "),
        "Amount (₹)": order.totalAmount,
        Date: order.orderDate || (order.timestamp ? new Date(order.timestamp).toLocaleDateString() : ''),
        Time: order.timestamp ? new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        Status: order.status,
        "Collection Slot": order.collectionTimeSlot?.displayText || '',
      }));
      const worksheet = utils.json_to_sheet(excelData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Orders");
      worksheet["!cols"] = [
        { wch: 20 }, { wch: 10 }, { wch: 30 }, { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }
      ];
      const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${label}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating Excel file:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter helpers
  const ordersForDay = exportDate
    ? orders.filter(order => isSameDay(parseISO(order.timestamp), exportDate))
    : [];
  const ordersForWeek = exportWeek
    ? orders.filter(order => isWithinInterval(parseISO(order.timestamp), { start: startOfWeek(exportWeek, { weekStartsOn: 1 }), end: endOfWeek(exportWeek, { weekStartsOn: 1 }) }))
    : [];
  const ordersForMonth = exportMonth
    ? orders.filter(order => isWithinInterval(parseISO(order.timestamp), { start: startOfMonth(exportMonth), end: endOfMonth(exportMonth) }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-10">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Canteen Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage orders, products and track earnings</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              {user && <span className="text-sm text-gray-700">Welcome, {user.email}</span>}
              <div className="flex items-center space-x-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={signOut}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <IndianRupee className="h-6 w-6 text-blue-100 mr-2" />
                <span className="text-3xl font-bold">₹{(currentMonthData?.amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-blue-100">
                Revenue this month
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingBag className="h-6 w-6 text-green-100 mr-2" />
                <span className="text-3xl font-bold">{currentMonthData?.orders || 0}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-green-100">
                <Users className="h-4 w-4 mr-1" />
                <span>This month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Preparing Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-orange-100 mr-2" />
                <span className="text-3xl font-bold">{preparingOrders}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-orange-100">
                <span>Currently being prepared</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Ready for Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-3xl font-bold">{readyOrders}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-purple-100">
                <span>Awaiting pickup</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Delivered Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-emerald-100 mr-2" />
                <span className="text-3xl font-bold">{deliveredOrders}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-emerald-100">
                <span>Successfully completed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-6 bg-gray-100 p-1 rounded-lg shadow-sm">
            <TabsTrigger value="orders" className="py-2">Orders</TabsTrigger>
            <TabsTrigger value="payments" className="py-2">Payments</TabsTrigger>
            <TabsTrigger value="products" className="py-2">Products</TabsTrigger>
          </TabsList>
          <TabsContent value="orders">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow" onClick={() => setExportModalOpen(true)}>
                Export Orders
              </Button>
              <Input
                placeholder="Search by Order # or Order ID"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="w-full max-w-xs"
              />
            </div>
            <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Export Orders</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Day picker */}
                  <div className="flex gap-2 items-center">
                    <DatePicker
                      selected={exportDate ?? undefined}
                      onChange={date => setExportDate(date as Date)}
                      dateFormat="PPP"
                      placeholderText="Pick a day"
                      className="border rounded px-3 py-2"
                      isClearable
                    />
                    <Button onClick={() => exportOrders(ordersForDay, exportDate ? format(exportDate, 'yyyy-MM-dd') : 'day')} disabled={!exportDate || isExporting} className="bg-green-600 text-white hover:bg-green-700 font-semibold">
                      Export Day
                    </Button>
                  </div>
                  {/* Week picker */}
                  <div className="flex gap-2 items-center">
                    <DatePicker
                      selected={exportWeek ?? undefined}
                      onChange={date => setExportWeek(date as Date)}
                      dateFormat="wo 'week of' MMMM yyyy"
                      showWeekNumbers
                      placeholderText="Pick a week"
                      className="border rounded px-3 py-2"
                      isClearable
                    />
                    <Button onClick={() => exportOrders(ordersForWeek, exportWeek ? `week-${format(startOfWeek(exportWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd')}` : 'week')} disabled={!exportWeek || isExporting} className="bg-green-600 text-white hover:bg-green-700 font-semibold">
                      Export Week
                    </Button>
                  </div>
                  {/* Month picker */}
                  <div className="flex gap-2 items-center">
                    <DatePicker
                      selected={exportMonth ?? undefined}
                      onChange={date => setExportMonth(date as Date)}
                      dateFormat="MMMM yyyy"
                      showMonthYearPicker
                      placeholderText="Pick a month"
                      className="border rounded px-3 py-2"
                      isClearable
                    />
                    <Button onClick={() => exportOrders(ordersForMonth, exportMonth ? format(exportMonth, 'yyyy-MM') : 'month')} disabled={!exportMonth || isExporting} className="bg-green-600 text-white hover:bg-green-700 font-semibold">
                      Export Month
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExportModalOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <OrdersTable orders={filteredOrders} onStatusUpdate={handleStatusUpdate} payments={payments} users={users} search={orderSearch} />
          </TabsContent>
          <TabsContent value="payments">
            <div className="mb-4 flex justify-end">
              <Input
                placeholder="Search by Order #, or Order ID"
                value={paymentSearch}
                onChange={e => setPaymentSearch(e.target.value)}
                className="w-full max-w-xs"
              />
            </div>
            <PaymentsTable payments={payments} users={users} orders={orders} search={paymentSearch} />
          </TabsContent>
          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
