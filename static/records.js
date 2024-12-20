// Global variables
let allRecords = [];
let currentRecord = null;
const modal = document.getElementById('previewModal');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
let selectedRecords = new Set();

// Terms and conditions
const terms = {
    quotation: `
        Terms and Conditions:
        1. This quotation is valid for 7 days from the date of issue
        2. Prices are subject to change based on market fluctuations
        3. 50% advance payment required to confirm the order
        4. Delivery timeline: 7-10 working days after confirmation
        5. Installation charges may apply separately
        6. Warranty as per manufacturer's policy
        7. GST will be charged as per government regulations
        8. Free technical consultation and site survey included
        9. Prices include standard mounting structure and basic wiring
        10. Custom requirements may incur additional charges
    `,
    invoice: `
        Terms and Conditions:
        1. Payment is due within 30 days of invoice date
        2. Warranty claims must be accompanied by this invoice
        3. Installation warranty: 1 year
        4. Product warranty as per manufacturer's policy
        5. After-sales support available 24/7
        6. Returns accepted within 7 days for unopened items
        7. Testing and commissioning included
        8. Regular maintenance recommended
        9. Keep this invoice for warranty claims
        10. Technical support: +92-XXX-XXXXXXX
    `
};

// Load records when the page loads
document.addEventListener('DOMContentLoaded', loadRecords);

// Event listeners
searchInput.addEventListener('input', filterRecords);
typeFilter.addEventListener('change', filterRecords);

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Close modal function
function closeModal() {
    modal.style.display = 'none';
}

// Load all records from the server
async function loadRecords() {
    try {
        const response = await fetch('/api/invoices');
        allRecords = await response.json();
        displayRecords(allRecords);
    } catch (error) {
        console.error('Error loading records:', error);
        alert('Error loading records. Please try again.');
    }
}

// Display records in the table
function displayRecords(records) {
    const tbody = document.getElementById('recordsBody');
    tbody.innerHTML = '';
    
    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="checkbox" 
                       class="form-check-input record-checkbox" 
                       data-record-id="${record.number}"
                       ${selectedRecords.has(record.number) ? 'checked' : ''}>
            </td>
            <td>${record.number}</td>
            <td>${record.type}</td>
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>${record.customer_name}</td>
            <td>Rs. ${record.total.toLocaleString()}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button onclick="viewRecord('${record.number}')" class="btn btn-primary">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button onclick="editRecord('${record.number}')" class="btn btn-success">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button onclick="deleteRecord('${record.number}')" class="btn btn-danger">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        if (selectedRecords.has(record.number)) {
            tr.classList.add('selected');
        }
        
        tbody.appendChild(tr);
    });
    updateSelectedCount();
}

// Filter records based on search input and type filter
function filterRecords() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterType = typeFilter.value;

    const filteredRecords = allRecords.filter(record => {
        const matchesSearch = 
            record.customer_name.toLowerCase().includes(searchTerm) ||
            record.number.toLowerCase().includes(searchTerm);
        
        const matchesType = filterType === 'all' || record.type === filterType;

        return matchesSearch && matchesType;
    });

    displayRecords(filteredRecords);
}

