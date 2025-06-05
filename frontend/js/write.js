// DOM Elements
const previewChart = document.getElementById('previewChart');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const cgmSelect = document.getElementById('cgm-select');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');

// Initialize time steps array (0 to 60 minutes, step 5)
const timeSteps = Array.from({ length: 13 }, (_, i) => i * 5);

// Initialize glucose preview data array (13x2)
let glucosePreviewData = timeSteps.map(t => [t, 15]); // Default to 15 mM

// Initialize Chart.js
let chart;

// Calculate volumetric flow rate
function calculateFlowRate(rpm) {
    return 0.0592 * rpm - 0.1269;
}

// Calculate combined glucose concentration
function calculateCombinedGlucose(pump1Rpm, pump1Glucose, pump2Rpm, pump2Glucose) {
    const flowRate1 = calculateFlowRate(pump1Rpm);
    const flowRate2 = calculateFlowRate(pump2Rpm);
    const totalFlowRate = flowRate1 + flowRate2;

    if (totalFlowRate <= 0) {
        return 0;
    }

    const combinedGlucose = (
        (pump1Glucose * flowRate1 + pump2Glucose * flowRate2) / totalFlowRate
    );

    return Number(combinedGlucose.toFixed(2));
}

function initializeChart() {
    const ctx = previewChart.getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeSteps,
            datasets: [{
                label: 'Input Glucose Concentration',
                data: glucosePreviewData.map(point => point[1]),
                borderColor: '#2c3e50',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
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
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Input Glucose Concentration (mM)'
                    },
                    min: 10,
                    max: 20,
                    ticks: {
                        stepSize: 2
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time (min)'
                    },
                    ticks: {
                        callback: function(value) {
                            return timeSteps[value];
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Glucose: ${context.raw} mM`;
                        }
                    }
                }
            }
        }
    });
}

// Update chart with new data
function updateChart(newData) {
    glucosePreviewData = newData;
    chart.data.datasets[0].data = newData.map(point => point[1]);
    chart.update();
}

// Handle manual pump control
function setupManualControl() {
    const updatePumpsBtn = document.getElementById('update-pumps');
    
    if (updatePumpsBtn) {
        updatePumpsBtn.addEventListener('click', () => {
            const pump1Rpm = parseFloat(document.getElementById('pump1-rpm').value) || 0;
            const pump1Direction = document.getElementById('pump1-direction').value;
            const pump1Glucose = parseFloat(document.getElementById('pump1-glucose').value) || 15;
            const pump2Rpm = parseFloat(document.getElementById('pump2-rpm').value) || 0;
            const pump2Direction = document.getElementById('pump2-direction').value;
            const pump2Glucose = parseFloat(document.getElementById('pump2-glucose').value) || 15;

            // Calculate flow rates and combined glucose
            const flowRate1 = calculateFlowRate(pump1Rpm);
            const flowRate2 = calculateFlowRate(pump2Rpm);
            const combinedGlucose = calculateCombinedGlucose(pump1Rpm, pump1Glucose, pump2Rpm, pump2Glucose);

            // Create constant concentration profile
            const newData = timeSteps.map(t => [t, combinedGlucose]);
            updateChart(newData);
        });
    }
}

// Handle simulation patterns
function setupSimulator() {
    const applySimulationBtn = document.getElementById('apply-simulation');
    
    if (applySimulationBtn) {
        applySimulationBtn.addEventListener('click', () => {
            const baseGlucose = parseFloat(document.getElementById('base-glucose').value);
            const variationType = document.getElementById('variation-type').value;
            const amplitude = parseFloat(document.getElementById('variation-amplitude').value);
            const interval = parseInt(document.getElementById('reading-interval').value);

            // Generate simulated data
            const newData = timeSteps.map(t => {
                let value = baseGlucose;

                switch (variationType) {
                    case 'square':
                        // Toggle every 10 minutes between base ± amplitude
                        const period = Math.floor(t / 10);
                        value += period % 2 === 0 ? -amplitude : amplitude;
                        break;
                    case 'sine':
                        value += amplitude * Math.sin((t / 60) * Math.PI * 2);
                        break;
                    case 'random':
                        value += (Math.random() * 2 - 1) * amplitude;
                        break;
                    case 'meal':
                        // Simulate meal response with peak at 30 minutes
                        const normalizedTime = (t - 30) / 15;
                        value += amplitude * Math.exp(-normalizedTime * normalizedTime);
                        break;
                }

                // Ensure value stays within bounds
                value = Math.max(10, Math.min(20, value));
                return [t, Number(value.toFixed(2))];
            });

            updateChart(newData);
        });
    }
}

// CSV Upload Handler
let csvData = null; // Store CSV data globally

function setupCSVUpload() {
    const csvFileInput = document.getElementById('csv-file');
    const csvDataTable = document.getElementById('csv-data-table').getElementsByTagName('tbody')[0];
    const applyCsvDataBtn = document.getElementById('apply-csv-data');

    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    // Parse CSV content
                    const rows = e.target.result.trim().split('\n');
                    if (rows.length !== 13) {
                        throw new Error('CSV must contain exactly 13 rows');
                    }

                    // Parse and validate data
                    csvData = rows.map(row => {
                        const [time, concentration] = row.split(',').map(Number);
                        if (isNaN(time) || isNaN(concentration)) {
                            throw new Error('Invalid data format');
                        }
                        if (concentration < 10 || concentration > 20) {
                            throw new Error('Concentration must be between 10 and 20 mM');
                        }
                        return [time, concentration];
                    });

                    // Update table
                    csvDataTable.innerHTML = '';
                    csvData.forEach(([time, concentration]) => {
                        const row = csvDataTable.insertRow();
                        row.insertCell(0).textContent = time;
                        row.insertCell(1).textContent = concentration;
                    });

                    // Enable apply button
                    applyCsvDataBtn.disabled = false;

                } catch (error) {
                    alert(`Error processing CSV: ${error.message}`);
                    csvData = null;
                    csvDataTable.innerHTML = '';
                    applyCsvDataBtn.disabled = true;
                }
            };
            reader.readAsText(file);
        }
    });

    // Handle apply button click
    applyCsvDataBtn.addEventListener('click', () => {
        if (csvData) {
            const newData = csvData;
            updateChart(newData);
        }
    });
}

// Tab switching functionality
function switchTab(tabId) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));

    const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedPane = document.getElementById(`${tabId}-tab`);
    
    if (selectedTab && selectedPane) {
        selectedTab.classList.add('active');
        selectedPane.classList.add('active');
    }
}

// Backend communication configuration
const BACKEND_URL = 'http://localhost:8000'; // Change this to your machine's IP address

// Function to send data to backend
async function sendDataToBackend(data) {
    try {
        const response = await fetch(`${BACKEND_URL}/send-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: data })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending data to backend:', error);
        throw error;
    }
}

// Function to update status message
function updateStatus(message, isError = false) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.className = isError ? 'error' : 'success';
}

// Initialize the application
function init() {
    initializeChart();
    
    // Set up tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Set up input methods
    setupManualControl();
    setupSimulator();
    setupCSVUpload();

    // Set up start process button
    const startProcessBtn = document.getElementById('start-process');
    startProcessBtn.addEventListener('click', async () => {
        try {
            if (!glucosePreviewData || glucosePreviewData.length !== 13) {
                throw new Error('Please configure a valid glucose concentration profile first');
            }

            startProcessBtn.disabled = true;
            updateStatus('Sending data to machine...');

            await sendDataToBackend(glucosePreviewData);
            updateStatus('Process started successfully!');
        } catch (error) {
            updateStatus(`Error: ${error.message}`, true);
        } finally {
            startProcessBtn.disabled = false;
        }
    });
}

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);