import os

content = open("jessica_core.py", "r", encoding="utf-8").read()

# Search Cloud Memory
old1 = r"""@app.route('/memory/cloud/search', methods=['POST'])
def search_cloud_memory():
    data = request.json
    query = data.get('query', '')
    results = mem0_search_memories(query)
    return jsonify({"results": results})"""

new1 = r"""@app.route('/memory/cloud/search', methods=['POST'])
def search_cloud_memory():
    try:
        if not request.json:
            raise ValidationError("Request body must be JSON")
        data = request.json
        query = data.get('query', '')
        results = mem0_search_memories(query)
        return jsonify({"results": results, "request_id": g.request_id})
    except Exception as e:
        logger.error(f"Cloud memory search failed: {e}")
        return jsonify({"error": str(e), "request_id": g.request_id}), 500"""

if old1 in content:
    content = content.replace(old1, new1)
    print("Patched search_cloud_memory")
else:
    print("Skipped search_cloud_memory")

# Get All Cloud Memories
old2 = r"""@app.route('/memory/cloud/all', methods=['GET'])
def get_all_cloud_memories():
    results = mem0_get_all_memories()
    return jsonify({"results": results})"""

new2 = r"""@app.route('/memory/cloud/all', methods=['GET'])
def get_all_cloud_memories():
    try:
        results = mem0_get_all_memories()
        return jsonify({"results": results, "request_id": g.request_id})
    except Exception as e:
        logger.error(f"Failed to retrieve all cloud memories: {e}")
        return jsonify({"error": str(e), "request_id": g.request_id}), 500"""

if old2 in content:
    content = content.replace(old2, new2)
    print("Patched get_all_cloud_memories")
else:
    print("Skipped get_all_cloud_memories")

open("jessica_core.py", "w", encoding="utf-8").write(content)
