#!/bin/bash
# SIMRS ZEN - SSL Certificate Generation Script
# Usage: ./scripts/generate-ssl.sh [domain]

set -e

DOMAIN=${1:-"localhost"}
SSL_DIR="./ssl"

echo "🔐 SIMRS ZEN - SSL Certificate Generator"
echo "========================================="
echo ""

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Check if certificates already exist
if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
    echo "⚠️  SSL certificates already exist at:"
    echo "   - $SSL_DIR/cert.pem"
    echo "   - $SSL_DIR/key.pem"
    echo ""
    read -p "Do you want to overwrite them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Certificate generation cancelled."
        exit 0
    fi
fi

echo "📝 Generating self-signed SSL certificate for: $DOMAIN"
echo ""

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" \
    -subj "/C=ID/ST=DKI Jakarta/L=Jakarta/O=PT Zen Multimedia Indonesia/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN,IP:127.0.0.1" 2>/dev/null

# Set proper permissions
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo ""
echo "✅ SSL certificates generated successfully!"
echo ""
echo "📁 Certificate files:"
echo "   - Certificate: $SSL_DIR/cert.pem"
echo "   - Private Key: $SSL_DIR/key.pem"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "   - These are SELF-SIGNED certificates for development/testing only"
echo "   - For production, use Let's Encrypt or a trusted CA"
echo "   - The private key should NEVER be committed to version control"
echo "   - Certificates expire in 365 days"
echo ""
echo "🚀 Next steps:"
echo "   1. Start Docker Compose: docker compose -f docker-compose.production.yml up -d"
echo "   2. Access the app at: https://$DOMAIN"
echo "   3. Accept the self-signed certificate warning in your browser"
echo ""
