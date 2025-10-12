#!/bin/bash

# PNG Green Fees - Setup SSH and Deploy Script
# This script helps set up SSH keys and deploy to VPS

set -e

VPS_USER="root"
VPS_HOST="195.200.14.62"

echo "🔑 PNG Green Fees - SSH Setup & Deploy"
echo "======================================"
echo ""

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "🔑 No SSH key found. Creating one..."
    ssh-keygen -t ed25519 -C "png-green-fees-deploy" -f ~/.ssh/id_ed25519 -N ""
    echo "✅ SSH key created"
    echo ""
fi

# Get the public key
if [ -f ~/.ssh/id_ed25519.pub ]; then
    PUBLIC_KEY=$(cat ~/.ssh/id_ed25519.pub)
elif [ -f ~/.ssh/id_rsa.pub ]; then
    PUBLIC_KEY=$(cat ~/.ssh/id_rsa.pub)
else
    echo "❌ No public key found"
    exit 1
fi

echo "📋 SSH Public Key:"
echo "$PUBLIC_KEY"
echo ""
echo "📝 Manual Setup Instructions:"
echo "1. SSH into your VPS: ssh $VPS_USER@$VPS_HOST"
echo "2. Add this key to authorized_keys:"
echo "   echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "3. Or run this command from your local machine:"
echo "   ssh-copy-id $VPS_USER@$VPS_HOST"
echo ""

read -p "Have you set up the SSH key on the VPS? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Testing SSH connection..."
    if ssh -o ConnectTimeout=10 $VPS_USER@$VPS_HOST exit 2>/dev/null; then
        echo "✅ SSH connection successful!"
        echo ""
        echo "🚀 Running deployment script..."
        ./copy-to-vps.sh
    else
        echo "❌ SSH connection failed"
        echo "Please ensure the SSH key is properly configured on the VPS"
    fi
else
    echo "⏳ Please set up the SSH key first, then run:"
    echo "   ./setup-ssh-and-deploy.sh"
fi
