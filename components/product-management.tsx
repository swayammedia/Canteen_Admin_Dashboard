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
import { Plus, Edit, Trash2, Camera, Search } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, DocumentReference, getDoc, query, where, writeBatch } from "firebase/firestore"

interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  quantity: number;
  categoryRef?: DocumentReference; // Optional, as it might not always be present or needed for display
  defaultOrderStatus: string;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // New state for category management
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: "" });

  // Log selectedCategory change
  useEffect(() => {
  }, [selectedCategory]);

  // Form state for adding/editing products
  const [formData, setFormData] = useState<Omit<Item, "id" | "isAvailable" | "categoryRef"> & { price: string }>({ // price as string for input
    name: "",
    price: "",
    category: "", 
    categoryId: "",
    categoryName: "",
    imageUrl: "",
    quantity: 1, 
    defaultOrderStatus: "Preparing",
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
      const itemListPromises = itemSnapshot.docs.map(async (docRef) => {
        const data = docRef.data() as Item; // Explicitly cast data to Item
        let categoryId = data.categoryId ?? '';
        let categoryName = data.categoryName ?? '';

        // If categoryId is missing or empty, try to get it from categoryRef or normalize categoryName
        if (!categoryId || categoryId === '') {
          if (data.categoryRef) {
            try {
              const categoryDoc = await getDoc(data.categoryRef);
              if (categoryDoc.exists()) {
                categoryId = categoryDoc.id;
                categoryName = categoryDoc.data().name || '';
              }
            } catch (error) {
              console.error("Error fetching category from reference:", data.categoryRef.path, error);
            }
          } else if (categoryName) {
            // Fallback: if categoryId is still empty but categoryName exists, use normalized categoryName as ID
            categoryId = categoryName.toLowerCase().replace(/\s/g, '');
          }
        }

        return {
          id: docRef.id,
          name: data.name,
          price: data.price,
          category: categoryName, // Use resolved categoryName
          categoryId: categoryId, // Use resolved categoryId
          categoryName: categoryName, // Use resolved categoryName
          imageUrl: data.imageUrl,
          quantity: data.quantity,
          defaultOrderStatus: data.defaultOrderStatus,
          isAvailable: data.hasOwnProperty('isAvailable') ? data.isAvailable : true,
          categoryRef: data.categoryRef || undefined,
        } as Item; 
      });

      const itemList = await Promise.all(itemListPromises);
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
        price: Number.parseFloat(formData.price),
        category: selectedCat.name, // Storing category name
        categoryId: selectedCat.id, // Storing category ID
        categoryName: selectedCat.name,
        imageUrl: formData.imageUrl || "/placeholder.svg?height=200&width=200&query=" + encodeURIComponent(formData.name),
        quantity: formData.quantity, // Use quantity from form
        defaultOrderStatus: formData.defaultOrderStatus, // Use defaultOrderStatus from form
        isAvailable: formData.quantity > 0, // Set based on quantity
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
      price: product.price.toString(),
      category: product.categoryId, // Set the category ID for the select input
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      imageUrl: product.imageUrl,
      quantity: product.quantity, // Populate quantity
      defaultOrderStatus: product.defaultOrderStatus, // Populate defaultOrderStatus
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
        price: Number.parseFloat(formData.price),
        category: selectedCat.name,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        imageUrl: formData.imageUrl || editingProduct.imageUrl,
        quantity: formData.quantity,
        defaultOrderStatus: formData.defaultOrderStatus,
        isAvailable: formData.quantity > 0, // Set based on quantity
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

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      category: "",
      categoryId: "",
      categoryName: "",
      imageUrl: "",
      quantity: 1, // Reset quantity
      defaultOrderStatus: "Preparing", // Reset defaultOrderStatus to a valid value
    });
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getAvailabilityStatus = (quantity: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (quantity === 0) {
      return { text: "Sold Out", variant: "destructive" };
    } else if (quantity < 30) {
      return { text: "Few stocks", variant: "default" };
    } else {
      return { text: "Available", variant: "default" };
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a cloud service like Firebase Storage
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, imageUrl: imageUrl });
    }
  };

  // Category Management Functions
  const handleAddCategory = async () => {
    if (!categoryFormData.name) {
      alert("Category name cannot be empty.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "categories"), { name: categoryFormData.name });
      setCategories(prev => [...prev, { id: docRef.id, name: categoryFormData.name }]);
      setIsCategoryDialogOpen(false);
      setCategoryFormData({ name: "" });
      alert("Category added successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Error adding category. Please try again.");
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name });
    setIsCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryFormData.name) {
      alert("Category name cannot be empty.");
      return;
    }
    try {
      const categoryDocRef = doc(db, "categories", editingCategory.id);
      await updateDoc(categoryDocRef, { name: categoryFormData.name });

      // Update associated items
      const itemsRef = collection(db, "items");
      const q = query(itemsRef, where("categoryId", "==", editingCategory.id));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((itemDoc) => {
        batch.update(itemDoc.ref, {
          category: categoryFormData.name,
          categoryName: categoryFormData.name,
        });
      });
      await batch.commit();

      setCategories(prev => prev.map(cat => (cat.id === editingCategory.id ? { ...cat, name: categoryFormData.name } : cat)));
      setProducts(prev => prev.map(p => (p.categoryId === editingCategory.id ? { ...p, category: categoryFormData.name, categoryName: categoryFormData.name } : p)));
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryFormData({ name: "" });
      alert("Category updated successfully!");
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Error updating category. Please try again.");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category and all associated products?")) {
      try {
        // Delete associated items
        const itemsRef = collection(db, "items");
        const q = query(itemsRef, where("categoryId", "==", categoryId));
        const querySnapshot = await getDocs(q);

        const batch = writeBatch(db);
        querySnapshot.docs.forEach((itemDoc) => {
          batch.delete(itemDoc.ref);
        });
        await batch.commit();

        // Delete the category
        await deleteDoc(doc(db, "categories", categoryId));
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        setProducts(prev => prev.filter(p => p.categoryId !== categoryId));
        alert("Category and associated products deleted successfully!");
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Error deleting category. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Product and Manage Categories Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-sm text-gray-500">Add, edit, and manage food items and categories for the mobile app</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    placeholder="Enter category name"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsCategoryDialogOpen(false);
                  setEditingCategory(null);
                  setCategoryFormData({ name: "" });
                }}>
                  Cancel
                </Button>
                <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
                  {editingCategory ? "Save Changes" : "Add Category"}
                </Button>
              </div>

              <h3 className="text-lg font-semibold mt-6">Existing Categories</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setEditingProduct(null);
                resetForm();
              }
            }}
          >
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
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="defaultOrderStatus">Default Order Status</Label>
                  <Select
                    value={formData.defaultOrderStatus}
                    onValueChange={(value) =>
                      setFormData({ ...formData, defaultOrderStatus: value })
                    }
                  >
                    <SelectTrigger id="defaultOrderStatus">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preparing">Preparing</SelectItem>
                      <SelectItem value="Ready">Ready</SelectItem>
                    </SelectContent>
                  </Select>
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
        <Select
          value={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a category" />
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
                      </TableCell>
                      <TableCell>{product.categoryName}</TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getAvailabilityStatus(product.quantity).variant as "default" | "secondary" | "destructive" | "outline"}>
                          {getAvailabilityStatus(product.quantity).text}
                        </Badge>
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
