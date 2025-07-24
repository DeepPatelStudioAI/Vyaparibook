#!/bin/bash

# Load environment variables from .env file
source .env

# Check if mysql client is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found. Please install MySQL client."
    exit 1
fi

echo "🔄 Initializing database..."

# Run the SQL script
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS < init-db.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully!"
else
    echo "❌ Failed to initialize database."
    exit 1
fi

echo "🚀 Ready to start the backend server!"