// src/types.ts

export interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
    address?: string;
    balance: number;
    status: 'Receivable' | 'payable';
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
  
  export interface Product {
    id: number;
    name: string;
    price: number;
    stockQuantity: number;
    createdAt: string;
  }
  
  export interface Invoice {
    id: number;
    customerId: number;
    amount: number;
    status: 'sent' | 'paid' | 'overdue';
    createdAt: string;
  }
  