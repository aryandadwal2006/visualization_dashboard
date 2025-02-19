# Data Visualization Dashboard

## Project Overview
An interactive data visualization dashboard built with Flask and MongoDB, featuring real-time data analysis, multiple chart types, and predictive modeling capabilities. This dashboard provides insights into various metrics including intensity, likelihood, relevance, and sector-wise analysis across different regions and time periods.

## Features

### Data Visualization
- **Intensity Distribution**: Histogram showing the distribution of intensity values
- **Likelihood vs Relevance**: Scatter plot comparing likelihood and relevance metrics
- **Regional Distribution**: Geographic visualization of data across regions
- **PESTLE Analysis**: Interactive pie chart showing PESTLE category distribution
- **Topics Distribution**: Bar chart of top 10 most frequent topics
- **Time-based Analysis**: Line chart showing trends over time
- **Correlation Analysis**: Heatmap showing correlations between key metrics
- **Sector Impact Analysis**: Bubble chart displaying sector-wise impact

### Interactive Features
- Real-time data filtering
- Dynamic chart updates
- Interactive tooltips
- Zoom and pan capabilities
- Chart download options

### Analysis Tools
- Statistical summaries
- Correlation matrices
- Trend analysis
- Predictive modeling for intensity

### Data Management
- MongoDB integration
- JSON data processing
- Data export capabilities
- Filter persistence

## Technology Stack

### Backend
- **Flask**: Web framework
- **MongoDB**: Database
- **Python**: Programming language
- **Pandas**: Data processing
- **Scikit-learn**: Machine learning

### Frontend
- **HTML5/CSS3**: Structure and styling
- **JavaScript**: Client-side functionality
- **Bootstrap 5**: UI framework
- **Plotly.js**: Chart visualization
- **D3.js**: Data visualization
- **Font Awesome**: Icons

## Installation

### Prerequisites
- Python 3.8+
- MongoDB
- Node.js (for package management)

### Setup Instructions

1. Clone the repository:
git clone <repository-url>
cd visualization-dashboard

2. Create and activate virtual environment:
python -m venv venv
# Windows
venv\Scripts\activate
# Unix/MacOS
source venv/bin/activate

3. Install dependencies:
pip install -r requirements.txt

4. Configure MongoDB:
- Start MongoDB service
- Create database 'dashboard_db'
- Create collection 'visualization_data'

5. Load data:
python load_data.py

6. Run the application:
python app.py

7. Access the dashboard:
http://localhost:5000

## Project Structure
visualization_dashboard/
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── dashboard.js
│       ├── analytics.js
│       └── charts.js
├── templates/
│   └── index.html
├── app.py
├── config.py
├── load_data.py
├── requirements.txt
└── README.md

## File Descriptions
- `app.py`: Main Flask application and API routes
- `config.py`: Configuration settings
- `load_data.py`: Data loading script
- `dashboard.js`: Main dashboard functionality
- `analytics.js`: Data analysis functions
- `charts.js`: Chart creation and management
- `style.css`: Custom styling
- `index.html`: Main dashboard template

## API Endpoints

### Data Retrieval
- `GET /api/data/filters`: Get filter options
- `GET /api/data/dashboard`: Get dashboard data
- `GET /api/data/correlation`: Get correlation data
- `GET /api/data/sector-impact`: Get sector impact data
- `GET /api/data/insights`: Get data insights

### Analysis
- `POST /api/data/predict`: Get intensity predictions

## Usage Guide

### Dashboard Navigation
1. **Filters**: Use the top filter section to filter data by:
   - End Year
   - Topic
   - Sector
   - Region
   - PESTLE

2. **Charts**:
   - Click on chart elements for detailed information
   - Use zoom controls for detailed view
   - Download charts as PNG
   - Reset zoom using double-click

3. **Data Analysis**:
   - View correlation matrix for relationships
   - Check sector impact for sector-wise analysis
   - Use time-based analysis for trends

4. **Predictions**:
   - Select sector and region
   - Click "Predict" for intensity prediction
   - View confidence intervals

### Data Export
- Export to CSV
- Export to PDF
- Export individual charts

## Performance Optimization
- Lazy loading of charts
- Data caching
- Optimized MongoDB queries
- Efficient data processing

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Known Issues
- Message port closure warnings in console (Chrome extension related)
- Minor rendering delays with large datasets
- PDF export might take time for complex visualizations

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Data source: Blackcoffer
- Chart libraries: Plotly.js
- UI Framework: Bootstrap

## Version History
- v1.0.0: Initial release
- v1.0.1: Bug fixes and performance improvements

## Additional Notes
- Ensure MongoDB is running before starting the application
- Regular data backups recommended
- Check browser console for any errors
- Clear browser cache if experiencing issues