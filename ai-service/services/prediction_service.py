"""
Business logic layer for prediction operations
"""
from typing import Dict, List
from datetime import datetime
import logging

class PredictionService:
    """
    Service layer that handles business logic for predictions
    """
    
    def __init__(self, orchestrator):
        self.orchestrator = orchestrator
        self.prediction_history = []
        self.logger = logging.getLogger(__name__)
    
    def train_models(self, expense_data: List[Dict], force_retrain: bool = False) -> Dict:
        """
        Train models with business logic validation
        """
        try:
            # Business validation
            if not self._validate_training_data(expense_data):
                return {"error": "Training data validation failed"}
            
            # Check if already trained
            if self.orchestrator.is_trained and not force_retrain:
                return {
                    "message": "Models already trained. Use force_retrain=true to retrain.",
                    "current_status": self.orchestrator.get_model_status()
                }
            
            # Train models
            result = self.orchestrator.train_all_models(expense_data)
            
            # Log training result
            self.logger.info(f"Training completed. Success: {result.get('success', False)}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Training service error: {str(e)}")
            return {"error": f"Training service failed: {str(e)}"}
    
    def make_prediction(self, prediction_input: Dict, method: str = 'auto') -> Dict:
        """
        Make prediction with business logic
        """
        try:
            # Validate prediction input
            if not self._validate_prediction_input(prediction_input):
                return {"error": "Prediction input validation failed"}
            
            # Make prediction
            result = self.orchestrator.predict_expense(prediction_input, method)
            
            # Add business context to result
            if 'predicted_amount' in result:
                result = self._add_business_context(result, prediction_input)
                
                # Store prediction history
                self._store_prediction_history(prediction_input, result)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Prediction service error: {str(e)}")
            return {"error": f"Prediction service failed: {str(e)}"}
    
    def compare_all_models(self, prediction_input: Dict) -> Dict:
        """
        Compare predictions from all available models
        """
        try:
            if not self.orchestrator.is_trained:
                return {"error": "No trained models available"}
            
            comparison_result = {
                'input': prediction_input,
                'timestamp': datetime.now().isoformat(),
                'predictions': {},
                'statistics': {}
            }
            
            # Get predictions from all models
            methods = ['linear', 'polynomial', 'time_series', 'ensemble']
            predictions = []
            
            for method in methods:
                result = self.orchestrator.predict_expense(prediction_input, method)
                if 'predicted_amount' in result:
                    comparison_result['predictions'][method] = result
                    predictions.append(result['predicted_amount'])
            
            # Calculate statistics
            if predictions:
                import numpy as np
                comparison_result['statistics'] = {
                    'min_prediction': min(predictions),
                    'max_prediction': max(predictions),
                    'mean_prediction': np.mean(predictions),
                    'std_prediction': np.std(predictions),
                    'variance': max(predictions) - min(predictions),
                    'models_count': len(predictions)
                }
                
                # Recommendation
                comparison_result['recommendation'] = self._get_prediction_recommendation(
                    comparison_result['predictions'], 
                    comparison_result['statistics']
                )
            
            return comparison_result
            
        except Exception as e:
            return {"error": f"Model comparison failed: {str(e)}"}
    
    def _validate_training_data(self, expense_data: List[Dict]) -> bool:
        """Validate training data meets business requirements"""
        if not expense_data or len(expense_data) < 5:
            return False
        
        # Check required fields
        required_fields = ['subject', 'to', 'date', 'amount']
        for expense in expense_data:
            if not all(field in expense for field in required_fields):
                return False
        
        return True
    
    def _validate_prediction_input(self, prediction_input: Dict) -> bool:
        """Validate prediction input"""
        # At minimum, we need some input data
        if not prediction_input:
            return False
        
        # If date is provided, validate format
        if 'date' in prediction_input:
            try:
                datetime.strptime(prediction_input['date'], '%Y-%m-%d')
            except ValueError:
                return False
        
        return True
    
    def _add_business_context(self, result: Dict, input_data: Dict) -> Dict:
        """Add business context to prediction result"""
        predicted_amount = result['predicted_amount']
        
        # Add spending category analysis
        subject = input_data.get('subject', '').lower()
        result['expense_category'] = self._categorize_expense(subject)
        
        # Add spending level assessment
        if predicted_amount <= 100:
            result['spending_level'] = 'low'
        elif predicted_amount <= 500:
            result['spending_level'] = 'medium'
        elif predicted_amount <= 2000:
            result['spending_level'] = 'high'
        else:
            result['spending_level'] = 'very_high'
        
        # Add recommendations
        result['recommendations'] = self._get_spending_recommendations(predicted_amount, result['expense_category'])
        
        return result
    
    def _categorize_expense(self, subject: str) -> str:
        """Categorize expense based on subject"""
        categories = {
            'food': ['lunch', 'dinner', 'breakfast', 'food', 'meal', 'restaurant'],
            'transport': ['taxi', 'bus', 'uber', 'ola', 'transport', 'fuel'],
            'entertainment': ['movie', 'party', 'entertainment', 'fun'],
            'shopping': ['shopping', 'clothes', 'buy'],
            'bills': ['bill', 'electricity', 'rent'],
            'healthcare': ['doctor', 'medicine', 'hospital'],
            'education': ['book', 'course', 'education']
        }
        
        for category, keywords in categories.items():
            if any(keyword in subject for keyword in keywords):
                return category
        
        return 'other'
    
    def _get_spending_recommendations(self, amount: float, category: str) -> List[str]:
        """Generate spending recommendations"""
        recommendations = []
        
        if amount > 1000:
            recommendations.append("Consider if this expense is necessary")
            recommendations.append("Look for alternatives to reduce cost")
        
        if category == 'food' and amount > 500:
            recommendations.append("Consider cooking at home to save money")
        
        if category == 'transport' and amount > 300:
            recommendations.append("Consider public transport or carpooling")
        
        return recommendations
    
    def _get_prediction_recommendation(self, predictions: Dict, statistics: Dict) -> Dict:
        """Get recommendation based on model comparison"""
        variance = statistics.get('variance', 0)
        mean_pred = statistics.get('mean_prediction', 0)
        
        if variance / mean_pred > 0.5 if mean_pred > 0 else True:
            confidence_level = 'low'
            recommendation = 'High variance between models. Consider gathering more data.'
        elif variance / mean_pred > 0.2 if mean_pred > 0 else True:
            confidence_level = 'medium' 
            recommendation = 'Moderate agreement between models. Prediction is reasonably reliable.'
        else:
            confidence_level = 'high'
            recommendation = 'Strong agreement between models. Prediction is highly reliable.'
        
        # Recommend best model based on highest confidence
        best_model = None
        best_confidence = 0
        
        for model_name, pred_result in predictions.items():
            confidence = pred_result.get('confidence', 0)
            if confidence > best_confidence:
                best_confidence = confidence
                best_model = model_name
        
        return {
            'confidence_level': confidence_level,
            'recommendation': recommendation,
            'recommended_model': best_model,
            'recommended_amount': predictions.get(best_model, {}).get('predicted_amount', mean_pred)
        }
    
    def _store_prediction_history(self, input_data: Dict, result: Dict):
        """Store prediction in history for analysis"""
        history_entry = {
            'timestamp': datetime.now().isoformat(),
            'input': input_data,
            'prediction': result.get('predicted_amount'),
            'method': result.get('method_used'),
            'confidence': result.get('confidence')
        }
        
        self.prediction_history.append(history_entry)
        
        # Keep only last 1000 predictions
        if len(self.prediction_history) > 1000:
            self.prediction_history = self.prediction_history[-1000:]
    
    def get_prediction_analytics(self) -> Dict:
        """Get analytics on prediction history"""
        if not self.prediction_history:
            return {"message": "No prediction history available"}
        
        # Calculate analytics
        predictions = [p['prediction'] for p in self.prediction_history if p['prediction']]
        
        import numpy as np
        
        analytics = {
            'total_predictions': len(self.prediction_history),
            'average_predicted_amount': np.mean(predictions) if predictions else 0,
            'prediction_range': {
                'min': min(predictions) if predictions else 0,
                'max': max(predictions) if predictions else 0
            },
            'most_used_method': self._get_most_used_method(),
            'recent_predictions': self.prediction_history[-10:]  # Last 10 predictions
        }
        
        return analytics
    
    def _get_most_used_method(self) -> str:
        """Get the most frequently used prediction method"""
        methods = [p.get('method', 'unknown') for p in self.prediction_history]
        
        if not methods:
            return 'none'
        
        method_counts = {}
        for method in methods:
            method_counts[method] = method_counts.get(method, 0) + 1
        
        return max(method_counts, key=method_counts.get)
