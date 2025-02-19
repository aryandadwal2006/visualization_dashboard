// static/js/config.js
window.DashboardConfig = {
    CHART_CONFIG: {
        responsive: true,
        displayModeBar: 'hover',
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    },
    
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
        primary: 'rgba(54, 162, 235, 0.7)',
        secondary: 'rgba(255, 99, 132, 0.7)',
        success: 'rgba(75, 192, 192, 0.7)',
        warning: 'rgba(255, 206, 86, 0.7)',
        info: 'rgba(153, 102, 255, 0.7)',
        gradient: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384'
        ]
    }
};