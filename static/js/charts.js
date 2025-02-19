// Add this at the very top of charts.js
window.ChartFunctions = {};
// Chart Configuration Constants
const CHART_CONFIG = {
    responsive: true,
    displayModeBar: 'hover',
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
        format: 'png',
        filename: 'chart',
        height: 800,
        width: 1200,
        scale: 2
    }
};

const CHART_COLORS = {
    primary: 'rgba(54, 162, 235, 0.7)',
    secondary: 'rgba(255, 99, 132, 0.7)',
    success: 'rgba(75, 192, 192, 0.7)',
    warning: 'rgba(255, 206, 86, 0.7)',
    info: 'rgba(153, 102, 255, 0.7)',
    gradient: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384'
    ]
};

// Main Chart Creation Functions
function createIntensityChart(data) {
    if (!checkChartContainer('intensityChart')) return;

    try {
        const intensityData = data
            .map(item => Number(item.intensity))
            .filter(val => !isNaN(val));

        const trace = {
            x: intensityData,
            type: 'histogram',
            nbinsx: 20,
            marker: {
                color: CHART_COLORS.primary,
                line: {
                    color: 'white',
                    width: 1
                }
            },
            hovertemplate: 
                'Intensity: %{x}<br>' +
                'Count: %{y}<br>' +
                '<extra></extra>'
        };

        const layout = createLayout('Intensity Distribution', {
            bargap: 0.1,
            xaxis: { 
                title: 'Intensity',
                gridcolor: '#eee'
            },
            yaxis: { 
                title: 'Count',
                gridcolor: '#eee'
            }
        });

        Plotly.newPlot('intensityChart', [trace], layout, CHART_CONFIG);
    } catch (error) {
        handleChartError('intensityChart', error);
    }
}

function createLikelihoodChart(data) {
    if (!checkChartContainer('likelihoodChart')) return;

    try {
        const filteredData = data.filter(item => 
            !isNaN(Number(item.likelihood)) && 
            !isNaN(Number(item.relevance))
        );

        const trace = {
            x: filteredData.map(item => Number(item.likelihood)),
            y: filteredData.map(item => Number(item.relevance)),
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: 10,
                color: CHART_COLORS.secondary,
                opacity: 0.7,
                line: {
                    color: 'white',
                    width: 1
                }
            },
            text: filteredData.map(item => item.topic),
            hovertemplate: 
                '<b>Topic:</b> %{text}<br>' +
                '<b>Likelihood:</b> %{x}<br>' +
                '<b>Relevance:</b> %{y}<br>' +
                '<extra></extra>'
        };

        const layout = createLayout('Likelihood vs Relevance', {
            xaxis: { 
                title: 'Likelihood',
                gridcolor: '#eee',
                zeroline: true
            },
            yaxis: { 
                title: 'Relevance',
                gridcolor: '#eee',
                zeroline: true
            },
            hovermode: 'closest'
        });

        Plotly.newPlot('likelihoodChart', [trace], layout, CHART_CONFIG);
    } catch (error) {
        handleChartError('likelihoodChart', error);
    }
}

function createTopicsChart(data) {
    if (!checkChartContainer('topicsChart')) return;

    try {
        const topicCounts = data.reduce((acc, item) => {
            if (item.topic) {
                acc[item.topic] = (acc[item.topic] || 0) + 1;
            }
            return acc;
        }, {});

        const sortedTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const trace = {
            x: sortedTopics.map(item => item[0]),
            y: sortedTopics.map(item => item[1]),
            type: 'bar',
            marker: {
                color: CHART_COLORS.primary,
                line: {
                    color: 'white',
                    width: 1
                }
            },
            hovertemplate: 
                '<b>Topic:</b> %{x}<br>' +
                '<b>Count:</b> %{y}<br>' +
                '<extra></extra>'
        };

        const layout = createLayout('Top 10 Topics Distribution', {
            xaxis: { 
                title: 'Topics',
                tickangle: -45,
                gridcolor: '#eee'
            },
            yaxis: { 
                title: 'Count',
                gridcolor: '#eee'
            },
            margin: { b: 100 }
        });

        Plotly.newPlot('topicsChart', [trace], layout, CHART_CONFIG);
    } catch (error) {
        handleChartError('topicsChart', error);
    }
}

