@echo off
echo 🚀 Vyaparibook Setup Script for Windows
echo ====================================

:: Check if MySQL is installed
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL is not installed. Please install MySQL first:
    echo 1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
    echo 2. Run the installer and follow the instructions
    echo 3. Make sure to remember the root password you set
    echo 4. Add MySQL to your PATH environment variable
    echo 5. Run this script again after installation
    pause
    exit /b
)

:: Get MySQL password
echo 🔐 Enter your MySQL root password:
set /p DB_PASSWORD=

:: Create SQL setup file
echo 🗄️ Creating database and tables...
echo CREATE DATABASE IF NOT EXISTS vyaparibook; > temp_setup.sql
echo USE vyaparibook; >> temp_setup.sql

echo -- Customers table >> temp_setup.sql
echo CREATE TABLE IF NOT EXISTS customers ( >> temp_setup.sql
echo     id INT AUTO_INCREMENT PRIMARY KEY, >> temp_setup.sql
echo     name VARCHAR(100) NOT NULL, >> temp_setup.sql
echo     phone VARCHAR(20), >> temp_setup.sql
echo     email VARCHAR(100), >> temp_setup.sql
echo     address TEXT, >> temp_setup.sql
echo     balance DECIMAL(10, 2) DEFAULT 0.00, >> temp_setup.sql
echo     status ENUM('receivable', 'payable', 'settled') DEFAULT 'settled', >> temp_setup.sql
echo     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP >> temp_setup.sql
echo ); >> temp_setup.sql

echo -- Invoices table >> temp_setup.sql
echo CREATE TABLE IF NOT EXISTS invoices ( >> temp_setup.sql
echo     id INT AUTO_INCREMENT PRIMARY KEY, >> temp_setup.sql
echo     customerId INT NOT NULL, >> temp_setup.sql
echo     total DECIMAL(10, 2) DEFAULT 0.00, >> temp_setup.sql
echo     status ENUM('receivable', 'payable', 'settled') DEFAULT 'settled', >> temp_setup.sql
echo     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, >> temp_setup.sql
echo     FOREIGN KEY (customerId) REFERENCES customers(id) >> temp_setup.sql
echo ); >> temp_setup.sql

echo -- Transactions table >> temp_setup.sql
echo CREATE TABLE IF NOT EXISTS transactions ( >> temp_setup.sql
echo     id INT AUTO_INCREMENT PRIMARY KEY, >> temp_setup.sql
echo     type ENUM('gave', 'got') NOT NULL, >> temp_setup.sql
echo     name VARCHAR(100), >> temp_setup.sql
echo     invoice_id INT NOT NULL, >> temp_setup.sql
echo     amount DECIMAL(10, 2) NOT NULL, >> temp_setup.sql
echo     method VARCHAR(50) DEFAULT 'Cash', >> temp_setup.sql
echo     note TEXT, >> temp_setup.sql
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP, >> temp_setup.sql
echo     FOREIGN KEY (invoice_id) REFERENCES invoices(id) >> temp_setup.sql
echo ); >> temp_setup.sql

echo -- Suppliers table >> temp_setup.sql
echo CREATE TABLE IF NOT EXISTS suppliers ( >> temp_setup.sql
echo     id INT AUTO_INCREMENT PRIMARY KEY, >> temp_setup.sql
echo     name VARCHAR(100) NOT NULL, >> temp_setup.sql
echo     phone VARCHAR(20), >> temp_setup.sql
echo     email VARCHAR(100), >> temp_setup.sql
echo     amount DECIMAL(10, 2) DEFAULT 0.00, >> temp_setup.sql
echo     status ENUM('active', 'inactive') DEFAULT 'active', >> temp_setup.sql
echo     createdAt DATETIME DEFAULT CURRENT_TIMESTAMP >> temp_setup.sql
echo ); >> temp_setup.sql

