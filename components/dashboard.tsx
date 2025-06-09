"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, IndianRupee, TrendingUp, Calendar, Clock, Users, ShoppingBag, Plus } from "lucide-react"
import OrdersTable from "./orders-table"
import ProductManagement from "./product-management"
import { Button } from "@/components/ui/button"

// Sample data for the orders with timestamps
const initialOrders = [
  {
    id: "1",
    tokenNumber: "A001",
    email: "student1@college.edu",
    items: "Veg Burger, French Fries, Coke",
    amount: 250,
    status: "Paid",
    orderDate: "2024-01-15",
    orderTime: "12:30 PM",
    timestamp: new Date("2024-01-15T12:30:00"),
  },
  {
    id: "2",
    tokenNumber: "A002",
    email: "student2@college.edu",
    items: "Chicken Sandwich, Coffee",
    amount: 180,
    status: "Delivered",
    orderDate: "2024-01-15",
    orderTime: "01:15 PM",
    timestamp: new Date("2024-01-15T13:15:00"),
  },
  {
    id: "3",
    tokenNumber: "A003",
    email: "professor@college.edu",
    items: "Veg Biryani, Raita, Water Bottle",
    amount: 220,
    status: "Paid",
    orderDate: "2024-01-14",
    orderTime: "02:45 PM",
    timestamp: new Date("2024-01-14T14:45:00"),
  },
  {
    id: "4",
    tokenNumber: "A004",
    email: "student3@college.edu",
    items: "Masala Dosa, Tea",
    amount: 120,
    status: "Delivered",
    orderDate: "2024-01-14",
    orderTime: "11:20 AM",
    timestamp: new Date("2024-01-14T11:20:00"),
  },
  {
    id: "5",
    tokenNumber: "A005",
    email: "staff@college.edu",
    items: "Paneer Tikka, Naan, Lassi",
    amount: 350,
    status: "Paid",
    orderDate: "2024-01-13",
    orderTime: "01:00 PM",
    timestamp: new Date("2024-01-13T13:00:00"),
  },
  {
    id: "6",
    tokenNumber: "A006",
    email: "student4@college.edu",
    items: "Samosa, Chai",
    amount: 80,
    status: "Delivered",
    orderDate: "2024-01-13",
    orderTime: "04:30 PM",
    timestamp: new Date("2024-01-13T16:30:00"),
  },
  {
    id: "7",
    tokenNumber: "A007",
    email: "student5@college.edu",
    items: "Pasta, Garlic Bread, Cold Drink",
    amount: 280,
    status: "Paid",
    orderDate: "2024-01-12",
    orderTime: "12:15 PM",
    timestamp: new Date("2024-01-12T12:15:00"),
  },
]

// Monthly earnings data
const monthlyEarnings = {
  "2024-01": { amount: 25600, change: 12, orders: 156 },
  "2023-12": { amount: 22800, change: 8, orders: 142 },
  "2023-11": { amount: 21100, change: -3, orders: 138 },
  "2023-10": { amount: 21800, change: 15, orders: 145 },
  "2023-09": { amount: 18900, change: 5, orders: 128 },
  "2023-08": { amount: 18000, change: 22, orders: 120 },
}

const months = [
  { value: "2024-01", label: "January 2024" },
  { value: "2023-12", label: "December 2023" },
  { value: "2023-11", label: "November 2023" },
  { value: "2023-10", label: "October 2023" },
  { value: "2023-09", label: "September 2023" },
  { value: "2023-08", label: "August 2023" },
]

// Add the onLogout prop to the component interface
interface DashboardProps {
  onLogout: () => void
}

// Update the component definition to accept the onLogout prop
export default function Dashboard({ onLogout }: DashboardProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("2024-01")
  const [activeTab, setActiveTab] = useState("orders")

  const handleMarkAsDelivered = (id: string) => {
    setOrders(orders.map((order) => (order.id === id ? { ...order, status: "Delivered" } : order)))
  }

  const filteredOrders = orders.filter((order) => order.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()))

  const currentMonthData = monthlyEarnings[selectedMonth]
  const deliveredOrders = orders.filter((order) => order.status === "Delivered").length
  const pendingOrders = orders.filter((order) => order.status === "Paid").length

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
                onClick={onLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <IndianRupee className="h-6 w-6 text-blue-100 mr-2" />
                <span className="text-3xl font-bold">₹{currentMonthData.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-blue-100">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{currentMonthData.change}% from last month</span>
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
                <span className="text-3xl font-bold">{currentMonthData.orders}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-green-100">
                <Users className="h-4 w-4 mr-1" />
                <span>This month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Delivered Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-3xl font-bold">{deliveredOrders}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-orange-100">
                <span>Completed successfully</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-purple-100 mr-2" />
                <span className="text-3xl font-bold">{pendingOrders}</span>
              </div>
              <div className="flex items-center mt-2 text-sm text-purple-100">
                <span>Awaiting delivery</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Orders and Products */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-96">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Orders Management
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Product Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Enhanced Search Bar */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search by Token Number (e.g., A001)"
                    className="pl-10 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Recent Orders</CardTitle>
                <p className="text-sm text-gray-500">Manage and track all canteen orders</p>
              </CardHeader>
              <CardContent className="p-0">
                <OrdersTable orders={filteredOrders} onMarkAsDelivered={handleMarkAsDelivered} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <ProductManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
