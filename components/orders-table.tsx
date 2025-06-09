"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Check, Calendar, Clock, Search } from "lucide-react"

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
  onMarkAsDelivered: (id: string) => void
}

export default function OrdersTable({ orders, onMarkAsDelivered }: OrdersTableProps) {
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
              <TableHead className="font-semibold text-gray-700">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Search className="h-12 w-12 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, index) => (
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
                      variant={order.status === "Delivered" ? "outline" : "default"}
                      className={
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-800 border-green-300 font-medium"
                          : "bg-orange-100 text-orange-800 border-orange-300 font-medium"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={order.status === "Delivered" ? "outline" : "default"}
                      className={`flex items-center gap-1 transition-all duration-200 ${
                        order.status === "Delivered"
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                      }`}
                      onClick={() => onMarkAsDelivered(order.id)}
                      disabled={order.status === "Delivered"}
                    >
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {order.status === "Delivered" ? "Delivered" : "Mark as Delivered"}
                      </span>
                      <span className="sm:hidden">{order.status === "Delivered" ? "Done" : "Deliver"}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
