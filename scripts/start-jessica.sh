#!/bin/bash
# Jessica Core - Startup Script
# Starts all backend services required for Jessica to operate
#
# Usage:
#   source ~/.bashrc          # Load API keys first
#   ~/start-jessica.sh        # Start all services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."  # Go to jessica-core root

# Ensure logs directory exists
mkdir -p logs

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}JESSICA CORE - Starting Services${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}ERROR: Virtual environment not found!${NC}"
    echo "Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Load API keys from ~/.bashrc (CRITICAL - must be done before starting services)
echo -e "${YELLOW}Loading API keys from ~/.bashrc...${NC}"
if [ -f ~/.bashrc ]; then
    source ~/.bashrc
    echo -e "${GREEN}✓ API keys loaded${NC}"
else
    echo -e "${YELLOW}WARNING: ~/.bashrc not found - API keys may not be available${NC}"
fi

# Check if Ollama is running
echo -e "${YELLOW}Checking Ollama service...${NC}"
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Ollama is not running!${NC}"
    echo "Start Ollama first: ollama serve"
    echo "Or in background: nohup ollama serve > /dev/null 2>&1 &"
    exit 1
fi
echo -e "${GREEN}✓ Ollama is running${NC}"

# Check if jessica model exists
echo -e "${YELLOW}Checking for jessica model...${NC}"
if ! ollama list | grep -q "jessica"; then
    echo -e "${YELLOW}WARNING: jessica model not found!${NC}"
    echo "Creating jessica model..."
    ./scripts/setup-jessica-models.sh || {
        echo -e "${RED}ERROR: Failed to create jessica model!${NC}"
        exit 1
    }
fi
echo -e "${GREEN}✓ jessica model ready${NC}"

# Check if ports are available
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}WARNING: Port $port is already in use ($service)${NC}"
        echo "Kill existing process or use different port"
        return 1
    fi
    return 0
}

# check_port 5000 "Whisper Server" || exit 1  # DISABLED - using external voice solution
check_port 5001 "Memory Server" || exit 1
check_port 8000 "Jessica Core" || exit 1

# Start services in background
echo -e "${YELLOW}Starting services...${NC}"

# Start Memory Server (port 5001)
echo -e "${GREEN}Starting Memory Server (port 5001)...${NC}"
python3 memory_server.py > logs/memory-server.log 2>&1 &
MEMORY_PID=$!
echo "Memory Server PID: $MEMORY_PID"

# Wait a moment for memory server to start
sleep 2

# Check if memory server started successfully
if ! kill -0 $MEMORY_PID 2>/dev/null; then
    echo -e "${RED}ERROR: Memory Server failed to start!${NC}"
    echo "Check logs/memory-server.log"
    exit 1
fi

# DISABLED - Whisper Server (port 5000) - using external voice solution
# echo -e "${GREEN}Starting Whisper Server (port 5000)...${NC}"
# python3 whisper_server.py > logs/whisper-server.log 2>&1 &
# WHISPER_PID=$!
# echo "Whisper Server PID: $WHISPER_PID"
# sleep 2
# if ! kill -0 $WHISPER_PID 2>/dev/null; then
#     echo -e "${RED}ERROR: Whisper Server failed to start!${NC}"
#     echo "Check logs/whisper-server.log"
#     kill $MEMORY_PID 2>/dev/null || true
#     exit 1
# fi
WHISPER_PID="N/A"
echo -e "${YELLOW}Whisper Server DISABLED - using external voice solution${NC}"

# Start Jessica Core (port 8000)
echo -e "${GREEN}Starting Jessica Core (port 8000)...${NC}"
python3 jessica_core.py > logs/jessica-core.log 2>&1 &
JESSICA_PID=$!
echo "Jessica Core PID: $JESSICA_PID"

# Wait for services to fully start
sleep 3

# Verify services are running
echo -e "${YELLOW}Verifying services...${NC}"

check_service() {
    local url=$1
    local name=$2
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is responding${NC}"
            return 0
        fi
        if [ $attempt -lt $max_attempts ]; then
            echo -e "${YELLOW}  Waiting for $name... (attempt $attempt/$max_attempts)${NC}"
            sleep 2
        fi
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $name is not responding after $max_attempts attempts${NC}"
    return 1
}

check_service "http://localhost:5001/health" "Memory Server" || echo -e "${YELLOW}Memory Server may still be starting...${NC}"
# check_service "http://localhost:5000/health" "Whisper Server" || echo -e "${YELLOW}Whisper Server may still be starting...${NC}"  # DISABLED
check_service "http://localhost:8000/status" "Jessica Core" || echo -e "${YELLOW}Jessica Core may still be starting...${NC}"

# Save PIDs to file for easy shutdown
echo "$MEMORY_PID" > /tmp/jessica-memory.pid
# echo "$WHISPER_PID" > /tmp/jessica-whisper.pid  # DISABLED
echo "$JESSICA_PID" > /tmp/jessica-core.pid

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All services started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Service PIDs:"
echo "  Memory Server:  $MEMORY_PID (port 5001)"
echo "  Whisper Server: DISABLED (using external voice)"
echo "  Jessica Core:   $JESSICA_PID (port 8000)"
echo ""
echo "Logs:"
echo "  Memory:  logs/memory-server.log"
echo "  Whisper: logs/whisper-server.log"
echo "  Core:    logs/jessica-core.log"
echo ""
echo "To stop all services:"
echo "  pkill -f memory_server.py"
echo "  pkill -f whisper_server.py"
echo "  pkill -f jessica_core.py"
echo ""
echo "Or use: kill \$(cat /tmp/jessica-*.pid)"
echo ""
echo -e "${GREEN}Jessica is ready!${NC}"
echo "Frontend: http://localhost:3000"
echo "API:      http://localhost:8000"

