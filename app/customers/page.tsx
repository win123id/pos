"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, User, Save, X, Phone, Mail, MapPin } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Header } from "@/components/layout/header";

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 9;

export default function CustomersPage() {
  const supabase = createClient();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get total count
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Fetch paginated customers
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setEditingCustomer(null);
    setIsAddingCustomer(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(submitData)
          .eq('id', editingCustomer.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert(submitData);
        
        if (error) throw error;
      }

      await fetchCustomers();
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to save customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
    });
    setIsAddingCustomer(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCustomers();
    } catch (error: any) {
      setError(error.message || 'Failed to delete customer');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container py-8 px-6">
          <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-lg">
            Manage your customer information
          </p>
        </div>
        <Button 
          onClick={() => setIsAddingCustomer(true)}
          disabled={isAddingCustomer}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {isAddingCustomer && (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 812-3456-7890"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Example No. 123, Jakarta"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Add Customer')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading customers...
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <div key={customer.id} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {customer.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="break-words">{customer.address}</span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-3 border-t">
                      Customer since {new Date(customer.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-12 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No customers yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first customer to get started with your POS system.</p>
                  <Button 
                    onClick={() => setIsAddingCustomer(true)}
                    variant="outline"
                  >
                    Add your first customer →
                  </Button>
                </div>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pt-6 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
          </div>
        </div>
      </main>
    </div>
  );
}
