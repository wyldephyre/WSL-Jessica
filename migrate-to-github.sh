#!/bin/bash
# Migration script for Jessica to wyldephyre/WSL-Jessica
# Run this from /home/phyre/jessica-core directory

set -e  # Exit on error

echo "=== Jessica GitHub Migration Script ==="
echo ""

# Step 1: Verify we're in the right directory
if [ ! -f "jessica_core.py" ]; then
    echo "ERROR: Not in jessica-core directory!"
    exit 1
fi

# Step 2: Verify remote is updated
echo "Checking git remote..."
git remote -v
echo ""

# Step 3: Stage all changes
echo "Staging all files..."
git add .
echo ""

# Step 4: Show what will be committed
echo "Files to be committed:"
git status
echo ""

# Step 5: Commit
echo "Creating commit..."
git commit -m "Initial commit: Migration to wyldephyre organization"
echo ""

# Step 6: Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main
echo ""

# Step 7: Verify
echo "Verifying push..."
git ls-remote origin
echo ""

echo "=== Migration Complete! ==="
echo "Repository: https://github.com/wyldephyre/WSL-Jessica.git"

