let revenueChart = null;
let categoryChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    loadDashboardData();
    
    // Add time range change handler
    document.getElementById('timeRange').addEventListener('change', loadDashboardData);
});

async function loadDashboardData() {
    const timeRange = document.getElementById('timeRange').value;
    try {
        const response = await fetch(`/api/dashboard-stats?days=${timeRange}`);
        const data = await response.json();
        
        updateStats(data.stats);
        updateCharts(data.charts);
        updateTables(data.tables);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateStats(stats) {
    document.getElementById('totalRevenue').textContent = `Rs. ${stats.totalRevenue.toLocaleString()}`;
    updateTrendIndicator('revenueTrend', stats.trends.revenue);
    document.getElementById('totalOrders').textContent = stats.totalOrders.toLocaleString();
    updateTrendIndicator('ordersTrend', stats.trends.orders);
    document.getElementById('activeComponents').textContent = stats.activeComponents.toLocaleString();
    document.getElementById('vendorCount').textContent = stats.vendorCount;
    document.getElementById('avgOrderValue').textContent = `Rs. ${stats.avgOrderValue.toLocaleString()}`;
    updateTrendIndicator('avgValueTrend', stats.trends.avgValue);
}

function updateTrendIndicator(elementId, trend) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = trend > 0;
    const trendClass = isPositive ? 'trend-up' : 'trend-down';
    const icon = isPositive ? 'arrow-up' : 'arrow-down';

    element.className = `trend-indicator ${trendClass}`;
    element.innerHTML = `
        <i class="bi bi-${icon}"></i> ${Math.abs(trend).toFixed(1)}% vs last period
    `;
}

function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Rs. ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rs. ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    // Category Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#0d6efd', '#198754', '#ffc107', '#dc3545',
                    '#6610f2', '#0dcaf0', '#fd7e14', '#20c997'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateCharts(chartData) {
    // Update Revenue Chart
    revenueChart.data.labels = chartData.revenue.labels;
    revenueChart.data.datasets[0].data = chartData.revenue.data;
    revenueChart.update();

    // Update Category Chart
    categoryChart.data.labels = chartData.categories.labels;
    categoryChart.data.datasets[0].data = chartData.categories.data;
    categoryChart.update();
}

function updateTables(tableData) {
    // Update Price Updates Table
    const priceUpdatesBody = document.getElementById('priceUpdatesTable').querySelector('tbody');
    priceUpdatesBody.innerHTML = tableData.priceUpdates.map(update => `
        <tr>
            <td>${update.component}</td>
            <td>${update.vendor}</td>
            <td>Rs. ${update.price.toLocaleString()}</td>
            <td>${new Date(update.updated).toLocaleDateString()}</td>
        </tr>
    `).join('');

    // Update Top Components Table
    const topComponentsBody = document.getElementById('topComponentsTable').querySelector('tbody');
    topComponentsBody.innerHTML = tableData.topComponents.map(component => `
        <tr>
            <td>${component.name}</td>
            <td>${component.category}</td>
            <td>${component.unitsSold.toLocaleString()}</td>
            <td>Rs. ${component.revenue.toLocaleString()}</td>
        </tr>
    `).join('');
}

function refreshStats() {
    loadDashboardData();
} 