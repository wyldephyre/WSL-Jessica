"""
Whisper Server - Speech-to-Text Service
Provides audio transcription via OpenAI Whisper on port 5000
"""

import os
import logging
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Load Whisper model (base model for speed/quality balance)
# Model is loaded once at startup for performance
MODEL_NAME = os.getenv("WHISPER_MODEL", "base")
logger.info(f"Loading Whisper model: {MODEL_NAME}")

try:
    whisper_model = whisper.load_model(MODEL_NAME)
    logger.info(f"Whisper model '{MODEL_NAME}' loaded successfully")
except Exception as e:
    logger.error(f"Failed to load Whisper model: {e}")
    whisper_model = None


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    if whisper_model is None:
        return jsonify({
            "status": "unhealthy",
            "error": "Whisper model not loaded"
        }), 503
    
    return jsonify({
        "status": "healthy",
        "service": "whisper_server",
        "model": MODEL_NAME
    }), 200


@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file to text
    
    Request:
    - Form data with 'audio' file field
    
    Returns:
    {
        "text": "transcribed text",
        "language": "detected language code"
    }
    """
    if whisper_model is None:
        return jsonify({
            "error": "Whisper model not available",
            "error_code": "MODEL_NOT_LOADED"
        }), 503
    
    try:
        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({
                "error": "No audio file provided",
                "error_code": "MISSING_FILE"
            }), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({
                "error": "No audio file selected",
                "error_code": "EMPTY_FILE"
            }), 400
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            audio_file.save(tmp_file.name)
            temp_path = tmp_file.name
        
        try:
            # Transcribe audio
            logger.info(f"Transcribing audio file: {audio_file.filename}")
            result = whisper_model.transcribe(
                temp_path,
                language=None,  # Auto-detect language
                task="transcribe"
            )
            
            transcription = result.get("text", "").strip()
            language = result.get("language", "unknown")
            
            logger.info(f"Transcription complete: {len(transcription)} characters, language: {language}")
            
            return jsonify({
                "text": transcription,
                "language": language
            }), 200
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_path}: {e}")
        
    except Exception as e:
        logger.error(f"Transcription failed: {e}", exc_info=True)
        return jsonify({
            "error": str(e),
            "error_code": "TRANSCRIPTION_ERROR"
        }), 500


if __name__ == '__main__':
    if whisper_model is None:
        logger.error("="*60)
        logger.error("WHISPER SERVER - FAILED TO START")
        logger.error("Whisper model could not be loaded")
        logger.error("="*60)
        exit(1)
    
    logger.info("="*60)
    logger.info("JESSICA WHISPER SERVER - Starting on port 5000")
    logger.info(f"Model: {MODEL_NAME}")
    logger.info("="*60)
    
    app.run(host='0.0.0.0', port=5000, debug=False)

