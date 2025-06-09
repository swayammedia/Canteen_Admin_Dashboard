"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Camera, Star, Clock } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  isAvailable: boolean
  preparationTime: number
  rating: number
  isVeg: boolean
  isSpicy: boolean
  calories?: number
  ingredients: string[]
}

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Veg Burger",
    description: "Delicious vegetarian burger with fresh vegetables and special sauce",
    price: 120,
    category: "Fast Food",
    image: "/placeholder.svg?height=200&width=200",
    isAvailable: true,
    preparationTime: 15,
    rating: 4.5,
    isVeg: true,
    isSpicy: false,
    calories: 350,
    ingredients: ["Bun", "Vegetable Patty", "Lettuce", "Tomato", "Onion", "Special Sauce"],
  },
  {
    id: "2",
    name: "Chicken Sandwich",
    description: "Grilled chicken sandwich with mayo and fresh vegetables",
    price: 150,
    category: "Fast Food",
    image: "/placeholder.svg?height=200&width=200",
    isAvailable: true,
    preparationTime: 12,
    rating: 4.3,
    isVeg: false,
    isSpicy: false,
    calories: 420,
    ingredients: ["Bread", "Grilled Chicken", "Mayo", "Lettuce", "Tomato"],
  },
  {
    id: "3",
    name: "Masala Dosa",
    description: "Traditional South Indian crispy dosa with spiced potato filling",
    price: 80,
    category: "South Indian",
    image: "/placeholder.svg?height=200&width=200",
    isAvailable: true,
    preparationTime: 20,
    rating: 4.7,
    isVeg: true,
    isSpicy: true,
    calories: 280,
    ingredients: ["Rice Batter", "Potato", "Onion", "Spices", "Curry Leaves"],
  },
  {
    id: "4",
    name: "Paneer Tikka",
    description: "Marinated cottage cheese cubes grilled to perfection",
    price: 180,
    category: "North Indian",
    image: "/placeholder.svg?height=200&width=200",
    isAvailable: false,
    preparationTime: 25,
    rating: 4.6,
    isVeg: true,
    isSpicy: true,
    calories: 320,
    ingredients: ["Paneer", "Yogurt", "Spices", "Bell Peppers", "Onion"],
  },
]

const categories = ["Fast Food", "South Indian", "North Indian", "Beverages", "Desserts", "Snacks"]

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Form state for adding/editing products
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    preparationTime: "",
    isVeg: true,
    isSpicy: false,
    calories: "",
    ingredients: "",
    image: "",
  })

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      category: formData.category,
      image: formData.image || "/placeholder.svg?height=200&width=200&query=" + encodeURIComponent(formData.name),
      isAvailable: true,
      preparationTime: Number.parseInt(formData.preparationTime),
      rating: 0,
      isVeg: formData.isVeg,
      isSpicy: formData.isSpicy,
      calories: formData.calories ? Number.parseInt(formData.calories) : undefined,
      ingredients: formData.ingredients
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item),
    }

    setProducts([...products, newProduct])
    setIsAddDialogOpen(false)
    resetForm()

    // Simulate API call to mobile app
    console.log("Product added to mobile app:", newProduct)
    alert("Product successfully added to mobile app!")
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      preparationTime: product.preparationTime.toString(),
      isVeg: product.isVeg,
      isSpicy: product.isSpicy,
      calories: product.calories?.toString() || "",
      ingredients: product.ingredients.join(", "),
      image: product.image,
    })
    setIsAddDialogOpen(true)
  }

  const handleUpdateProduct = () => {
    if (!editingProduct) return

    const updatedProduct: Product = {
      ...editingProduct,
      name: formData.name,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      category: formData.category,
      preparationTime: Number.parseInt(formData.preparationTime),
      isVeg: formData.isVeg,
      isSpicy: formData.isSpicy,
      calories: formData.calories ? Number.parseInt(formData.calories) : undefined,
      ingredients: formData.ingredients
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item),
      image: formData.image || editingProduct.image,
    }

    setProducts(products.map((p) => (p.id === editingProduct.id ? updatedProduct : p)))
    setIsAddDialogOpen(false)
    setEditingProduct(null)
    resetForm()

    console.log("Product updated in mobile app:", updatedProduct)
    alert("Product successfully updated in mobile app!")
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id))
      console.log("Product removed from mobile app:", id)
      alert("Product successfully removed from mobile app!")
    }
  }

  const toggleAvailability = (id: string) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p)))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      preparationTime: "",
      isVeg: true,
      isSpicy: false,
      calories: "",
      ingredients: "",
      image: "",
    })
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload to a cloud service
      const imageUrl = URL.createObjectURL(file)
      setFormData({ ...formData, image: imageUrl })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Product Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-sm text-gray-500">Add, edit, and manage food items for the mobile app</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Preparation Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    placeholder="Enter prep time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingredients (comma-separated)</Label>
                <Textarea
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="Enter ingredients separated by commas"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories (optional)</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    placeholder="Enter calories"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVeg"
                    checked={formData.isVeg}
                    onCheckedChange={(checked) => setFormData({ ...formData, isVeg: checked })}
                  />
                  <Label htmlFor="isVeg">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isSpicy"
                    checked={formData.isSpicy}
                    onCheckedChange={(checked) => setFormData({ ...formData, isSpicy: checked })}
                  />
                  <Label htmlFor="isSpicy">Spicy</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <div className="flex items-center space-x-2">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="flex-1" />
                  <Button type="button" variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image || "/placeholder.svg"}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingProduct(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">₹{product.price}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.isVeg && <Badge className="bg-green-100 text-green-800">Veg</Badge>}
                        {product.isSpicy && <Badge className="bg-red-100 text-red-800">Spicy</Badge>}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {product.preparationTime}m
                        </div>
                        {product.rating > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {product.rating}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch checked={product.isAvailable} onCheckedChange={() => toggleAvailability(product.id)} />
                        <span className={`text-sm ${product.isAvailable ? "text-green-600" : "text-red-600"}`}>
                          {product.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
