"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Camera, Search } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, DocumentReference } from "firebase/firestore"

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  quantity: number;
  categoryRef?: DocumentReference; // Optional, as it might not always be present or needed for display
  defaultOrderStatus: string;
}

interface Category {
  id: string;
  name: string;
}

// const initialProducts: Item[] = [
//   {
//     id: "1",
//     name: "Veg Burger",
//     description: "",
//     price: 120,
//     category: "Fast Food",
//     categoryId: "",
//     categoryName: "Fast Food",
//     imageUrl: "/placeholder.svg?height=200&width=200",
//     quantity: 1,
//     defaultOrderStatus: "Preparing",
//   },
// ];

// const categories = ["Fast Food", "South Indian", "North Indian", "Beverages", "Desserts", "Snacks"];

export default function ProductManagement() {
  const [products, setProducts] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Form state for adding/editing products
  const [formData, setFormData] = useState<Omit<Item, "id" | "quantity" | "defaultOrderStatus"> & { price: string }>({ // price as string for input
    name: "",
    description: "",
    price: "",
    category: "", // This will store the category ID
    categoryId: "",
    categoryName: "",
    imageUrl: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesCol = collection(db, "categories");
      const categorySnapshot = await getDocs(categoriesCol);
      const categoryList = categorySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      })) as Category[];
      setCategories(categoryList);
    };

    const fetchProducts = async () => {
      const itemsCol = collection(db, "items");
      const itemSnapshot = await getDocs(itemsCol);
      const itemList = itemSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[];
      setProducts(itemList);
    };

    fetchCategories();
    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    // Find the selected category name and ref based on the categoryId in formData
    const selectedCat = categories.find(cat => cat.id === formData.category);
    if (!selectedCat) {
      alert("Please select a valid category.");
      return;
    }

    try {
      const newItemData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: selectedCat.name, // Storing category name
        categoryId: selectedCat.id, // Storing category ID
        categoryName: selectedCat.name,
        imageUrl: formData.imageUrl || "/placeholder.svg?height=200&width=200&query=" + encodeURIComponent(formData.name),
        quantity: 1, // Default quantity
        defaultOrderStatus: "Preparing",
        categoryRef: doc(db, "categories", selectedCat.id), // Firestore DocumentReference
      };

      const docRef = await addDoc(collection(db, "items"), newItemData);
      setProducts(prev => [...prev, { id: docRef.id, ...newItemData }]);
      setIsAddDialogOpen(false);
      resetForm();
      alert("Product successfully added!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product. Please try again.");
    }
  };

  const handleEditProduct = (product: Item) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.categoryId, // Set the category ID for the select input
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      imageUrl: product.imageUrl,
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    const selectedCat = categories.find(cat => cat.id === formData.category);
    if (!selectedCat) {
      alert("Please select a valid category.");
      return;
    }

    try {
      const updatedItemData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: selectedCat.name,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        imageUrl: formData.imageUrl || editingProduct.imageUrl,
        categoryRef: doc(db, "categories", selectedCat.id), // Ensure correct reference
      };

      const itemDocRef = doc(db, "items", editingProduct.id);
      await updateDoc(itemDocRef, updatedItemData);

      setProducts(prev => prev.map(p => (p.id === editingProduct.id ? { ...p, ...updatedItemData, id: p.id } : p)));
      setIsAddDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      alert("Product successfully updated!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product. Please try again.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "items", id));
        setProducts(prev => prev.filter(p => p.id !== id));
        alert("Product successfully removed!");
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error removing product. Please try again.");
      }
    }
  };

  const toggleAvailability = async (id: string, currentAvailability: boolean) => {
    try {
      const itemDocRef = doc(db, "items", id);
      await updateDoc(itemDocRef, { isAvailable: !currentAvailability });
      setProducts(prev => prev.map(p => (p.id === id ? { ...p, isAvailable: !currentAvailability } : p)));
      alert("Product availability updated!");
    } catch (error) {
      console.error("Error toggling availability:", error);
      alert("Error updating product availability. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      categoryId: "",
      categoryName: "",
      imageUrl: "",
    });
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a cloud service like Firebase Storage
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, imageUrl: imageUrl });
    }
  };

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
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    const selectedCat = categories.find(cat => cat.id === value);
                    setFormData({ ...formData, category: value, categoryId: value, categoryName: selectedCat?.name || "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image URL</Label>
                <Input
                  id="image"
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="Enter image URL or upload"
                />
                <div className="flex items-center space-x-2">
                  <Input id="file-image" type="file" accept="image/*" onChange={handleImageUpload} className="flex-1" />
                  <Button type="button" variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imageUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingProduct(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
                {editingProduct ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
      </div>

      {/* Product Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <img
                          src={product.imageUrl || "/placeholder.svg"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                        <p className="text-sm text-gray-500">{product.description}</p>
                      </TableCell>
                      <TableCell>{product.categoryName}</TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={product.quantity > 0 ? "default" : "destructive"}>
                          {product.quantity > 0 ? "Available" : "Unavailable"}
                        </Badge>
                        <Switch
                          checked={product.quantity > 0}
                          onCheckedChange={() => toggleAvailability(product.id, product.quantity > 0)}
                          className="ml-2"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
