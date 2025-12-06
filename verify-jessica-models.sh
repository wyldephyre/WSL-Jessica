#!/bin/bash
# Quick verification script to check if Jessica models exist

set -e

echo "=========================================="
echo "Jessica Model Verification"
echo "=========================================="
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama is not running"
    echo "   Start it with: ollama serve"
    exit 1
fi

echo "Checking installed models..."
echo ""

# Check base model
if ollama list | grep -q "qwen2.5:32b"; then
    echo "✓ qwen2.5:32b (base model)"
else
    echo "✗ qwen2.5:32b (base model) - MISSING"
fi

# Check jessica model
if ollama list | grep -q "^jessica\s"; then
    echo "✓ jessica (custom model)"
else
    echo "✗ jessica (custom model) - MISSING"
    echo "  Create with: ollama create jessica -f Modelfile"
fi

# Check jessica-business model
if ollama list | grep -q "^jessica-business\s"; then
    echo "✓ jessica-business (business mode)"
else
    echo "✗ jessica-business (business mode) - MISSING"
    echo "  Create with: ollama create jessica-business -f Modelfile.business"
fi

echo ""
echo "All models:"
ollama list
echo ""

# Quick test
echo "Testing jessica model..."
if ollama run jessica "Say 'ready' if you're working" 2>&1 | head -1 > /dev/null; then
    echo "✓ jessica model is responding"
else
    echo "⚠️  jessica model may not be working"
fi

echo ""
echo "=========================================="

