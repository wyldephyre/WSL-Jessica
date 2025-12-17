"""
Memory Server - ChromaDB Vector Storage Service
Provides memory storage and recall via HTTP API on port 5001
"""

import os
import logging
import json
import time
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
# #region agent log
try:
    with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"init","hypothesisId":"D","location":"memory_server.py:28","message":"ChromaDB client init start","data":{"MEMORY_DIR":MEMORY_DIR},"timestamp":int(time.time()*1000)}) + '\n')
except: pass
# #endregion
try:
    init_start = time.time()
    client = chromadb.PersistentClient(
        path=MEMORY_DIR,
        settings=Settings(anonymized_telemetry=False)
    )
    init_duration = time.time() - init_start
    logger.info(f"ChromaDB initialized at {MEMORY_DIR}")
    # #region agent log
    try:
        with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"init","hypothesisId":"D","location":"memory_server.py:35","message":"ChromaDB client init success","data":{"duration_ms":init_duration*1000},"timestamp":int(time.time()*1000)}) + '\n')
    except: pass
    # #endregion
except Exception as e:
    # #region agent log
    try:
        with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"init","hypothesisId":"D","location":"memory_server.py:36","message":"ChromaDB client init failed","data":{"error":str(e)},"timestamp":int(time.time()*1000)}) + '\n')
    except: pass
    # #endregion
    logger.error(f"Failed to initialize ChromaDB: {e}")
    raise

# Get or create default collection
# #region agent log
try:
    with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
        f.write(json.dumps({"sessionId":"debug-session","runId":"init","hypothesisId":"C","location":"memory_server.py:50","message":"Collection get_or_create start","data":{},"timestamp":int(time.time()*1000)}) + '\n')
except: pass
# #endregion
try:
    collection_start = time.time()
    collection = client.get_or_create_collection(
        name="conversations",
        metadata={"description": "Jessica conversation memories"}
    )
    collection_duration = time.time() - collection_start
    # #region agent log
    try:
        with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"init","hypothesisId":"C","location":"memory_server.py:56","message":"Collection get_or_create success","data":{"duration_ms":collection_duration*1000},"timestamp":int(time.time()*1000)}) + '\n')
    except: pass
    # #endregion
except Exception as e:
    # #region agent log
    try:
        with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"init","hypothesisId":"C","location":"memory_server.py:58","message":"Collection get_or_create failed","data":{"error":str(e)},"timestamp":int(time.time()*1000)}) + '\n')
    except: pass
    # #endregion
    raise


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
    # #region agent log
    try:
        with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"store","hypothesisId":"B","location":"memory_server.py:69","message":"Store endpoint entry","data":{},"timestamp":int(time.time()*1000)}) + '\n')
    except: pass
    # #endregion
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
        # #region agent log
        try:
            with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"store","hypothesisId":"B","location":"memory_server.py:103","message":"Before ChromaDB add","data":{"memory_id":memory_id[:8],"text_len":len(text)},"timestamp":int(time.time()*1000)}) + '\n')
        except: pass
        # #endregion
        add_start = time.time()
        target_collection.add(
            ids=[memory_id],
            documents=[text],
            metadatas=[metadata] if metadata else None
        )
        add_duration = time.time() - add_start
        # #region agent log
        try:
            with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"store","hypothesisId":"B","location":"memory_server.py:112","message":"After ChromaDB add","data":{"duration_ms":add_duration*1000},"timestamp":int(time.time()*1000)}) + '\n')
        except: pass
        # #endregion
        
        logger.info(f"Stored memory: {memory_id[:8]}... in collection '{collection_name}'")
        return jsonify({
            "success": True,
            "id": memory_id,
            "collection": collection_name
        }), 200
        
    except Exception as e:
        # #region agent log
        try:
            with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"store","hypothesisId":"B","location":"memory_server.py:125","message":"Store exception","data":{"error":str(e),"error_type":type(e).__name__},"timestamp":int(time.time()*1000)}) + '\n')
        except: pass
        # #endregion
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
    # #region agent log
    try:
        with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"recall","hypothesisId":"E","location":"memory_server.py:130","message":"Recall endpoint entry","data":{},"timestamp":int(time.time()*1000)}) + '\n')
    except: pass
    # #endregion
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
        # #region agent log
        try:
            with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"recall","hypothesisId":"E","location":"memory_server.py:155","message":"Before ChromaDB query","data":{"query":query[:50]},"timestamp":int(time.time()*1000)}) + '\n')
        except: pass
        # #endregion
        query_start = time.time()
        results = target_collection.query(
            query_texts=[query],
            n_results=min(n, 10)  # Cap at 10 for performance
        )
        query_duration = time.time() - query_start
        # #region agent log
        try:
            with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"recall","hypothesisId":"E","location":"memory_server.py:163","message":"After ChromaDB query","data":{"duration_ms":query_duration*1000},"timestamp":int(time.time()*1000)}) + '\n')
        except: pass
        # #endregion
        
        # Extract documents from results
        documents = []
        if results.get('documents') and len(results['documents']) > 0:
            documents = results['documents'][0]  # First query result
        
        logger.info(f"Recalled {len(documents)} memories for query: {query[:50]}...")
        return jsonify({"documents": documents}), 200
        
    except Exception as e:
        # #region agent log
        try:
            with open('/home/phyre/jessica-core/.cursor/debug.log', 'a') as f:
                f.write(json.dumps({"sessionId":"debug-session","runId":"recall","hypothesisId":"E","location":"memory_server.py:177","message":"Recall exception","data":{"error":str(e),"error_type":type(e).__name__},"timestamp":int(time.time()*1000)}) + '\n')
        except: pass
        # #endregion
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

