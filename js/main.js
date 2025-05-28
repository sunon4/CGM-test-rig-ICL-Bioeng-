// DOM Elements
const glucoseChart = document.getElementById('glucoseChart');
const timeSelect = document.getElementById('time-select');
const cgmSelect = document.getElementById('cgm-select');

// Sample data - in a real application, this would be fetched from a backend
let glucoseData = {
    labels: [], // Time labels (in minutes)
    values: []  // Glucose values (in mg/dl)
};

// Initialize with some sample data
function initializeData() {
    // Clear existing data
    glucoseData.labels = [];
    glucoseData.values = [];
    
    // Generate sample data for the last 60 minutes
    const now = new Date();
    for (let i = 60; i >= 0; i--) {
        // Calculate time i minutes ago
        const time = new Date(now - i * 60000);
        
        // Format time as HH:MM
        const timeString = time.getHours().toString().padStart(2, '0') + ':' + 
                         time.getMinutes().toString().padStart(2, '0');
        
        // Generate a realistic glucose value (between 70-180 mg/dl with some variation)
        const baseValue = 120;
        const variance = Math.sin(i / 10) * 30 + Math.random() * 20 - 10;
        const glucoseValue = Math.round(baseValue + variance);
        
        glucoseData.labels.push(timeString);
        glucoseData.values.push(glucoseValue);
    }
}

// Create the chart
let chart;
function createChart() {
    const ctx = glucoseChart.getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: glucoseData.labels,
            datasets: [{
                label: 'Glucose Concentration (mg/dl)',
                data: glucoseData.values,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(52, 152, 219, 1)',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (minutes)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Glucose Concentration (mg/dl)'
                    },
                    min: 40,
                    max: 240,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Glucose: ${context.raw} mg/dl`;
                        }
                    }
                }
            }
        }
    });
}

// Update the chart with new data
function updateChart() {
    // In a real application, you would fetch new data from an API
    // For demonstration, we'll just add a new data point
    
    // Remove the first data point
    glucoseData.labels.shift();
    glucoseData.values.shift();
    
    // Add a new data point
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    
    // Generate a new glucose value based on the last value with some random variation
    const lastValue = glucoseData.values[glucoseData.values.length - 1];
    const newValue = Math.max(40, Math.min(240, lastValue + (Math.random() * 10 - 5)));
    
    glucoseData.labels.push(timeString);
    glucoseData.values.push(Math.round(newValue));
    
    // Update the chart
    chart.update();
}

// Initialize the application
function init() {
    initializeData();
    createChart();
    
    // Set up event listeners for the select boxes
    timeSelect.addEventListener('change', function() {
        // In a real application, you would fetch data for the selected time period
        console.log('Time period changed:', this.value);
    });
    
    cgmSelect.addEventListener('change', function() {
        // In a real application, you would fetch data for the selected CGM device
        console.log('CGM device changed:', this.value);
    });
    
    // Update chart every 30 seconds
    setInterval(updateChart, 30000);
}

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
