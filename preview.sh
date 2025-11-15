#!/bin/bash

# Simple script to preview your Quartz site locally
# This builds and serves your site at http://localhost:8080

echo "🔨 Building and starting local preview server..."
echo "📖 Your site will be available at: http://localhost:8080"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npx quartz build --serve

