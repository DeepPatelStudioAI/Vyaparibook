// src/types.ts

export interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
    address?: string;
    balance: number;
    status: 'receivable' | 'payable';
    createdAt: string;
    totalPaid?: number; // Optional, for dashboard
    outstandingAmount?: number; // Optional, for dashboard
  }
  
  export interface Supplier {
    id: number;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    balance: number;
    createdAt: string;
  }
  
export interface Transaction {
    id: number;
    created_at: string;
    type: 'got' | 'gave';
    invoiceNumber: number;
    amount: number;
    items?: TransactionItem[];
  }
  export interface Product {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    costPrice: number;
    stockQuantity: number;
    category: 'manufactured' | 'purchased';
    createdAt: string;
  }

  export interface TransactionItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }
  
  export interface Invoice {
    id: number;
    customerId: number;
    amount: number;
    status: 'sent' | 'paid' | 'overdue';
    createdAt: string;
  }
  