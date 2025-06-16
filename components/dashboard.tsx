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
  Calendar,
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
import { Item, Order } from "@/types/common-interfaces"

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

        const itemsPromises = Array.isArray(data.items) ? data.items.map(async (item: any) => {
          let resolvedCategoryId = item.categoryId || '';
          let resolvedCategoryName = item.categoryName || '';
          let fetchedItemData: any = null; // Initialize to null

          if (!resolvedCategoryId && !item.categoryRef && item.id) {
            try {
              const itemDoc = await getDoc(doc(db, "items", item.id));
              if (itemDoc.exists()) {
                fetchedItemData = itemDoc.data(); // Assign data if doc exists
                resolvedCategoryId = fetchedItemData.categoryId || fetchedItemData.category?.toLowerCase().replace(/\s/g, '') || '';
                resolvedCategoryName = fetchedItemData.categoryName || fetchedItemData.category || '';
              }
            } catch (error) {
              console.error("Error fetching item details for order item:", item.id, error);
            }
          }

          return {
            id: item.id || fetchedItemData?.id || '',
            name: item.name || fetchedItemData?.name || '',
            price: item.price || fetchedItemData?.price || 0,
            category: resolvedCategoryName || item.category || fetchedItemData?.category || '',
            categoryId: resolvedCategoryId || item.categoryId || fetchedItemData?.categoryId || '',
            categoryName: resolvedCategoryName || item.categoryName || fetchedItemData?.categoryName || '',
            imageUrl: item.imageUrl || fetchedItemData?.imageUrl || '',
            qty: item.qty || fetchedItemData?.qty || 0,
            defaultOrderStatus: item.defaultOrderStatus || fetchedItemData?.defaultOrderStatus || 'Preparing',
            categoryRef: item.categoryRef || fetchedItemData?.categoryRef || undefined,
          };
        }) : [];

        const items = await Promise.all(itemsPromises);

        return {
          id: orderDoc.id,
          userId: data.userId || '',
          items: items,
          totalAmount: data.totalAmount || 0,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp : new Timestamp(0, 0),
          status: data.status || 'Preparing the Order',
          collectionTimeSlot: data.collectionTimeSlot || undefined,
          blockUntil: data.blockUntil || undefined,
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

    const unsubscribeCategories = fetchCategories()

    return () => {
      unsubscribeOrders()
    }
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, { status: newStatus })
      alert(`Order status updated to: ${newStatus}`)
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("Failed to update order status. Please try again.")
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const orderDate = order.timestamp.toDate()
    const orderMonth = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}`
    const matchesMonth = selectedMonth === orderMonth

    const matchesCategory = selectedOrderCategory === "all" ||
      order.items.some(item => item.categoryId === selectedOrderCategory);

    return matchesSearch && matchesMonth && matchesCategory;
  })

  const currentMonthData = monthlyEarningsData[selectedMonth]

  const deliveredOrders = orders.filter((order) => order.status === "Delivered").length
  const preparingOrders = orders.filter((order) => order.status === "Preparing").length
  const readyOrders = orders.filter((order) => order.status === "Ready").length

  const downloadDailyOrders = () => {
    setIsDownloading(true)

    try {
      const today = new Date()
      const todayString = today.toISOString().split("T")[0]
      const todayOrders = orders.filter((order) => {
        const orderDate = order.timestamp.toDate()
        return orderDate.getFullYear() === today.getFullYear() &&
          orderDate.getMonth() === today.getMonth() &&
          orderDate.getDate() === today.getDate()
      })

      const excelData = todayOrders.map((order) => ({
        "Order ID": order.id,
        "User Name": order.userId,
        "Items Ordered": order.items.map(item => `${item.name} (x${item.qty})`).join(", "),
        "Amount (₹)": order.totalAmount,
        Date: order.timestamp.toDate().toLocaleDateString(),
        Time: order.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Status: order.status,
      }))

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

      alert(`Downloaded ${todayOrders.length} orders for ${todayString} as Excel file`)
    } catch (error) {
      console.error("Error generating Excel file:", error)
      alert("Error generating Excel file. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

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
                <Calendar className="h-4 w-4 text-gray-500" />
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
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className={`${currentMonthData && currentMonthData.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {currentMonthData && currentMonthData.change >= 0 ? "+" : ""}
                  {currentMonthData?.change || 0}% from last month
                </span>
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
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto mb-6 bg-gray-100 p-1 rounded-lg shadow-sm">
            <TabsTrigger value="orders" className="py-2">
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="py-2">
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Recent Orders</h3>
              <div className="flex gap-4">
                <Select value={selectedOrderCategory} onValueChange={setSelectedOrderCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={downloadDailyOrders} disabled={isDownloading}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download Today's Orders"}
                  </Button>
                </div>
            </div>
                <OrdersTable 
                  orders={filteredOrders} 
                  onStatusUpdate={handleStatusUpdate} 
                />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
