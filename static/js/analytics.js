// Add this at the very top of analytics.js
window.AnalyticsFunctions = {};
// Analytics Configuration
const ANALYTICS_CONFIG = {
    DEFAULT_LAYOUT: {
        height: 400,
        margin: { t: 50, b: 50, l: 50, r: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            family: 'Segoe UI, Arial, sans-serif'
        }
    },
    COLORS: {
        correlation: 'RdBu',
        sector: 'Viridis'
    }
};

// Analytics Functions
async function loadInsights() {
    const insightsList = document.getElementById('insightsList');
    if (!insightsList) return;

    try {
        showLoadingState(insightsList, 'Loading insights...');
        
        const response = await fetch('/api/data/insights');
        if (!response.ok) throw new Error('Failed to fetch insights');
        
        const insights = await response.json();
        renderInsights(insights, insightsList);
    } catch (error) {
        console.error('Error loading insights:', error);
        showErrorState(insightsList, 'Failed to load insights');
    }
}

function renderInsights(insights, container) {
    const trendsList = insights.recent_trends
        .map(trend => `
            <li class="trend-item">
                <span class="trend-topic">${sanitizeHTML(trend.topic)}</span>
                <span class="trend-intensity badge bg-primary">
                    Intensity: ${formatNumber(trend.intensity, 1)}
                </span>
            </li>
        `).join('');

    container.innerHTML = `
        <div class="alert alert-info">
            <div class="insights-grid">
                <div class="insights-summary">
                    <h6 class="insights-title">Key Metrics</h6>
                    <div class="metrics-grid">
                        <div class="metric">
                            <i class="fas fa-database"></i>
                            <span class="metric-label">Total Records</span>
                            <span class="metric-value">${formatNumber(insights.total_records)}</span>
                        </div>
                        <div class="metric">
                            <i class="fas fa-chart-line"></i>
                            <span class="metric-label">Avg Intensity</span>
                            <span class="metric-value">${formatNumber(insights.avg_intensity, 1)}</span>
                        </div>
                        <div class="metric">
                            <i class="fas fa-industry"></i>
                            <span class="metric-label">Top Sector</span>
                            <span class="metric-value">${insights.top_sector || 'N/A'}</span>
                        </div>
                        <div class="metric">
                            <i class="fas fa-globe"></i>
                            <span class="metric-label">Top Region</span>
                            <span class="metric-value">${insights.top_region || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="insights-trends">
                    <h6 class="insights-title">Recent Trends</h6>
                    <ul class="trends-list">
                        ${trendsList}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

async function createCorrelationChart() {
    try {
        const response = await fetch('/api/data/correlation');
        if (!response.ok) throw new Error('Failed to fetch correlation data');
        
        const correlationData = await response.json();
        
        const labels = Object.keys(correlationData);
        const values = labels.map(label => 
            labels.map(l => correlationData[label][l]));
        
        const trace = {
            type: 'heatmap',
            z: values,
            x: labels,
            y: labels,
            colorscale: ANALYTICS_CONFIG.COLORS.correlation,
            zmin: -1,
            zmax: 1
        };
        
        const layout = {
            ...ANALYTICS_CONFIG.DEFAULT_LAYOUT,
            title: 'Correlation Matrix',
            annotations: createCorrelationAnnotations(values, labels)
        };
        
        Plotly.newPlot('correlationChart', [trace], layout);
    } catch (error) {
        console.error('Error creating correlation chart:', error);
        showErrorInChart('correlationChart', 'Failed to load correlation data');
    }
}

async function createSectorImpactChart() {
    try {
        console.log('Fetching sector impact data...');
        const response = await fetch('/api/data/sector-impact');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch sector impact data');
        }
        
        const sectorData = await response.json();
        console.log('Received sector data:', sectorData);
        
        if (!sectorData || sectorData.length === 0) {
            throw new Error('No sector data available');
        }

        const trace = {
            type: 'scatter',
            mode: 'markers',
            x: sectorData.map(d => d.intensity),
            y: sectorData.map(d => d.likelihood),
            text: sectorData.map(d => d.sector),
            marker: {
                size: sectorData.map(d => Math.max(10, Math.min(d.count, 50))), // Min size 10, max size 50
                color: sectorData.map(d => d.relevance),
                colorscale: 'Viridis',
                showscale: true,
                colorbar: {
                    title: 'Relevance',
                    thickness: 20
                }
            },
            hovertemplate: `
                <b>Sector:</b> %{text}<br>
                <b>Intensity:</b> %{x:.1f}<br>
                <b>Likelihood:</b> %{y:.1f}<br>
                <b>Count:</b> %{marker.size}<br>
                <b>Relevance:</b> %{marker.color:.1f}<br>
                <extra></extra>
            `
        };

        const layout = {
            title: 'Sector Impact Analysis',
            height: 500,
            xaxis: { 
                title: 'Average Intensity',
                zeroline: true,
                gridcolor: '#eee'
            },
            yaxis: { 
                title: 'Average Likelihood',
                zeroline: true,
                gridcolor: '#eee'
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            hovermode: 'closest',
            margin: { t: 50, b: 50, l: 50, r: 50 }
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false
        };

        await Plotly.newPlot('sectorImpactChart', [trace], layout, config);
        console.log('Sector impact chart created successfully');
        
    } catch (error) {
        console.error('Error creating sector impact chart:', error);
        const container = document.getElementById('sectorImpactChart');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Error: ${error.message}
                </div>
            `;
        }
    }
}

