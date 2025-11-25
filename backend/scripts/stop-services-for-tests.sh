#!/bin/bash

# MetaPharm Connect - Stop Test Services
# This script stops services started by start-services-for-tests.sh

echo "=========================================="
echo "Stopping MetaPharm Test Services"
echo "=========================================="

PID_FILE="/tmp/metapharm-test-services.pid"

if [ -f "$PID_FILE" ]; then
    echo "Reading PIDs from $PID_FILE..."
    PIDS=$(cat "$PID_FILE")

    if [ -n "$PIDS" ]; then
        echo "Stopping processes: $PIDS"

        for pid in $PIDS; do
            if ps -p $pid > /dev/null 2>&1; then
                echo "  Killing PID $pid..."
                kill $pid 2>/dev/null || true
            else
                echo "  PID $pid already stopped"
            fi
        done

        # Wait a moment for graceful shutdown
        sleep 2

        # Force kill if still running
        for pid in $PIDS; do
            if ps -p $pid > /dev/null 2>&1; then
                echo "  Force killing PID $pid..."
                kill -9 $pid 2>/dev/null || true
            fi
        done

        # Remove PID file
        rm "$PID_FILE"
        echo "✓ PID file removed"
    else
        echo "⚠️  PID file is empty"
        rm "$PID_FILE"
    fi
else
    echo "⚠️  PID file not found: $PID_FILE"
    echo ""
    echo "Searching for services on ports 4001 and 4002..."

    # Try to find and kill processes on test ports
    for port in 4001 4002; do
        PIDS=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$PIDS" ]; then
            echo "  Found processes on port $port: $PIDS"
            echo "  Killing..."
            kill $PIDS 2>/dev/null || true
        else
            echo "  No processes found on port $port"
        fi
    done
fi

# Clean up log files
echo ""
echo "Cleaning up log files..."
[ -f /tmp/auth-service.log ] && rm /tmp/auth-service.log && echo "✓ Removed /tmp/auth-service.log"
[ -f /tmp/api-gateway.log ] && rm /tmp/api-gateway.log && echo "✓ Removed /tmp/api-gateway.log"

echo ""
echo "=========================================="
echo "Test services stopped"
echo "=========================================="
