"""
Memory Server - ChromaDB Vector Storage Service
Provides memory storage and recall via HTTP API on port 5001
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from chromadb.config import Settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# ChromaDB configuration
MEMORY_DIR = os.path.expanduser("~/jessica-memory")
os.makedirs(MEMORY_DIR, exist_ok=True)

# Initialize ChromaDB client
try:
    client = chromadb.PersistentClient(
        path=MEMORY_DIR,
        settings=Settings(anonymized_telemetry=False)
    )
    logger.info(f"ChromaDB initialized at {MEMORY_DIR}")
except Exception as e:
    logger.error(f"Failed to initialize ChromaDB: {e}")
    raise

# Get or create default collection
collection = client.get_or_create_collection(
    name="conversations",
    metadata={"description": "Jessica conversation memories"}
)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Quick check that ChromaDB is accessible
        collection.count()
        return jsonify({"status": "healthy", "service": "memory_server"}), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 503


@app.route('/store', methods=['POST'])
def store():
    """Store memory in ChromaDB
    
    Request body:
    {
        "id": "unique_id",
        "text": "memory text",
        "collection": "conversations" (optional),
        "metadata": {} (optional)
    }
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        memory_id = data.get('id')
        text = data.get('text')
        collection_name = data.get('collection', 'conversations')
        metadata = data.get('metadata', {})
        
        if not memory_id:
            return jsonify({"error": "Missing 'id' field"}), 400
        if not text:
            return jsonify({"error": "Missing 'text' field"}), 400
        
        # Get or create collection if different from default
        if collection_name != "conversations":
            target_collection = client.get_or_create_collection(name=collection_name)
        else:
            target_collection = collection
        
        # Store in ChromaDB
        target_collection.add(
            ids=[memory_id],
            documents=[text],
            metadatas=[metadata] if metadata else None
        )
        
        logger.info(f"Stored memory: {memory_id[:8]}... in collection '{collection_name}'")
        return jsonify({
            "success": True,
            "id": memory_id,
            "collection": collection_name
        }), 200
        
    except Exception as e:
        logger.error(f"Store memory failed: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/recall', methods=['POST'])
def recall():
    """Recall memories from ChromaDB using semantic search
    
    Request body:
    {
        "query": "search query",
        "n": 3 (number of results, optional, default 3),
        "collection": "conversations" (optional)
    }
    
    Returns:
    {
        "documents": ["memory1", "memory2", ...]
    }
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        query = data.get('query')
        n = data.get('n', 3)
        collection_name = data.get('collection', 'conversations')
        
        if not query:
            return jsonify({"error": "Missing 'query' field"}), 400
        
        # Get collection
        if collection_name != "conversations":
            target_collection = client.get_or_create_collection(name=collection_name)
        else:
            target_collection = collection
        
        # Query ChromaDB
        results = target_collection.query(
            query_texts=[query],
            n_results=min(n, 10)  # Cap at 10 for performance
        )
        
        # Extract documents from results
        documents = []
        if results.get('documents') and len(results['documents']) > 0:
            documents = results['documents'][0]  # First query result
        
        logger.info(f"Recalled {len(documents)} memories for query: {query[:50]}...")
        return jsonify({"documents": documents}), 200
        
    except Exception as e:
        logger.error(f"Recall memory failed: {e}", exc_info=True)
        return jsonify({"error": str(e), "documents": []}), 500


@app.route('/count', methods=['GET'])
def count():
    """Get count of memories in collection"""
    try:
        collection_name = request.args.get('collection', 'conversations')
        
        if collection_name != "conversations":
            target_collection = client.get_or_create_collection(name=collection_name)
        else:
            target_collection = collection
        
        count = target_collection.count()
        return jsonify({"count": count, "collection": collection_name}), 200
        
    except Exception as e:
        logger.error(f"Count failed: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    logger.info("="*60)
    logger.info("JESSICA MEMORY SERVER - Starting on port 5001")
    logger.info(f"ChromaDB storage: {MEMORY_DIR}")
    logger.info("="*60)
    
    app.run(host='0.0.0.0', port=5001, debug=False)