echo -- Supplier transactions table >> temp_setup.sql
echo CREATE TABLE IF NOT EXISTS supplier_transactions ( >> temp_setup.sql
echo     id INT AUTO_INCREMENT PRIMARY KEY, >> temp_setup.sql
echo     supplierId INT NOT NULL, >> temp_setup.sql
echo     type ENUM('gave', 'got') NOT NULL, >> temp_setup.sql
echo     amount DECIMAL(10, 2) NOT NULL, >> temp_setup.sql
echo     method VARCHAR(50) DEFAULT 'Cash', >> temp_setup.sql
echo     note TEXT, >> temp_setup.sql
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP, >> temp_setup.sql
echo     FOREIGN KEY (supplierId) REFERENCES suppliers(id) >> temp_setup.sql
echo ); >> temp_setup.sql

echo -- Users table >> temp_setup.sql
echo CREATE TABLE IF NOT EXISTS users ( >> temp_setup.sql
echo     id INT AUTO_INCREMENT PRIMARY KEY, >> temp_setup.sql
echo     name VARCHAR(100) NOT NULL, >> temp_setup.sql
echo     email VARCHAR(100) NOT NULL UNIQUE, >> temp_setup.sql
echo     password VARCHAR(255) NOT NULL, >> temp_setup.sql
echo     created_at DATETIME DEFAULT CURRENT_TIMESTAMP >> temp_setup.sql
echo ); >> temp_setup.sql

echo -- Payments table >> temp_setup.sql
echo CREATE TABLE IF NOT EXISTS payments ( >> temp_setup.sql
echo     id INT AUTO_INCREMENT PRIMARY KEY, >> temp_setup.sql
echo     invoice_id INT NOT NULL, >> temp_setup.sql
echo     amount DECIMAL(10, 2) NOT NULL, >> temp_setup.sql
echo     payment_method ENUM('Cash', 'Card', 'UPI', 'Bank Transfer', 'Other') DEFAULT 'Cash', >> temp_setup.sql
echo     payment_date DATETIME DEFAULT CURRENT_TIMESTAMP, >> temp_setup.sql
echo     status ENUM('completed', 'pending', 'failed') DEFAULT 'completed', >> temp_setup.sql
echo     notes TEXT, >> temp_setup.sql
echo     FOREIGN KEY (invoice_id) REFERENCES invoices(id) >> temp_setup.sql
echo ); >> temp_setup.sql

echo -- Invoice items table >> temp_setup.sql
echo CREATE TABLE IF NOT EXISTS invoice_items ( >> temp_setup.sql
echo     id INT AUTO_INCREMENT PRIMARY KEY, >> temp_setup.sql
echo     invoice_id INT NOT NULL, >> temp_setup.sql
echo     item_name VARCHAR(100) NOT NULL, >> temp_setup.sql
echo     description TEXT, >> temp_setup.sql
echo     quantity INT NOT NULL DEFAULT 1, >> temp_setup.sql
echo     unit_price DECIMAL(10, 2) NOT NULL, >> temp_setup.sql
echo     total_price DECIMAL(10, 2) NOT NULL, >> temp_setup.sql
echo     FOREIGN KEY (invoice_id) REFERENCES invoices(id) >> temp_setup.sql
echo ); >> temp_setup.sql

echo -- Insert a test user >> temp_setup.sql
echo INSERT INTO users (name, email, password) >> temp_setup.sql
echo VALUES ('Test User', 'test@example.com', 'password123') >> temp_setup.sql
echo ON DUPLICATE KEY UPDATE name = 'Test User'; >> temp_setup.sql

:: Run the SQL script
mysql -u root -p%DB_PASSWORD% < temp_setup.sql
if %errorlevel% neq 0 (
    echo ❌ Failed to create database and tables. Check your MySQL password.
    del temp_setup.sql
    pause
    exit /b
)
del temp_setup.sql

:: Create .env file
echo 📝 Creating .env file...
echo DB_HOST=localhost > .env
echo DB_USER=root >> .env
echo DB_PASS=%DB_PASSWORD% >> .env
echo DB_NAME=vyaparibook >> .env
echo PORT=3001 >> .env

:: Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
call npm install

echo ✅ Setup complete! You can now run the server with: npm start
pause