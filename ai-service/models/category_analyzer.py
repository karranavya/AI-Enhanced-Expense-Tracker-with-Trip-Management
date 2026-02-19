"""
Enhanced Category-wise expense analysis with proper date parsing
"""
from collections import defaultdict
import statistics
from datetime import datetime, timedelta
import calendar
import re

class CategoryAnalyzer:
    def __init__(self):
        self.category_data = {}
        self.monthly_patterns = {}
        self.predictions = {}
    
    def _parse_date(self, date_str):
        """Enhanced date parsing to handle multiple formats"""
        if not date_str:
            return None
            
        # Handle different date formats
        formats_to_try = [
            '%Y-%m-%d',           # 2024-01-15
            '%Y-%m-%dT%H:%M:%S',  # 2024-01-15T10:30:00
            '%Y-%m-%dT%H:%M:%S.%f', # 2024-01-15T10:30:00.123
            '%Y-%m-%dT%H:%M:%SZ', # 2024-01-15T10:30:00Z
            '%d/%m/%Y',           # 15/01/2024
            '%m/%d/%Y',           # 01/15/2024
            '%Y/%m/%d'            # 2024/01/15
        ]
        
        # Clean the date string
        date_str = str(date_str).strip()
        
        # Try each format
        for date_format in formats_to_try:
            try:
                return datetime.strptime(date_str[:len(date_format.replace('%f', '123456'))], date_format)
            except ValueError:
                continue
        
        # If none work, try to extract just the date part from ISO string
        try:
            if 'T' in date_str:
                date_part = date_str.split('T')[0]
                return datetime.strptime(date_part, '%Y-%m-%d')
        except ValueError:
            pass
        
        # Last resort: try to parse with dateutil if available
        try:
            from dateutil.parser import parse
            return parse(date_str)
        except (ImportError, ValueError):
            pass
            
        print(f"Warning: Could not parse date '{date_str}', skipping this expense")
        return None
        
    def analyze_category_spending(self, expenses_data):
        """Analyze spending patterns by category with proper monthly breakdown"""
        try:
            # Group expenses by category and month
            category_monthly = defaultdict(lambda: defaultdict(float))
            category_transactions = defaultdict(list)
            
            successful_parses = 0
            failed_parses = 0
            
            for expense in expenses_data:
                category = expense.get('expenseType', 'Other')
                amount = float(expense.get('amount', 0))
                date_str = expense.get('date', '')
                
                # Parse date with improved logic
                expense_date = self._parse_date(date_str)
                
                if expense_date is None:
                    failed_parses += 1
                    continue
                    
                successful_parses += 1
                month_key = f"{expense_date.year}-{expense_date.month:02d}"
                category_monthly[category][month_key] += amount
                category_transactions[category].append({
                    'amount': amount,
                    'date': expense_date,
                    'month': month_key
                })
            
            print(f"✅ Successfully parsed {successful_parses} expenses")
            if failed_parses > 0:
                print(f"⚠️  Failed to parse {failed_parses} expenses")
            
            # Calculate statistics for each category
            results = {}
            for category in category_transactions.keys():
                transactions = category_transactions[category]
                monthly_data = category_monthly[category]
                
                if transactions:
                    # Basic stats
                    total_spent = sum(t['amount'] for t in transactions)
                    transaction_count = len(transactions)
                    avg_transaction = total_spent / transaction_count
                    
                    # Monthly analysis
                    months_with_data = len(monthly_data)
                    monthly_totals = list(monthly_data.values())
                    
                    # Calculate proper monthly average (only months with transactions)
                    monthly_average = sum(monthly_totals) / months_with_data if months_with_data > 0 else 0
                    
                    # Monthly breakdown
                    monthly_breakdown = {}
                    for month, total in monthly_data.items():
                        month_transactions = [t for t in transactions if t['month'] == month]
                        monthly_breakdown[month] = {
                            'total': total,
                            'count': len(month_transactions),
                            'average': total / len(month_transactions) if month_transactions else 0
                        }
                    
                    # Trend analysis
                    trend = self._calculate_trend(monthly_totals)
                    growth_rate = self._calculate_growth_rate(monthly_totals)
                    seasonality = self._detect_seasonality(monthly_breakdown)
                    
                    results[category] = {
                        'total_spent': total_spent,
                        'transaction_count': transaction_count,
                        'average_transaction': avg_transaction,
                        'monthly_average': monthly_average,
                        'months_with_data': months_with_data,
                        'monthly_data': monthly_breakdown,
                        'monthly_totals': monthly_totals,
                        'trend': trend,
                        'growth_rate': growth_rate,
                        'seasonality': seasonality
                    }
            
            return {
                'success': True,
                'category_analysis': results,
                'parsing_stats': {
                    'successful': successful_parses,
                    'failed': failed_parses,
                    'success_rate': f"{(successful_parses/(successful_parses+failed_parses)*100):.1f}%" if (successful_parses+failed_parses) > 0 else "100%"
                },
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error in analyze_category_spending: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def predict_category_spending(self, category, historical_data, days_ahead=30):
        """Enhanced prediction with trend analysis and seasonality"""
        try:
            if category not in historical_data:
                return {'error': f'No historical data for category: {category}'}
            
            category_info = historical_data[category]
            monthly_totals = category_info['monthly_totals']
            monthly_average = category_info['monthly_average']
            trend = category_info['trend']
            growth_rate = category_info['growth_rate']
            
            # Base prediction (monthly average)
            base_prediction = monthly_average
            
            # Apply trend adjustment
            if trend == 'increasing' and growth_rate > 0:
                trend_multiplier = 1 + min(growth_rate / 100, 0.5)  # Cap at 50% increase
            elif trend == 'decreasing' and growth_rate < 0:
                trend_multiplier = 1 + max(growth_rate / 100, -0.3)  # Cap at 30% decrease
            else:
                trend_multiplier = 1.0
            
            # Apply seasonality (current month factor)
            current_month = datetime.now().month
            seasonality_factor = self._get_seasonality_factor(
                category_info.get('seasonality', {}), 
                current_month
            )
            
            # Calculate prediction for next month
            predicted_amount = base_prediction * trend_multiplier * seasonality_factor
            
            # Ensure prediction is not negative
            predicted_amount = max(0, predicted_amount)
            
            # For 30-day prediction, adjust proportionally
            if days_ahead != 30:
                predicted_amount = (predicted_amount / 30) * days_ahead
            
            # Calculate confidence based on multiple factors
            confidence = self._calculate_enhanced_confidence(
                monthly_totals, 
                category_info['months_with_data'],
                growth_rate
            )
            
            # Daily average for the prediction period
            daily_avg = predicted_amount / days_ahead if days_ahead > 0 else 0
            
            return {
                'category': category,
                'predicted_amount': round(predicted_amount, 2),
                'confidence': round(confidence, 2),
                'daily_average': round(daily_avg, 2),
                'monthly_average': round(monthly_average, 2),
                'days_predicted': days_ahead,
                'trend': trend,
                'growth_rate': round(growth_rate, 2),
                'trend_multiplier': round(trend_multiplier, 3),
                'seasonality_factor': round(seasonality_factor, 3),
                'prediction_factors': {
                    'base_monthly_avg': round(monthly_average, 2),
                    'trend_adjustment': f"{'+' if trend_multiplier > 1 else ''}{round((trend_multiplier - 1) * 100, 1)}%",
                    'seasonality_adjustment': f"{'+' if seasonality_factor > 1 else ''}{round((seasonality_factor - 1) * 100, 1)}%"
                }
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def _calculate_trend(self, monthly_totals):
        """Calculate spending trend with more sophisticated analysis"""
        if len(monthly_totals) < 2:
            return 'stable'
        
        # Take last 3-6 months for trend analysis
        recent_data = monthly_totals[-6:] if len(monthly_totals) >= 6 else monthly_totals[-3:]
        
        if len(recent_data) < 2:
            return 'stable'
        
        # Simple trend analysis: compare first half to second half
        mid_point = len(recent_data) // 2
        first_half_avg = sum(recent_data[:mid_point]) / mid_point if mid_point > 0 else 0
        second_half_avg = sum(recent_data[mid_point:]) / (len(recent_data) - mid_point) if (len(recent_data) - mid_point) > 0 else 0
        
        if first_half_avg == 0:
            return 'stable'
        
        change_percentage = ((second_half_avg - first_half_avg) / first_half_avg) * 100
        
        if abs(change_percentage) < 10:  # Less than 10% change
            return 'stable'
        elif change_percentage > 0:
            return 'increasing'
        else:
            return 'decreasing'
    
    def _calculate_growth_rate(self, monthly_totals):
        """Calculate monthly growth rate percentage"""
        if len(monthly_totals) < 2:
            return 0
        
        # Compare last month to average of previous months
        if len(monthly_totals) >= 3:
            last_month = monthly_totals[-1]
            prev_months_avg = sum(monthly_totals[:-1]) / len(monthly_totals[:-1])
            
            if prev_months_avg > 0:
                growth_rate = ((last_month - prev_months_avg) / prev_months_avg) * 100
                return max(-50, min(50, growth_rate))  # Cap between -50% and +50%
        
        return 0
    
    def _detect_seasonality(self, monthly_breakdown):
        """Detect seasonal patterns in spending"""
        if len(monthly_breakdown) < 4:
            return {}
        
        # Group by month number to detect patterns
        month_patterns = defaultdict(list)
        for month_key, data in monthly_breakdown.items():
            try:
                month_num = int(month_key.split('-')[1])
                month_patterns[month_num].append(data['total'])
            except:
                continue
        
        # Calculate average spending for each month
        seasonal_factors = {}
        all_amounts = [data['total'] for data in monthly_breakdown.values()]
        overall_avg = sum(all_amounts) / len(all_amounts) if all_amounts else 0
        
        for month_num, amounts in month_patterns.items():
            if amounts and overall_avg > 0:
                month_avg = sum(amounts) / len(amounts)
                seasonal_factors[month_num] = month_avg / overall_avg
        
        return seasonal_factors
    
    def _get_seasonality_factor(self, seasonality, current_month):
        """Get seasonality adjustment factor for current month"""
        if not seasonality or current_month not in seasonality:
            return 1.0
        
        # Limit seasonality impact to prevent extreme predictions
        factor = seasonality[current_month]
        return max(0.5, min(1.5, factor))  # Between 50% to 150%
    
    def _calculate_enhanced_confidence(self, monthly_totals, months_with_data, growth_rate):
        """Calculate confidence with multiple factors"""
        # Base confidence from data amount
        if months_with_data >= 12:
            data_confidence = 0.9
        elif months_with_data >= 6:
            data_confidence = 0.8
        elif months_with_data >= 3:
            data_confidence = 0.7
        else:
            data_confidence = 0.5
        
        # Consistency confidence (lower variance = higher confidence)
        if len(monthly_totals) > 1 and sum(monthly_totals) > 0:
            mean_spending = sum(monthly_totals) / len(monthly_totals)
            if mean_spending > 0:
                variance = sum((x - mean_spending) ** 2 for x in monthly_totals) / len(monthly_totals)
                cv = (variance ** 0.5) / mean_spending  # Coefficient of variation
                consistency_confidence = max(0.3, min(0.9, 1 - cv))
            else:
                consistency_confidence = 0.5
        else:
            consistency_confidence = 0.5
        
        # Trend stability confidence (extreme growth rates reduce confidence)
        if abs(growth_rate) > 40:  # Very high volatility
            trend_confidence = 0.3
        elif abs(growth_rate) > 15:  # Moderate volatility
            trend_confidence = 0.6
        else:  # Stable growth
            trend_confidence = 0.9
        
        # Weighted average of all confidence factors
        final_confidence = (
            data_confidence * 0.4 + 
            consistency_confidence * 0.4 + 
            trend_confidence * 0.2
        )
        
        return max(0.2, min(0.95, final_confidence))
    
    def check_budget_alerts(self, category_analysis, budget_limits):
        """Enhanced budget alerts with better current month calculation"""
        alerts = []
        current_date = datetime.now()
        current_month_key = f"{current_date.year}-{current_date.month:02d}"
        
        for category, limit_info in budget_limits.items():
            if category not in category_analysis:
                continue
                
            monthly_limit = float(limit_info.get('monthly_limit', 0))
            category_data = category_analysis[category]
            monthly_data = category_data.get('monthly_data', {})
            
            # Get current month spending
            current_spending = monthly_data.get(current_month_key, {}).get('total', 0)
            
            # Calculate percentage used
            if monthly_limit > 0:
                percentage_used = (current_spending / monthly_limit) * 100
                
                # Get prediction for remaining days in month
                days_in_month = calendar.monthrange(current_date.year, current_date.month)[1]
                days_elapsed = current_date.day
                days_remaining = days_in_month - days_elapsed
                
                # Predict month-end spending
                predicted_month_end = current_spending
                if days_remaining > 0 and category_data.get('monthly_average', 0) > 0:
                    daily_trend = category_data['monthly_average'] / 30
                    predicted_month_end += daily_trend * days_remaining
                
                predicted_percentage = (predicted_month_end / monthly_limit) * 100 if monthly_limit > 0 else 0
                
                # Create alerts based on current and predicted usage
                if percentage_used >= 100:
                    alerts.append({
                        'category': category,
                        'type': 'EXCEEDED',
                        'message': f'Budget exceeded for {category}',
                        'current_spending': round(current_spending, 2),
                        'budget_limit': monthly_limit,
                        'percentage': round(percentage_used, 1),
                        'predicted_month_end': round(predicted_month_end, 2),
                        'predicted_percentage': round(predicted_percentage, 1),
                        'severity': 'high'
                    })
                elif predicted_percentage >= 100:
                    alerts.append({
                        'category': category,
                        'type': 'WILL_EXCEED',
                        'message': f'Likely to exceed budget for {category}',
                        'current_spending': round(current_spending, 2),
                        'budget_limit': monthly_limit,
                        'percentage': round(percentage_used, 1),
                        'predicted_month_end': round(predicted_month_end, 2),
                        'predicted_percentage': round(predicted_percentage, 1),
                        'severity': 'high'
                    })
                elif percentage_used >= 80:
                    alerts.append({
                        'category': category,
                        'type': 'WARNING',
                        'message': f'80% of budget used for {category}',
                        'current_spending': round(current_spending, 2),
                        'budget_limit': monthly_limit,
                        'percentage': round(percentage_used, 1),
                        'predicted_month_end': round(predicted_month_end, 2),
                        'predicted_percentage': round(predicted_percentage, 1),
                        'severity': 'medium'
                    })
                elif predicted_percentage >= 80:
                    alerts.append({
                        'category': category,
                        'type': 'CAUTION',
                        'message': f'May reach 80% budget for {category}',
                        'current_spending': round(current_spending, 2),
                        'budget_limit': monthly_limit,
                        'percentage': round(percentage_used, 1),
                        'predicted_month_end': round(predicted_month_end, 2),
                        'predicted_percentage': round(predicted_percentage, 1),
                        'severity': 'low'
                    })
        
        return alerts
