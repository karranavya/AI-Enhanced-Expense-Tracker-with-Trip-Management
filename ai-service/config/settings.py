import os
from pathlib import Path

class Config:
    # Get the project root directory
    BASE_DIR = Path(__file__).parent.parent
    
    # Flask settings for local development
    HOST = '127.0.0.1'  # localhost
    PORT = 5000
    DEBUG = True
    
    # Model settings (local paths)
    MODELS_SAVE_PATH = str(BASE_DIR / 'saved_models')
    LOGS_PATH = str(BASE_DIR / 'logs')
    
    # Training settings
    MIN_TRAINING_DATA = 5
    DEFAULT_POLYNOMIAL_DEGREE = 2
    
    # Prediction settings
    DEFAULT_PREDICTION_METHOD = 'auto'
    MAX_PREDICTION_HISTORY = 1000
    
    # Model performance thresholds
    GOOD_MAE_THRESHOLD = 100.0
    GOOD_R2_THRESHOLD = 0.7
    
    # Time series settings
    MIN_TIME_SERIES_DATA = 14
    DEFAULT_FORECAST_DAYS = 7
    
    @classmethod
    def init_directories(cls):
        """Create necessary directories if they don't exist"""
        os.makedirs(cls.MODELS_SAVE_PATH, exist_ok=True)
        os.makedirs(cls.LOGS_PATH, exist_ok=True)
        print(f"✓ Created directories: {cls.MODELS_SAVE_PATH}, {cls.LOGS_PATH}")
