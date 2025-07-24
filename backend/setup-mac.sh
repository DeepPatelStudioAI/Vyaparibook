#!/bin/bash

echo "🚀 Vyaparibook Setup Script for macOS"
echo "===================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew already installed"
fi

# Install MySQL
echo "📦 Installing MySQL..."
brew install mysql

# Start MySQL service
echo "🔄 Starting MySQL service..."
brew services start mysql

# Set root password
echo "🔐 Setting MySQL root password..."
echo "Enter your desired MySQL root password (will be saved to .env file):"
read -s DB_PASSWORD
echo

# Secure MySQL installation
echo "🔒 Securing MySQL installation..."
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASSWORD'; FLUSH PRIVILEGES;"

# Create database and tables
echo "🗄️ Creating database and tables..."
cat > temp_setup.sql << EOF
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

-- Insert a test user
INSERT INTO users (name, email, password) 
VALUES ('Test User', 'test@example.com', 'password123')
ON DUPLICATE KEY UPDATE name = 'Test User';
EOF

mysql -u root -p$DB_PASSWORD < temp_setup.sql
rm temp_setup.sql

# Create or update .env file
echo "📝 Creating .env file..."
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASS=$DB_PASSWORD
DB_NAME=vyaparibook
PORT=3001
EOF

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo "✅ Setup complete! You can now run the server with: npm start"