// Add this helper function
function showErrorInChart(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> ${message}
            </div>
        `;
    }
}

// Prediction Setup and Handling
async function setupPrediction() {
    const sectorSelect = document.getElementById('predictSector');
    const regionSelect = document.getElementById('predictRegion');
    const predictButton = document.getElementById('predictButton');
    const resultDiv = document.getElementById('predictionResult');

    if (!sectorSelect || !regionSelect || !predictButton || !resultDiv) return;

    try {
        const response = await fetch('/api/data/filters');
        if (!response.ok) throw new Error('Failed to fetch filter data');
        
        const filters = await response.json();
        
        populatePredictionDropdowns(sectorSelect, regionSelect, filters);
        setupPredictionEventListener(sectorSelect, regionSelect, predictButton, resultDiv);
    } catch (error) {
        console.error('Error setting up prediction:', error);
        showErrorState(resultDiv, 'Failed to setup prediction tool');
    }
}

// Utility Functions
function processCorrelationData(data) {
    const labels = Object.keys(data);
    const values = labels.map(label => 
        labels.map(l => data[label][l])
    );
    return { labels, values };
}

function createCorrelationAnnotations(values, labels) {
    return values.map((row, i) => 
        row.map((val, j) => ({
            x: labels[j],
            y: labels[i],
            text: formatNumber(val, 2),
            font: {
                color: Math.abs(val) > 0.5 ? 'white' : 'black',
                size: 10
            },
            showarrow: false
        }))
    ).flat();
}

function createCorrelationHoverTemplate() {
    return `
        <b>Variables:</b><br>
        X: %{x}<br>
        Y: %{y}<br>
        <b>Correlation:</b> %{z:.2f}<br>
        <extra></extra>
    `;
}

function createSectorHoverTemplate() {
    return `
        <b>%{text}</b><br>
        Intensity: %{x:.1f}<br>
        Likelihood: %{y:.1f}<br>
        Count: %{marker.size}<br>
        Relevance: %{marker.color:.1f}
        <extra></extra>
    `;
}

function calculateMarkerSize(count) {
    // Min size: 10, Max size: 50
    return Math.min(Math.max(count / 2, 10), 50);
}

function populatePredictionDropdowns(sectorSelect, regionSelect, filters) {
    [
        { element: sectorSelect, data: filters.sectors, label: 'Select Sector' },
        { element: regionSelect, data: filters.regions, label: 'Select Region' }
    ].forEach(({ element, data, label }) => {
        element.innerHTML = `
            <option value="">${label}</option>
            ${data.map(item => `
                <option value="${sanitizeHTML(item)}">${sanitizeHTML(item)}</option>
            `).join('')}
        `;
    });
}

function setupPredictionEventListener(sectorSelect, regionSelect, predictButton, resultDiv) {
    predictButton.addEventListener('click', async () => {
        try {
            if (!sectorSelect.value || !regionSelect.value) {
                throw new Error('Please select both sector and region');
            }

            showLoadingState(resultDiv, 'Calculating prediction...');
            
            const response = await fetch('/api/data/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sector: sectorSelect.value,
                    region: regionSelect.value
                })
            });
            
            if (!response.ok) throw new Error('Prediction failed');
            
            const result = await response.json();
            
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    <strong>Predicted Intensity:</strong> ${formatNumber(result.predicted_intensity, 1)}
                </div>
            `;
        } catch (error) {
            console.error('Prediction error:', error);
            showErrorState(resultDiv, error.message);
        }
    });
}

// Helper Functions
function showLoadingState(element, message = 'Loading...') {
    const container = typeof element === 'string' ? 
        document.getElementById(element) : element;
    if (!container) return;

    container.innerHTML = `
        <div class="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        </div>
    `;
}

function showErrorState(element, message) {
    const container = typeof element === 'string' ? 
        document.getElementById(element) : element;
    if (!container) return;

    container.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        </div>
    `;
}

function formatNumber(number, decimals = 0) {
    return Number(isNaN(number) ? 0 : number).toFixed(decimals);
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

Object.assign(window.AnalyticsFunctions, {
    loadInsights,
    createCorrelationChart,
    createSectorImpactChart,
    setupPrediction
});