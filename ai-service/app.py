import sys
from pathlib import Path

# Add project root to path for local imports
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import traceback

# Import your modules (these will now work!)
from models.expense_predictor import ExpensePredictionOrchestrator
from services.prediction_service import PredictionService
from config.settings import Config
from routes.category_routes import category_bp  # NEW IMPORT

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'])

app.register_blueprint(category_bp, url_prefix='/api') 
# Initialize services
print("🔄 Initializing AI services...")
Config.init_directories()
orchestrator = ExpensePredictionOrchestrator(models_save_path=Config.MODELS_SAVE_PATH)
prediction_service = PredictionService(orchestrator)

# Try to load existing models
print("📂 Loading existing models...")
load_result = orchestrator.load_models()
if load_result.get('success'):
    print(f"✅ Loaded {load_result.get('loaded_models', 0)} models")
else:
    print("ℹ️  No existing models found - ready for training")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "ai-expense-predictor",
        "mode": "local_development",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "models_trained": orchestrator.is_trained,
        "available_models": list(orchestrator.models.keys()),
        "python_version": sys.version,
        "working_directory": str(Path.cwd())
    })

@app.route('/train', methods=['POST'])
def train_models():
    """Train all AI models with expense data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        expense_data = data.get('expenses', [])
        force_retrain = data.get('force_retrain', False)
        
        print(f"📊 Received training request with {len(expense_data)} expenses")
        
        if not expense_data:
            return jsonify({"error": "No expense data provided"}), 400
        
        # Use prediction service for training
        result = prediction_service.train_models(expense_data, force_retrain)
        
        if result.get('success'):
            print("✅ Training completed successfully")
        else:
            print(f"❌ Training failed: {result.get('error')}")
        
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"Training request failed: {str(e)}"
        print(f"❌ {error_msg}")
        print(traceback.format_exc())
        return jsonify({"error": error_msg}), 500

@app.route('/predict', methods=['POST'])
def predict_expense():
    """Make expense prediction"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Extract prediction method
        method = data.get('method', 'auto')
        
        print(f"🔮 Making prediction with method: {method}")
        
        # Remove method from prediction input
        prediction_input = {k: v for k, v in data.items() if k != 'method'}
        
        # Use prediction service
        result = prediction_service.make_prediction(prediction_input, method)
        
        if 'predicted_amount' in result:
            print(f"✅ Prediction: ₹{result['predicted_amount']:.2f}")
        
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"Prediction request failed: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({"error": error_msg}), 500

@app.route('/predict/compare', methods=['POST'])
def compare_predictions():
    """Compare predictions from all available models"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        print("📈 Comparing all model predictions...")
        result = prediction_service.compare_all_models(data)
        
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"Comparison request failed: {str(e)}"
        print(f"❌ {error_msg}")
        return jsonify({"error": error_msg}), 500

@app.route('/models/status', methods=['GET'])
def get_models_status():
    """Get status of all models"""
    try:
        status = orchestrator.get_model_status()
        return jsonify(status)
        
    except Exception as e:
        return jsonify({"error": f"Status request failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting AI Expense Prediction Service...")
    print("🔧 Local Development Mode")
    print("=" * 50)
    app.run(host='127.0.0.1', port=3001, debug=True)
