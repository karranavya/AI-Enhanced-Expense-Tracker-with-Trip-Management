"""
Category analysis routes
"""
from flask import Blueprint, request, jsonify
from models.category_analyzer import CategoryAnalyzer
import traceback

category_bp = Blueprint('category', __name__)
analyzer = CategoryAnalyzer()

@category_bp.route('/analyze-categories', methods=['POST'])
def analyze_categories():
    """Analyze spending by category"""
    try:
        data = request.get_json()
        expenses = data.get('expenses', [])
        
        if not expenses:
            return jsonify({'error': 'No expense data provided'}), 400
        
        result = analyzer.analyze_category_spending(expenses)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@category_bp.route('/predict-category', methods=['POST'])
def predict_category():
    """Predict spending for specific category"""
    try:
        data = request.get_json()
        category = data.get('category')
        historical_data = data.get('historical_data')
        days_ahead = data.get('days_ahead', 30)
        
        if not category or not historical_data:
            return jsonify({'error': 'Category and historical data required'}), 400
        
        result = analyzer.predict_category_spending(category, historical_data, days_ahead)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@category_bp.route('/budget-alerts', methods=['POST'])
def check_budget_alerts():
    """Check for budget alerts"""
    try:
        data = request.get_json()
        category_analysis = data.get('category_analysis', {})
        budget_limits = data.get('budget_limits', {})
        
        alerts = analyzer.check_budget_alerts(category_analysis, budget_limits)
        
        return jsonify({
            'success': True,
            'alerts': alerts,
            'alert_count': len(alerts)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@category_bp.route('/category-insights', methods=['POST'])
def get_category_insights():
    """Get comprehensive category insights"""
    try:
        data = request.get_json()
        expenses = data.get('expenses', [])
        budget_limits = data.get('budget_limits', {})
        
        # Analyze categories
        analysis_result = analyzer.analyze_category_spending(expenses)
        if not analysis_result['success']:
            return jsonify(analysis_result), 400
        
        category_analysis = analysis_result['category_analysis']
        
        # Generate predictions for each category
        predictions = {}
        for category in category_analysis.keys():
            pred = analyzer.predict_category_spending(category, category_analysis)
            if 'error' not in pred:
                predictions[category] = pred
        
        # Check budget alerts
        alerts = analyzer.check_budget_alerts(category_analysis, budget_limits)
        
        return jsonify({
            'success': True,
            'category_analysis': category_analysis,
            'predictions': predictions,
            'alerts': alerts,
            'summary': {
                'total_categories': len(category_analysis),
                'total_alerts': len(alerts),
                'high_priority_alerts': len([a for a in alerts if a['severity'] == 'high'])
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
