#!/bin/bash
# Setup script for Jessica custom Ollama models
# Verifies and creates jessica and jessica-business models if needed

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Jessica Model Setup"
echo "=========================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ ERROR: Ollama is not installed or not in PATH"
    echo "   Install from https://ollama.ai"
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  WARNING: Ollama doesn't appear to be running"
    echo "   Starting Ollama in background..."
    ollama serve > /dev/null 2>&1 &
    sleep 2
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "❌ ERROR: Could not start Ollama. Please start it manually:"
        echo "   ollama serve"
        exit 1
    fi
    echo "✓ Ollama started"
fi

# Check if base model exists (nous-hermes2:10.7b-solar-q5_K_M)
echo "Checking for base model: nous-hermes2:10.7b-solar-q5_K_M..."
if ollama list | grep -q "nous-hermes2:10.7b-solar-q5_K_M"; then
    echo "✓ Base model nous-hermes2:10.7b-solar-q5_K_M found"
else
    echo "⚠️  Base model nous-hermes2:10.7b-solar-q5_K_M not found"
    echo "   Pulling nous-hermes2:10.7b-solar-q5_K_M (this may take a while)..."
    ollama pull nous-hermes2:10.7b-solar-q5_K_M
    echo "✓ Base model downloaded"
fi

# Check if Modelfile exists
if [ ! -f "Modelfile" ]; then
    echo "❌ ERROR: Modelfile not found in current directory"
    exit 1
fi

# Check if jessica model exists
echo ""
echo "Checking for custom model: jessica..."
if ollama list | grep -q "^jessica\s"; then
    echo "✓ Custom model 'jessica' already exists"
    echo "   To recreate it, run: ollama rm jessica && ollama create jessica -f Modelfile"
else
    echo "⚠️  Custom model 'jessica' not found"
    echo "   Creating jessica model from Modelfile..."
    ollama create jessica -f Modelfile
    echo "✓ Custom model 'jessica' created successfully"
fi

# Check if Modelfile.business exists
if [ ! -f "Modelfile.business" ]; then
    echo "⚠️  WARNING: Modelfile.business not found, skipping business model"
else
    # Check if jessica-business model exists
    echo ""
    echo "Checking for custom model: jessica-business..."
    if ollama list | grep -q "^jessica-business\s"; then
        echo "✓ Custom model 'jessica-business' already exists"
        echo "   To recreate it, run: ollama rm jessica-business && ollama create jessica-business -f Modelfile.business"
    else
        echo "⚠️  Custom model 'jessica-business' not found"
        echo "   Creating jessica-business model from Modelfile.business..."
        ollama create jessica-business -f Modelfile.business
        echo "✓ Custom model 'jessica-business' created successfully"
    fi
fi

# Verify models are working
echo ""
echo "Verifying models..."
echo "Testing jessica model..."
if ollama run jessica "Say 'Semper Fi' if you're working" 2>&1 | grep -q "Semper Fi\|semper\|Semper"; then
    echo "✓ jessica model is responding"
else
    echo "⚠️  WARNING: jessica model may not be working correctly"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Models ready:"
ollama list | grep -E "^jessica|^nous-hermes2:10.7b-solar-q5_K_M" || echo "  (No matching models found)"
echo ""
echo "You can now start Jessica with:"
echo "  source ~/.bashrc"
echo "  ~/start-jessica.sh"
echo ""