// View record details
function viewRecord(number) {
    currentRecord = allRecords.find(r => r.number === number);
    if (!currentRecord) return;

    // Update document type
    document.getElementById('documentType').textContent = 
        currentRecord.type.toUpperCase();

    // Update company and customer info
    document.getElementById('previewCompanyName').textContent = 
        'Solar System Solutions';  // Or your company name
    document.getElementById('previewCustomerName').textContent = 
        currentRecord.customer_name;
    document.getElementById('previewInvoiceNumber').textContent = 
        currentRecord.number;
    document.getElementById('previewInvoiceDate').textContent = 
        new Date(currentRecord.date).toLocaleDateString();

    // Calculate and set validity date for quotations
    const validityDate = new Date(currentRecord.date);
    validityDate.setDate(validityDate.getDate() + 7);
    document.getElementById('validityDate').textContent = 
        validityDate.toLocaleDateString();

    // Update items table
    const items = JSON.parse(currentRecord.items);
    const previewBody = document.getElementById('previewBody');
    previewBody.innerHTML = items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-end">Rs. ${item.price.toLocaleString()}</td>
            <td class="text-end">Rs. ${item.total.toLocaleString()}</td>
        </tr>
    `).join('');

    // Update total amount
    document.getElementById('totalAmount').textContent = 
        `Rs. ${currentRecord.total.toLocaleString()}`;

    // Set terms and conditions based on document type
    document.getElementById('termsContent').innerHTML = 
        terms[currentRecord.type] || '';

    // Show modal
    modal.style.display = 'block';
}

// Print record
function printRecord() {
    // Create a temporary container for printing
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    printContainer.style.display = 'none';
    document.body.appendChild(printContainer);

    // Clone the invoice preview content
    const content = document.getElementById('documentPreview').cloneNode(true);
    printContainer.appendChild(content);

    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            body * {
                visibility: hidden;
            }
            #print-container {
                visibility: visible;
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm;
                height: 297mm;
                padding: 20mm;
                margin: 0;
                background: white;
            }
            #print-container * {
                visibility: visible;
            }
        }
    `;
    printContainer.appendChild(style);

    // Print
    window.print();

    // Cleanup
    document.body.removeChild(printContainer);
}

// Edit record
function editRecord(number) {
    window.location.href = `/edit/${number}`;
}

// Delete record
async function deleteRecord(number) {
    if (!confirm(`Are you sure you want to delete ${number}?`)) return;

    try {
        const response = await fetch(`/api/invoices/${number}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            allRecords = allRecords.filter(r => r.number !== number);
            displayRecords(allRecords);
            modal.style.display = 'none';
            alert('Record deleted successfully');
        } else {
            alert('Error deleting record');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting record');
    }
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString();
}

function formatNumber(num) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Add these new functions
function selectAllRecords() {
    const checkboxes = document.querySelectorAll('.record-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        selectedRecords.add(checkbox.dataset.recordId);
        checkbox.closest('tr').classList.add('selected');
    });
    updateSelectedCount();
}

function deselectAllRecords() {
    const checkboxes = document.querySelectorAll('.record-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        selectedRecords.delete(checkbox.dataset.recordId);
        checkbox.closest('tr').classList.remove('selected');
    });
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = selectedRecords.size;
    document.getElementById('selectedCount').textContent = count;
    document.getElementById('bulkDeleteBtn').disabled = count === 0;
}

async function deleteSelectedRecords() {
    if (selectedRecords.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedRecords.size} selected records?`)) {
        return;
    }
    
    try {
        const deletePromises = Array.from(selectedRecords).map(recordId =>
            fetch(`/api/invoices/${recordId}`, { method: 'DELETE' })
            .then(response => response.json())
        );
        
        await Promise.all(deletePromises);
        selectedRecords.clear();
        loadRecords(); // Refresh the table
        alert('Selected records deleted successfully');
    } catch (error) {
        console.error('Error deleting records:', error);
        alert('Error deleting some records. Please try again.');
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... your existing event listeners ...

    // Add checkbox event delegation
    document.getElementById('recordsBody').addEventListener('change', (e) => {
        if (e.target.classList.contains('record-checkbox')) {
            const recordId = e.target.dataset.recordId;
            const tr = e.target.closest('tr');
            
            if (e.target.checked) {
                selectedRecords.add(recordId);
                tr.classList.add('selected');
            } else {
                selectedRecords.delete(recordId);
                tr.classList.remove('selected');
            }
            
            updateSelectedCount();
        }
    });

    // Add select all checkbox handler
    document.getElementById('selectAll').addEventListener('change', (e) => {
        if (e.target.checked) {
            selectAllRecords();
        } else {
            deselectAllRecords();
        }
    });
}); 