#!/bin/bash

# Healthcare EMR Appointment System - Quick Start Script
# This script automates the setup process

echo "=========================================="
echo "Healthcare EMR Appointment System"
echo "Quick Start Installation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.8+${NC}"
    exit 1
else
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python found: $PYTHON_VERSION${NC}"
fi

echo ""
echo "=========================================="
echo "Setting up Backend..."
echo "=========================================="

cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Creating .env from template..."
    cp ../.env.example .env
    echo -e "${YELLOW}⚠ Please edit backend/.env with your Neon DATABASE_URL${NC}"
    echo "   Visit: https://console.neon.tech"
    echo ""
    read -p "Press Enter after you've updated the DATABASE_URL..."
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"

cd ..

echo ""
echo "=========================================="
echo "Setting up Frontend..."
echo "=========================================="

cd frontend

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Check for .env file
if [ ! -f .env ]; then
    echo "Creating frontend .env..."
    echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

cd ..

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Ensure your Neon database is set up:"
echo "   - Visit https://console.neon.tech"
echo "   - Create project 'emr-appointments'"
echo "   - Run backend/schema.sql in SQL editor"
echo ""
echo "2. Start the backend (in one terminal):"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open browser:"
echo "   http://localhost:5173"
echo ""
echo "For detailed instructions, see SETUP.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
