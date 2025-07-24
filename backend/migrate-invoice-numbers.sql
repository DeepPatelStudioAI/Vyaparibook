-- Migration script to add invoice_number column and populate existing data
USE vyaparibook;

-- Add invoice_number column if it doesn't exist
ALTER TABLE invoices ADD COLUMN invoice_number INT UNIQUE;

-- Update existing invoices to have invoice numbers starting from 1001
SET @row_number = 1000;
UPDATE invoices 
SET invoice_number = (@row_number := @row_number + 1)
WHERE invoice_number IS NULL
ORDER BY id;

-- Ensure future invoices start from the correct number
-- This will be handled by the application logic