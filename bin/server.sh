#!/bin/bash
# bin/server.sh — Start, stop, or restart Flask and React servers
#
# Usage:
#   ./bin/server.sh start
#   ./bin/server.sh stop
#   ./bin/server.sh restart
#   ./bin/server.sh status

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_DIR/api"

FLASK_PORT=5001
REACT_PORT=3000

# Kill ALL processes on a given port, wait until port is free
kill_port() {
    local port=$1
    local pids

    pids=$(lsof -ti:"$port" 2>/dev/null)
    if [ -z "$pids" ]; then
        return 1  # nothing running
    fi

    # Kill all PIDs on this port
    echo "$pids" | xargs kill -9 2>/dev/null

    # Wait up to 5 seconds for port to free
    for i in $(seq 1 10); do
        pids=$(lsof -ti:"$port" 2>/dev/null)
        if [ -z "$pids" ]; then
            return 0
        fi
        sleep 0.5
    done

    # Force kill anything remaining
    lsof -ti:"$port" 2>/dev/null | xargs kill -9 2>/dev/null
    return 0
}

port_is_running() {
    lsof -ti:"$1" >/dev/null 2>&1
}

start_flask() {
    if port_is_running $FLASK_PORT; then
        echo "Flask is already running on port $FLASK_PORT"
        return
    fi

    echo "Installing Python dependencies..."
    cd "$API_DIR"
    pip install -r requirements.txt --quiet --break-system-packages 2>/dev/null || pip install -r requirements.txt --quiet

    echo "Starting Flask server..."
    python app.py > "$PROJECT_DIR/.flask.log" 2>&1 &
    sleep 2

    if port_is_running $FLASK_PORT; then
        echo "✓ Flask started on http://localhost:$FLASK_PORT"
    else
        echo "✗ Flask failed to start. Check .flask.log:"
        tail -5 "$PROJECT_DIR/.flask.log"
    fi
}

start_react() {
    if port_is_running $REACT_PORT; then
        echo "React is already running on port $REACT_PORT"
        return
    fi

    echo "Starting React dev server..."
    cd "$PROJECT_DIR"
    BROWSER=none PORT=$REACT_PORT npm start > "$PROJECT_DIR/.react.log" 2>&1 &
    sleep 3

    if port_is_running $REACT_PORT; then
        echo "✓ React started on http://localhost:$REACT_PORT"
    else
        echo "✗ React failed to start. Check .react.log:"
        tail -5 "$PROJECT_DIR/.react.log"
    fi
}

stop_flask() {
    if port_is_running $FLASK_PORT; then
        kill_port $FLASK_PORT
        echo "✓ Flask stopped"
    else
        echo "- Flask is not running"
    fi
}

stop_react() {
    if port_is_running $REACT_PORT; then
        kill_port $REACT_PORT
        echo "✓ React stopped"
    else
        echo "- React is not running"
    fi
}

status() {
    echo "=== Server Status ==="
    if port_is_running $FLASK_PORT; then
        echo "Flask:  ● Running — http://localhost:$FLASK_PORT"
    else
        echo "Flask:  ○ Stopped"
    fi

    if port_is_running $REACT_PORT; then
        echo "React:  ● Running — http://localhost:$REACT_PORT"
    else
        echo "React:  ○ Stopped"
    fi
}

case "$1" in
    start)
        echo "=== Starting Servers ==="
        start_flask
        start_react
        echo ""
        echo "Logs: .flask.log, .react.log"
        ;;
    stop)
        echo "=== Stopping Servers ==="
        stop_flask
        stop_react
        ;;
    restart)
        echo "=== Restarting Servers ==="
        stop_flask
        stop_react
        sleep 1
        start_flask
        start_react
        echo ""
        echo "Logs: .flask.log, .react.log"
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "  start    — Install deps, start Flask and React"
        echo "  stop     — Stop both servers"
        echo "  restart  — Stop then start both servers"
        echo "  status   — Check if servers are running"
        exit 1
        ;;
esac
