-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS vyaparibook;
USE vyaparibook;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('receivable', 'payable', 'settled') DEFAULT 'settled',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT NOT NULL,
    invoice_number INT UNIQUE,
    total DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('receivable', 'payable', 'settled') DEFAULT 'settled',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES customers(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('gave', 'got') NOT NULL,
    name VARCHAR(100),
    invoice_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Cash',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    amount DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Supplier transactions table
CREATE TABLE IF NOT EXISTS supplier_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplierId INT NOT NULL,
    type ENUM('gave', 'got') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50) DEFAULT 'Cash',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Cash', 'Card', 'UPI', 'Bank Transfer', 'Other') DEFAULT 'Cash',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
    notes TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Transaction items table
CREATE TABLE IF NOT EXISTS transaction_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Insert a test user
INSERT INTO users (name, email, password) 
VALUES ('Test User', 'test@example.com', 'password123')
ON DUPLICATE KEY UPDATE name = 'Test User';

-- Insert a test customer
INSERT INTO customers (name, phone, email, address, balance, status) 
VALUES ('Test Customer', '1234567890', 'customer@example.com', '123 Test Street', 0.00, 'settled')
ON DUPLICATE KEY UPDATE name = 'Test Customer';

-- Get the customer ID
SET @customer_id = LAST_INSERT_ID();

-- Insert a test invoice
INSERT INTO invoices (customerId, total, status) 
VALUES (@customer_id, 0.00, 'settled');

-- Get the invoice ID
SET @invoice_id = LAST_INSERT_ID();

-- Insert a test transaction
INSERT INTO transactions (type, name, invoice_id, amount, method, note) 
VALUES ('got', 'Test Customer', @invoice_id, 100.00, 'Cash', 'Initial transaction');

-- Insert a test supplier
INSERT INTO suppliers (name, phone, email, amount, status) 
VALUES ('Test Supplier', '0987654321', 'supplier@example.com', 0.00, 'active')
ON DUPLICATE KEY UPDATE name = 'Test Supplier';

-- Get the supplier ID
SET @supplier_id = LAST_INSERT_ID();

-- Insert a test supplier transaction
INSERT INTO supplier_transactions (supplierId, type, amount, method, note) 
VALUES (@supplier_id, 'gave', 200.00, 'Cash', 'Initial supplier transaction');