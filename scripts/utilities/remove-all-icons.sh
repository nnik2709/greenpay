#!/bin/bash

# Script to remove all lucide-react icon usage from JSX files
# This creates a clean, professional look without icons

echo "Removing icons from all pages..."

# Get list of all JSX files with lucide-react imports
files=$(grep -l "from 'lucide-react'" src/pages/**/*.jsx src/pages/*.jsx 2>/dev/null)

echo "Found $(echo "$files" | wc -l) files with icons"
echo ""
echo "Files to clean:"
echo "$files"
echo ""
echo "Manual review required for each file:"
echo "1. Remove lucide-react import line"
echo "2. Remove icon components like <IconName className=... />"
echo "3. Remove mr-2, gap-2 spacing that was for icons"
echo "4. Keep text labels clear and descriptive"
echo ""
echo "Priority files (user-facing):"
echo "- src/pages/Quotations.jsx"
echo "- src/pages/IndividualPurchase.jsx"
echo "- src/pages/Passports.jsx"
echo "- src/pages/Users.jsx"
echo "- src/pages/Dashboard.jsx"
echo "- src/pages/Reports.jsx"
echo ""
echo "Use this command to see icons in a file:"
echo "grep -n 'className=\".*h-[0-9].*w-[0-9]' FILENAME.jsx"
