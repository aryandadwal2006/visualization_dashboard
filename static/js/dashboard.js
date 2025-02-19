// Initialize global namespaces
window.DashboardFunctions = {};

// Suppress message port errors
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason?.message?.includes('message port closed')) {
        event.preventDefault();
    }
});

// State Management
let currentData = null;
let charts = {};

// Dashboard Initialization
async function initialize() {
    try {
        showGlobalLoading();
        await Promise.all([
            loadFilterOptions(),
            loadInitialData(),
            window.AnalyticsFunctions.loadInsights(),
            window.AnalyticsFunctions.setupPrediction()
        ]);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('Failed to initialize dashboard');
    } finally {
        hideGlobalLoading();
    }
}

// Data Loading Functions
async function loadFilterOptions() {
    try {
        const response = await fetch('/api/data/filters');
        if (!response.ok) throw new Error('Failed to fetch filter options');
        
        const data = await response.json();
        const filterMappings = {
            end_years: 'endYearFilter',
            topics: 'topicFilter',
            sectors: 'sectorFilter',
            regions: 'regionFilter',
            pestles: 'pestleFilter'
        };

        Object.entries(filterMappings).forEach(([key, elementId]) => {
            populateSelect(elementId, data[key] || []);
        });
    } catch (error) {
        console.error('Filter loading error:', error);
        showError('Failed to load filters');
    }
}

