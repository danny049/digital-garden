#!/bin/bash

# Simple script to publish Quartz site to GitHub Pages
# This commits changes and pushes to main branch to trigger deployment
#
# Note: You don't need to build locally - GitHub Actions will build automatically
# But you can optionally test locally first with: npx quartz build --serve

set -e  # Exit on error

echo "🚀 Publishing Quartz site..."

# Make sure we're on main branch
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "main" ]]; then
    echo "⚠️  You're on branch '$current_branch'. Switching to main..."
    git checkout main
fi

# Ask if user wants to build/test locally first (optional)
read -p "Build and test locally first? (y/n, default: n): " build_local
if [[ "$build_local" == "y" || "$build_local" == "Y" ]]; then
    echo "🔨 Building site locally..."
    npx quartz build
    echo "✅ Build complete! You can test it with: npx quartz build --serve"
    read -p "Continue with publishing? (y/n): " continue_publish
    if [[ "$continue_publish" != "y" && "$continue_publish" != "Y" ]]; then
        echo "❌ Publishing cancelled"
        exit 0
    fi
fi

# Check if there are any changes to commit
if [[ -n $(git status -s) ]]; then
    echo "📝 Staging changes..."
    git add .
    
    echo "💾 Committing changes..."
    read -p "Enter commit message (or press Enter for default): " commit_msg
    if [[ -z "$commit_msg" ]]; then
        commit_msg="Update site content"
    fi
    git commit -m "$commit_msg"
else
    echo "✅ No changes to commit"
fi

# Pull latest changes before pushing (to avoid conflicts)
echo "📥 Pulling latest changes from origin/main..."
git pull --rebase origin main || {
    echo "⚠️  Pull failed. You may need to resolve conflicts manually."
    exit 1
}

# Push to trigger deployment
echo "📤 Pushing to origin/main to trigger deployment..."
git push origin main

echo "✅ Done! Your site is being deployed."
echo "🔍 Check the Actions tab in GitHub to monitor the deployment."