function createRegionalDistribution(data) {
    if (!checkChartContainer('regionMap')) return;

    try {
        const regionCounts = data.reduce((acc, item) => {
            if (item.region) {
                acc[item.region] = (acc[item.region] || 0) + 1;
            }
            return acc;
        }, {});

        const mapData = [{
            type: 'choropleth',
            locationmode: 'country names',
            locations: Object.keys(regionCounts),
            z: Object.values(regionCounts),
            text: Object.keys(regionCounts),
            colorscale: 'Viridis',
            colorbar: {
                title: 'Number of Records',
                thickness: 20
            },
            hovertemplate: 
                '<b>Region:</b> %{text}<br>' +
                '<b>Records:</b> %{z}<br>' +
                '<extra></extra>'
        }];

        const layout = createLayout('Regional Distribution', {
            geo: {
                showframe: false,
                showcoastlines: true,
                projection: {
                    type: 'mercator'
                },
                bgcolor: 'rgba(0,0,0,0)'
            }
        });

        Plotly.newPlot('regionMap', mapData, layout, CHART_CONFIG);
    } catch (error) {
        handleChartError('regionMap', error);
    }
}

function createPestleAnalysis(data) {
    if (!checkChartContainer('pestleChart')) return;

    try {
        const pestleCounts = data.reduce((acc, item) => {
            if (item.pestle) {
                acc[item.pestle] = (acc[item.pestle] || 0) + 1;
            }
            return acc;
        }, {});

        const trace = {
            values: Object.values(pestleCounts),
            labels: Object.keys(pestleCounts),
            type: 'pie',
            hole: 0.4,
            marker: {
                colors: CHART_COLORS.gradient
            },
            textinfo: 'label+percent',
            hoverinfo: 'label+value+percent',
            textposition: 'outside'
        };

        const layout = createLayout('PESTLE Analysis Distribution', {
            showlegend: true,
            legend: {
                orientation: 'h',
                y: -0.2
            }
        });

        Plotly.newPlot('pestleChart', [trace], layout, CHART_CONFIG);
    } catch (error) {
        handleChartError('pestleChart', error);
    }
}

function createTimeAnalysis(data) {
    if (!checkChartContainer('timeChart')) return;

    try {
        const yearData = processTimeData(data);
        const years = Object.keys(yearData)
            .filter(year => year !== 'Unspecified')
            .sort();

        const traces = createTimeTraces(years, yearData);
        const layout = createLayout('Trends Over Time', {
            xaxis: { 
                title: 'Year',
                gridcolor: '#eee'
            },
            yaxis: { 
                title: 'Average Value',
                gridcolor: '#eee'
            },
            legend: {
                orientation: 'h',
                y: -0.2
            },
            hovermode: 'closest'
        });

        Plotly.newPlot('timeChart', traces, layout, CHART_CONFIG);
    } catch (error) {
        handleChartError('timeChart', error);
    }
}

// Helper Functions
function createLayout(title, additionalConfig = {}) {
    return {
        title: {
            text: title,
            font: {
                size: 16,
                color: '#2c3e50'
            }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        height: 400,
        margin: { t: 50, b: 50, l: 50, r: 50 },
        font: {
            family: 'Arial, sans-serif'
        },
        ...additionalConfig
    };
}

function processTimeData(data) {
    return data.reduce((acc, item) => {
        const year = item.end_year || 'Unspecified';
        if (!acc[year]) {
            acc[year] = {
                intensity: [],
                likelihood: [],
                relevance: []
            };
        }
        if (item.intensity) acc[year].intensity.push(Number(item.intensity));
        if (item.likelihood) acc[year].likelihood.push(Number(item.likelihood));
        if (item.relevance) acc[year].relevance.push(Number(item.relevance));
        return acc;
    }, {});
}

function createTimeTraces(years, yearData) {
    const metrics = [
        { name: 'Intensity', color: CHART_COLORS.primary },
        { name: 'Likelihood', color: CHART_COLORS.secondary },
        { name: 'Relevance', color: CHART_COLORS.success }
    ];

    return metrics.map(metric => ({
        x: years,
        y: years.map(year => average(yearData[year][metric.name.toLowerCase()])),
        name: metric.name,
        type: 'scatter',
        mode: 'lines+markers',
        line: {
            color: metric.color,
            width: 3
        },
        marker: {
            size: 8,
            color: metric.color
        }
    }));
}

function average(arr) {
    const validNumbers = arr.filter(num => !isNaN(num));
    return validNumbers.length ? 
        validNumbers.reduce((a, b) => a + b) / validNumbers.length : 0;
}

function checkChartContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Chart container ${containerId} not found`);
        return false;
    }
    return true;
}

function handleChartError(containerId, error) {
    console.error(`Error in ${containerId}:`, error);
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                Failed to load chart data
            </div>
        `;
    }
}

// Add this at the very bottom of charts.js
Object.assign(window.ChartFunctions, {
    createIntensityChart,
    createLikelihoodChart,
    createTopicsChart,
    createRegionalDistribution,
    createPestleAnalysis,
    createTimeAnalysis
});