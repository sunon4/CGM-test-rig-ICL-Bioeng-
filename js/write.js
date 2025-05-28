// DOM Elements
const previewChart = document.getElementById('previewChart');
const methodTabs = document.querySelectorAll('.method-tab');
const cgmSelect = document.getElementById('cgm-select');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');

// Sample data for the preview chart
let previewData = {
    labels: Array.from({length: 24}, (_, i) => i + ':00'), // 24-hour format
    values: []
};

// Writing process state
let isWriting = false;
let writingInterval = null;

// Initialize with some sample data
function initializePreviewData() {
    // Generate sample glucose profile
    previewData.values = [];
    
    // Morning rise, meal spikes, and evening decline pattern
    for (let i = 0; i < 24; i++) {
        let value;
        if (i < 6) {
            // Night values (stable, slightly lower)
            value = 90 + Math.random() * 10;
        } else if (i < 8) {
            // Dawn phenomenon (morning rise)
            value = 100 + (i - 5) * 15 + Math.random() * 10;
        } else if (i === 8) {
            // Breakfast spike
            value = 160 + Math.random() * 20;
        } else if (i < 12) {
            // Post-breakfast decline
            value = 160 - (i - 8) * 15 + Math.random() * 10;
        } else if (i === 12) {
            // Lunch spike
            value = 150 + Math.random() * 20;
        } else if (i < 18) {
            // Afternoon gradual decline
            value = 150 - (i - 12) * 8 + Math.random() * 15;
        } else if (i === 18) {
            // Dinner spike
            value = 140 + Math.random() * 20;
        } else {
            // Evening decline
            value = 140 - (i - 18) * 10 + Math.random() * 10;
        }
        
        previewData.values.push(Math.round(value));
    }
}

// Create the preview chart
let chart;
function createPreviewChart() {
    const ctx = previewChart.getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: previewData.labels,
            datasets: [{
                label: 'Glucose Concentration (mg/dl)',
                data: previewData.values,
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(46, 204, 113, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(46, 204, 113, 1)',
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
                        text: 'Time (hours)'
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

// Handle tab switching
function setupTabs() {
    methodTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            methodTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // In a real application, you would update the form controls and preview based on the selected method
            console.log('Method changed to:', this.id);
        });
    });
}

// Simulate writing process
function startWritingProcess() {
    if (isWriting) return;
    
    isWriting = true;
    
    // Update button states
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // Display status message
    const statusMessage = document.createElement('div');
    statusMessage.id = 'status-message';
    statusMessage.className = 'status-message';
    statusMessage.innerHTML = `<p>Writing to ${cgmSelect.value}...</p>`;
    document.querySelector('.preview-container').appendChild(statusMessage);
    
    // Simulate data writing by updating one data point at a time
    let currentIndex = 0;
    
    writingInterval = setInterval(() => {
        if (currentIndex >= previewData.values.length) {
            stopWritingProcess();
            return;
        }
        
        // Simulate writing by slightly changing the color of points
        const dataset = chart.data.datasets[0];
        const originalColor = 'rgba(46, 204, 113, 1)';
        const writtenColor = 'rgba(155, 89, 182, 1)';
        
        // Update point color to show it's been written
        if (!dataset.pointBackgroundColors) {
            dataset.pointBackgroundColors = Array(dataset.data.length).fill(originalColor);
            
            // Add the property to the dataset configuration
            dataset.pointBackgroundColor = function(context) {
                return this.pointBackgroundColors[context.dataIndex];
            };
        }
        
        dataset.pointBackgroundColors[currentIndex] = writtenColor;
        
        // Update status message
        document.getElementById('status-message').innerHTML = 
            `<p>Writing to ${cgmSelect.value}... (${currentIndex + 1}/${previewData.values.length} points)</p>`;
        
        chart.update();
        currentIndex++;
    }, 500); // Update every half second
}

// Stop the writing process
function stopWritingProcess() {
    if (!isWriting) return;
    
    isWriting = false;
    
    // Clear the interval
    if (writingInterval) {
        clearInterval(writingInterval);
        writingInterval = null;
    }
    
    // Update button states
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    // Update status message
    const statusMessage = document.getElementById('status-message');
    if (statusMessage) {
        statusMessage.innerHTML = '<p>Writing process completed or stopped.</p>';
        
        // Remove the message after a delay
        setTimeout(() => {
            statusMessage.remove();
        }, 3000);
    }
}

// Setup event listeners for buttons
function setupButtons() {
    startBtn.addEventListener('click', startWritingProcess);
    stopBtn.addEventListener('click', stopWritingProcess);
    
    // Also listen for CGM device changes
    cgmSelect.addEventListener('change', function() {
        console.log('CGM device changed to:', this.value);
    });
}

// Initialize the application
function init() {
    initializePreviewData();
    createPreviewChart();
    setupTabs();
    setupButtons();
}

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);