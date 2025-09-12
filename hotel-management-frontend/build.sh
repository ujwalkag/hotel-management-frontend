#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print header
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   ߚ Frontend Build & Restart Script   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
sudo rm -rf .next
# Step 1: Build the application
print_status "Step 1: Running npm run build..."
if npm run build; then
    print_success "Build completed successfully!"
else
    print_error "Build failed! Please check the errors above."
    exit 1
fi
echo ""

# Step 2: Check for processes on port 3000
print_status "Step 2: Checking processes on port 3000..."
PIDS=$(sudo lsof -ti:3000)

if [ -z "$PIDS" ]; then
    echo -e "${YELLOW}[INFO]${NC} No processes found running on port 3000"
else
    echo -e "${YELLOW}[INFO]${NC} Found processes on port 3000: $PIDS"
    
    # Step 3: Kill the processes
    print_status "Step 3: Killing processes on port 3000..."
    for PID in $PIDS; do
        if sudo kill -9 $PID; then
            print_success "Killed process $PID"
        else
            print_error "Failed to kill process $PID"
        fi
    done
    
    # Wait a moment for processes to terminate
    sleep 2
fi
echo ""

# Step 4: Start the application with ./start.sh
print_status "Step 4: Starting application with ./start.sh..."
if [ -f "./start.sh" ]; then
    chmod +x ./start.sh
    ./start.sh
    if [ $? -eq 0 ]; then
        print_success "Application started successfully!"
    else
        print_error "Failed to start application"
        exit 1
    fi
else
    print_error "./start.sh not found!"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Build and restart completed!      ${NC}"
echo -e "${GREEN}========================================${NC}"