async function loadInitialData() {
    try {
        showChartLoading();
        const response = await fetch('/api/data/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data = await response.json();
        currentData = data;
        await createCharts(data);
    } catch (error) {
        console.error('Data loading error:', error);
        showError('Failed to load dashboard data');
    } finally {
        hideChartLoading();
    }
}

// Chart Creation Functions
async function createCharts(data) {
    if (!data || data.length === 0) {
        showError('No data available for visualization');
        return;
    }

    try {
        console.log('Creating charts with data:', data);
        
        // Create all charts
        const chartPromises = [
            window.ChartFunctions.createIntensityChart(data),
            window.ChartFunctions.createLikelihoodChart(data),
            window.ChartFunctions.createTopicsChart(data),
            window.ChartFunctions.createRegionalDistribution(data),
            window.ChartFunctions.createPestleAnalysis(data),
            window.ChartFunctions.createTimeAnalysis(data),
            window.AnalyticsFunctions.createCorrelationChart(data),
            window.AnalyticsFunctions.createSectorImpactChart(data)
        ];

        await Promise.all(chartPromises);
        updateSummaryStats(data);
    } catch (error) {
        console.error('Chart creation error:', error);
        showError('Failed to create charts');
    }
}

// Event Listeners
function setupEventListeners() {
    // Filter Application
    document.getElementById('applyFilters')?.addEventListener('click', handleFilterApplication);

    // Export Buttons
    document.getElementById('exportCSV')?.addEventListener('click', handleCSVExport);
    document.getElementById('exportPDF')?.addEventListener('click', handlePDFExport);
    document.getElementById('exportCharts')?.addEventListener('click', handleChartsExport);

    // Window Resize
    window.addEventListener('resize', debounce(handleResize, 250));
}

// Event Handlers
async function handleFilterApplication() {
    try {
        showChartLoading();
        const filters = getFilterValues();
        const queryString = new URLSearchParams(filters).toString();
        
        const response = await fetch(`/api/data/dashboard?${queryString}`);
        if (!response.ok) throw new Error('Failed to fetch filtered data');
        
        const data = await response.json();
        currentData = data;
        await createCharts(data);
    } catch (error) {
        console.error('Filter application error:', error);
        showError('Failed to apply filters');
    } finally {
        hideChartLoading();
    }
}

async function handleCSVExport() {
    if (!currentData) {
        showError('No data available to export');
        return;
    }
    try {
        showGlobalLoading('Generating CSV...');
        const csv = convertToCSV(currentData);
        downloadFile(csv, 'dashboard_data.csv', 'text/csv');
    } catch (error) {
        console.error('CSV export error:', error);
        showError('Failed to export CSV');
    } finally {
        hideGlobalLoading();
    }
}

async function handlePDFExport() {
    try {
        showGlobalLoading('Generating PDF...');
        const element = document.querySelector('.container-fluid');
        const opt = {
            margin: 1,
            filename: 'dashboard_report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('PDF export error:', error);
        showError('Failed to export PDF');
    } finally {
        hideGlobalLoading();
    }
}

async function handleChartsExport() {
    try {
        showGlobalLoading('Preparing charts...');
        const zip = new JSZip();
        const chartElements = document.getElementsByClassName('chart-container');
        
        for (let i = 0; i < chartElements.length; i++) {
            if (chartElements[i].id) {
                const chartImage = await Plotly.toImage(chartElements[i].id, {
                    format: 'png',
                    width: 1200,
                    height: 800
                });
                zip.file(`chart_${i+1}.png`, chartImage.split(',')[1], {base64: true});
            }
        }
        
        const content = await zip.generateAsync({type: "blob"});
        saveAs(content, "dashboard_charts.zip");
    } catch (error) {
        console.error('Charts export error:', error);
        showError('Failed to export charts');
    } finally {
        hideGlobalLoading();
    }
}

function handleResize() {
    if (currentData) {
        createCharts(currentData);
    }
}

// Utility Functions
function getFilterValues() {
    const filters = {};
    ['endYear', 'topic', 'sector', 'region', 'pestle'].forEach(key => {
        const value = document.getElementById(`${key}Filter`)?.value;
        if (value) filters[key] = value;
    });
    return filters;
}

function populateSelect(elementId, options) {
    const select = document.getElementById(elementId);
    if (!select) return;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Select ${elementId.replace('Filter', '')}`;
    
    select.innerHTML = '';
    select.appendChild(defaultOption);

    options
        .filter(Boolean)
        .sort()
        .forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });
}

function updateSummaryStats(data) {
    try {
        const stats = {
            totalRecords: data.length,
            avgIntensity: calculateAverage(data, 'intensity'),
            avgLikelihood: calculateAverage(data, 'likelihood'),
            uniqueSectors: new Set(data.map(item => item.sector).filter(Boolean)).size
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = formatNumber(value);
                element.classList.add('value-updated');
                setTimeout(() => element.classList.remove('value-updated'), 1000);
            }
        });
    } catch (error) {
        console.error('Error updating summary stats:', error);
    }
}

function calculateAverage(data, field) {
    const values = data
        .map(item => Number(item[field]))
        .filter(val => !isNaN(val));
    return values.length ? 
        (values.reduce((a, b) => a + b) / values.length).toFixed(1) : 
        '0.0';
}

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            return `"${value}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

function downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Loading States
function showGlobalLoading(message = 'Loading...') {
    const loader = document.querySelector('.global-loading-overlay');
    if (loader) {
        const messageElement = loader.querySelector('.loading-message');
        if (messageElement) messageElement.textContent = message;
        loader.classList.remove('d-none');
    }
}

function hideGlobalLoading() {
    const loader = document.querySelector('.global-loading-overlay');
    if (loader) loader.classList.add('d-none');
}

function showChartLoading() {
    document.querySelectorAll('.chart-container').forEach(container => {
        container.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <div>Loading chart...</div>
            </div>
        `;
    });
}

function hideChartLoading() {
    document.querySelectorAll('.loading-overlay').forEach(overlay => {
        overlay.remove();
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container-fluid').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initialize();
    setupEventListeners();
});

// Export functions for use in other modules
Object.assign(window.DashboardFunctions, {
    initialize,
    createCharts,
    showError,
    showGlobalLoading,
    hideGlobalLoading
});

// Add these functions to dashboard.js
function exportToExcel() {
    const data = currentData;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard Data");
    XLSX.writeFile(wb, "dashboard_data.xlsx");
}

function exportToPDF() {
    const element = document.querySelector('.container-fluid');
    html2pdf()
        .set({
            margin: 1,
            filename: 'dashboard_report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        })
        .from(element)
        .save();
}