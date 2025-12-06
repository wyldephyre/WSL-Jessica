#!/bin/bash
# Create Jessica custom models from Modelfiles
# Use this if you need to recreate the models

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Creating Jessica Custom Models"
echo "=========================================="
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ ERROR: Ollama is not running"
    echo "   Start it with: ollama serve"
    exit 1
fi

# Check if base model exists
if ! ollama list | grep -q "qwen2.5:32b"; then
    echo "⚠️  Base model qwen2.5:32b not found"
    echo "   Pulling qwen2.5:32b first..."
    ollama pull qwen2.5:32b
fi

# Create jessica model
if [ -f "Modelfile" ]; then
    echo "Creating jessica model..."
    # Remove existing model if it exists
    if ollama list | grep -q "^jessica\s"; then
        echo "  Removing existing jessica model..."
        ollama rm jessica || true
    fi
    ollama create jessica -f Modelfile
    echo "✓ jessica model created"
else
    echo "❌ ERROR: Modelfile not found"
    exit 1
fi

# Create jessica-business model
if [ -f "Modelfile.business" ]; then
    echo ""
    echo "Creating jessica-business model..."
    # Remove existing model if it exists
    if ollama list | grep -q "^jessica-business\s"; then
        echo "  Removing existing jessica-business model..."
        ollama rm jessica-business || true
    fi
    ollama create jessica-business -f Modelfile.business
    echo "✓ jessica-business model created"
else
    echo "⚠️  WARNING: Modelfile.business not found, skipping business model"
fi

echo ""
echo "=========================================="
echo "✅ Models Created Successfully!"
echo "=========================================="
echo ""
ollama list | grep -E "^jessica" || echo "  (No jessica models found)"
echo ""

