#!/bin/bash

echo "🔄 Stopping any running Node.js processes..."
pkill -f "node index.js" || true

echo "⏳ Waiting a moment..."
sleep 2

echo "🚀 Starting the server..."
node index.js