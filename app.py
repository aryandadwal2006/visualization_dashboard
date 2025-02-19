from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
import json
from datetime import datetime
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
import numpy as np
from config import MONGO_URI, DATABASE_NAME, COLLECTION_NAME
import traceback

app = Flask(__name__)

# MongoDB connection
try:
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    print("MongoDB connection successful")
except Exception as e:
    print(f"MongoDB connection error: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data/filters', methods=['GET'])
def get_filters():
    try:
        data = list(collection.find({}, {'_id': 0}))
        df = pd.DataFrame(data)
        
        # Get unique values for each filter
        filters = {
            'end_years': sorted([str(year) for year in df['end_year'].unique() if pd.notna(year) and year != '']),
            'topics': sorted(df['topic'].unique().tolist()),
            'sectors': sorted(df['sector'].unique().tolist()),
            'regions': sorted(df['region'].unique().tolist()),
            'pestles': sorted(df['pestle'].unique().tolist()),
            'sources': sorted(df['source'].unique().tolist()),
            'countries': sorted(df['country'].unique().tolist())
        }
        
        # Clean the filter values
        filters = {k: [str(v) for v in values if v and pd.notna(v) and str(v).strip()] 
                  for k, values in filters.items()}
        
        return jsonify(filters)
    except Exception as e:
        print(f"Error in get_filters: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/dashboard', methods=['GET'])
def get_dashboard_data():
    try:
        # Get filter parameters
        filters = {}
        for param in ['end_year', 'topic', 'sector', 'region', 'pestle']:
            value = request.args.get(param)
            if value and value.strip():
                filters[param] = value
        
        # Build MongoDB query
        query = {k: {'$regex': v, '$options': 'i'} for k, v in filters.items()}
        
        # Get data from MongoDB
        data = list(collection.find(query, {'_id': 0}))
        
        # Convert numeric fields
        for item in data:
            for field in ['intensity', 'likelihood', 'relevance']:
                if item.get(field):
                    try:
                        item[field] = float(item[field])
                    except (ValueError, TypeError):
                        item[field] = None
        
        return jsonify(data)
    except Exception as e:
        print(f"Error in get_dashboard_data: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/correlation', methods=['GET'])
def get_correlation():
    try:
        data = list(collection.find({}, {'_id': 0}))
        df = pd.DataFrame(data)
        
        # Convert numeric columns
        numeric_cols = ['intensity', 'likelihood', 'relevance']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Calculate correlation
        correlation_matrix = df[numeric_cols].corr().round(2)
        
        return jsonify(correlation_matrix.to_dict())
    except Exception as e:
        print(f"Error in get_correlation: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/sector-impact', methods=['GET'])
def get_sector_impact():
    try:
        # Get data from MongoDB
        data = list(collection.find({}, {'_id': 0}))
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Print debugging information
        print("Total records:", len(df))
        print("Columns:", df.columns.tolist())
        print("Sample data:", df.head(1).to_dict('records'))
        
        # Handle missing values and convert to numeric
        df['intensity'] = pd.to_numeric(df['intensity'], errors='coerce')
        df['likelihood'] = pd.to_numeric(df['likelihood'], errors='coerce')
        df['relevance'] = pd.to_numeric(df['relevance'], errors='coerce')
        
        # Fill NaN values
        df['sector'] = df['sector'].fillna('Unknown')
        
        # Remove rows where all numeric values are NaN
        df = df.dropna(subset=['intensity', 'likelihood', 'relevance'], how='all')
        
        # Group by sector
        sector_impact = (df.groupby('sector')
                        .agg({
                            'intensity': 'mean',
                            'likelihood': 'mean',
                            'relevance': 'mean',
                            'sector': 'count'
                        })
                        .rename(columns={'sector': 'count'})
                        .reset_index())
        
        # Round numeric values
        sector_impact = sector_impact.round(2)
        
        # Convert to dictionary
        result = sector_impact.to_dict('records')
        
        # Print final result for debugging
        print("Processed sector impact data:", result[:2])
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_sector_impact: {str(e)}")
        print("Full error traceback:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/insights', methods=['GET'])
def get_insights():
    try:
        data = list(collection.find({}, {'_id': 0}))
        df = pd.DataFrame(data)
        
        # Convert numeric columns
        df['intensity'] = pd.to_numeric(df['intensity'], errors='coerce')
        df['likelihood'] = pd.to_numeric(df['likelihood'], errors='coerce')
        
        # Convert published dates
        df['published'] = pd.to_datetime(df['published'], errors='coerce')
        
        insights = {
            'total_records': len(df),
            'avg_intensity': round(df['intensity'].mean(), 2),
            'top_sector': df['sector'].mode().iloc[0] if not df['sector'].empty else 'Unknown',
            'top_region': df['region'].mode().iloc[0] if not df['region'].empty else 'Unknown',
            'max_likelihood': float(df['likelihood'].max()) if not df['likelihood'].empty else 0,
            'recent_trends': df.sort_values('published', ascending=False)
                             .head(5)[['topic', 'intensity', 'published']]
                             .fillna({'topic': 'Unknown', 'intensity': 0})
                             .to_dict(orient='records')
        }
        
        return jsonify(insights)
    except Exception as e:
        print(f"Error in get_insights: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/predict', methods=['POST'])
def predict_values():
    try:
        data = list(collection.find({}, {'_id': 0}))
        df = pd.DataFrame(data)
        
        # Convert intensity to numeric and remove rows with NaN values
        df['intensity'] = pd.to_numeric(df['intensity'], errors='coerce')
        df = df.dropna(subset=['intensity'])
        
        # Clean and encode sector and region
        df['sector'] = df['sector'].fillna('Unknown')
        df['region'] = df['region'].fillna('Unknown')
        
        le_sector = LabelEncoder()
        le_region = LabelEncoder()
        
        df['sector_encoded'] = le_sector.fit_transform(df['sector'])
        df['region_encoded'] = le_region.fit_transform(df['region'])
        
        X = df[['sector_encoded', 'region_encoded']]
        y = df['intensity']
        
        # Train the model
        model = LinearRegression()
        model.fit(X, y)
        
        # Get prediction request data
        request_data = request.json
        sector = request_data.get('sector', 'Unknown')
        region = request_data.get('region', 'Unknown')
        
        # Transform input data
        try:
            sector_encoded = le_sector.transform([sector])[0]
            region_encoded = le_region.transform([region])[0]
            
            # Make prediction
            prediction = model.predict([[sector_encoded, region_encoded]])[0]
            
            return jsonify({
                'predicted_intensity': round(prediction, 2)
            })
        except ValueError as ve:
            return jsonify({
                'error': 'Invalid sector or region value',
                'predicted_intensity': 0
            })
            
    except Exception as e:
        print(f"Error in predict_values: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/time-analysis', methods=['GET'])
def get_time_analysis():
    try:
        data = list(collection.find({}, {'_id': 0}))
        df = pd.DataFrame(data)
        
        # Convert numeric columns
        numeric_cols = ['intensity', 'likelihood', 'relevance']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Group by end_year
        yearly_data = df.groupby('end_year').agg({
            'intensity': 'mean',
            'likelihood': 'mean',
            'relevance': 'mean',
            'topic': 'count'
        }).reset_index()
        
        # Round numeric values
        for col in numeric_cols:
            yearly_data[col] = yearly_data[col].round(2)
        
        return jsonify(yearly_data.to_dict(orient='records'))
    except Exception as e:
        print(f"Error in get_time_analysis: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)