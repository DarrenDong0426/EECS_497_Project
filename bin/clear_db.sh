#!/bin/bash
# bin/clear_db.sh — Clears the SQLite database and all recorded audio files

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_DIR/api"

DB_FILE="$API_DIR/recordings.db"
RECORDINGS_DIR="$API_DIR/recordings"

echo "=== Clear Database ==="
echo ""

read -p "This will delete ALL recordings and data. Are you sure? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

# Remove database
if [ -f "$DB_FILE" ]; then
    rm "$DB_FILE"
    echo "✓ Deleted database: $DB_FILE"
else
    echo "- No database file found"
fi

# Remove audio files
if [ -d "$RECORDINGS_DIR" ]; then
    rm -rf "$RECORDINGS_DIR"
    mkdir -p "$RECORDINGS_DIR"
    echo "✓ Cleared recordings folder: $RECORDINGS_DIR"
else
    echo "- No recordings folder found"
fi

echo ""
echo "Done. Database will be recreated next time Flask starts."
