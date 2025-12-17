#!/usr/bin/env python3
"""Test that all required imports work"""

try:
    import flask
    print("✓ Flask")
    import flask_cors
    print("✓ Flask-CORS")
    import chromadb
    print("✓ ChromaDB")
    import anthropic
    print("✓ Anthropic")
    import google.generativeai
    print("✓ Google Generative AI")
    from dotenv import load_dotenv
    print("✓ python-dotenv")
    from sentence_transformers import SentenceTransformer
    print("✓ sentence-transformers")
    
    print("\n✅ ALL IMPORTS SUCCESSFUL!")
except ImportError as e:
    print(f"\n❌ IMPORT FAILED: {e}")
    exit(1)
