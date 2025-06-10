"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Search, ChefHat, Package, CheckCircle } from "lucide-react"
import { useState } from "react"

interface Order {
  id: string
  tokenNumber: string
  email: string
  items: string
  amount: number
  status: string
  orderDate: string
  orderTime: string
  timestamp: Date
}

interface OrdersTableProps {
  orders: Order[]
  onStatusUpdate: (id: string, newStatus: string) => void
}

const statusOptions = [
  {
    value: "Preparing the Order",
    label: "Preparing the Order",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: ChefHat,
  },
  {
    value: "Collect your order",
    label: "Collect your order",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Package,
  },
  {
    value: "Order Delivered",
    label: "Order Delivered",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle,
  },
]

export default function OrdersTable({ orders, onStatusUpdate }: OrdersTableProps) {
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrders((prev) => new Set(prev).add(orderId))

    // Simulate API call delay
    setTimeout(() => {
      onStatusUpdate(orderId, newStatus)
      setUpdatingOrders((prev) => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }, 500)
  }

  const getStatusConfig = (status: string) => {
    return statusOptions.find((option) => option.value === status) || statusOptions[0]
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">Token</TableHead>
              <TableHead className="font-semibold text-gray-700">User Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Items Ordered</TableHead>
              <TableHead className="font-semibold text-gray-700">Amount</TableHead>
              <TableHead className="font-semibold text-gray-700">Date</TableHead>
              <TableHead className="font-semibold text-gray-700">Time</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Update Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Search className="h-12 w-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">All paid orders will appear here</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => {
                const statusConfig = getStatusConfig(order.status)
                const StatusIcon = statusConfig.icon
                const isUpdating = updatingOrders.has(order.id)

                return (
                  <TableRow key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <TableCell className="font-bold text-blue-600">{order.tokenNumber}</TableCell>
                    <TableCell className="text-gray-700">{order.email}</TableCell>
                    <TableCell>
                      <div className="max-w-xs sm:max-w-md overflow-hidden text-ellipsis text-gray-600">
                        {order.items}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">₹{order.amount}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">{order.orderDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">{order.orderTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusConfig.color} font-medium flex items-center gap-1 w-fit`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => {
                              const OptionIcon = option.icon
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <OptionIcon className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        {isUpdating && <div className="text-sm text-blue-600 animate-pulse">Updating...</div>}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
