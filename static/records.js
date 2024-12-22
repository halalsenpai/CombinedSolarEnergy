let allRecords = [];
let filteredRecords = [];

// Toast notification system
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center border-0 ${type === 'error' ? 'bg-danger' : 'bg-success'} text-white`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toastEl);

    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    toast.show();

    // Remove toast element after it's hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadRecords();
    
    // Add event listeners for filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFilter').addEventListener('input', applyFilters);
});

async function loadRecords() {
    try {
        const response = await fetch('/api/invoices');
        if (!response.ok) throw new Error('Failed to load records');
        
        allRecords = await response.json();
        filteredRecords = [...allRecords];
        displayRecords(filteredRecords);
        
    } catch (error) {
        console.error('Error loading records:', error);
        showToast('Error loading records', 'error');
    }
}

function displayRecords(records) {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = records.map(record => `
        <tr>
            <td>${record.number}</td>
            <td>${record.type.charAt(0).toUpperCase() + record.type.slice(1)}</td>
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>${record.customer_name}</td>
            <td>
                ${record.customer_phone ? `
                    <div class="d-flex align-items-center gap-2">
                        ${record.customer_phone}
                        <button class="btn btn-sm btn-success" onclick="sendWhatsApp('${record.number}', '${record.customer_phone}')">
                            <i class="bi bi-whatsapp"></i>
                        </button>
                    </div>
                ` : '-'}
            </td>
            <td>Rs. ${record.total.toLocaleString()}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewRecord('${record.number}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="editRecord('${record.number}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteRecord('${record.number}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    filteredRecords = allRecords.filter(record => {
        const matchesSearch = !searchTerm || 
            record.number.toLowerCase().includes(searchTerm) ||
            record.customer_name.toLowerCase().includes(searchTerm);
            
        const matchesType = !typeFilter || record.type === typeFilter;
        
        const matchesDate = !dateFilter || record.date === dateFilter;
        
        return matchesSearch && matchesType && matchesDate;
    });
    
    displayRecords(filteredRecords);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('dateFilter').value = '';
    
    filteredRecords = [...allRecords];
    displayRecords(filteredRecords);
}

function viewRecord(number) {
    const record = allRecords.find(r => r.number === number);
    if (!record) return;
    
    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    const content = document.getElementById('previewContent');
    
    content.innerHTML = generatePreviewHTML(record);
    modal.show();
}

function editRecord(number) {
    // Redirect to edit page with the document number
    window.location.href = `/edit/${number}`;
}

async function deleteRecord(number) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
        const response = await fetch(`/api/invoices/${number}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete record');
        
        showToast('Record deleted successfully');
        loadRecords();
        
    } catch (error) {
        console.error('Error deleting record:', error);
        showToast('Error deleting record', 'error');
    }
}

function generatePreviewHTML(record) {
    const isQuotation = record.type === 'quotation';
    return `
        <div class="invoice-preview bg-white shadow-lg rounded-3 p-4 p-lg-5">
            <!-- Header Section -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="company-info">
                        <h2 class="company-name text-primary fw-bold mb-3">${record.company_name}</h2>
                        <div class="company-details text-muted">
                            <p class="mb-1">Solar Solutions Provider</p>
                            <address class="mb-0">
                                <i class="bi bi-envelope me-2"></i>info@company.com<br>
                                <i class="bi bi-telephone me-2"></i>+92-XXX-XXXXXXX<br>
                                <i class="bi bi-geo-alt me-2"></i>Your Business Address, Karachi, Pakistan
                            </address>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 text-md-end">
                    <div class="invoice-details">
                        <h2 class="text-primary fw-bold mb-3">${isQuotation ? 'QUOTATION' : 'INVOICE'}</h2>
                        <div class="text-muted">
                            <p class="mb-1">Document #: <strong class="text-dark">${record.number}</strong></p>
                            <p class="mb-1">Date: <strong class="text-dark">${new Date(record.date).toLocaleDateString()}</strong></p>
                            <p class="mb-0">Valid Until: <strong class="text-dark">${new Date(new Date(record.date).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong></p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Customer Info -->
            <div class="customer-section bg-light rounded-3 p-4 mb-4">
                <h5 class="fw-bold mb-3">Customer Details</h5>
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-0">
                            <span class="text-muted">Name:</span>
                            <strong class="ms-2">${record.customer_name}</strong>
                        </p>
                        <p class="mb-0 mt-2" ${!record.customer_phone ? 'style="display: none;"' : ''}>
                            <span class="text-muted">Phone:</span>
                            <strong class="ms-2">${record.customer_phone || ''}</strong>
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Items Table -->
            <div class="table-responsive mb-4">
                <table class="table table-striped table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Component</th>
                            <th>Description</th>
                            <th class="text-center">Quantity</th>
                            <th class="text-end">Price</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${JSON.parse(record.items).map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.description || '-'}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-end">Rs. ${item.price.toLocaleString()}</td>
                                <td class="text-end">Rs. ${(item.quantity * item.price).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot class="table-light">
                        <tr class="total-row bg-primary text-white">
                            <th colspan="4" class="text-end">Total Amount:</th>
                            <th class="text-end">Rs. ${record.total.toLocaleString()}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <!-- Terms -->
            <div class="terms-section bg-light rounded-3 p-4 mb-4">
                <h5 class="mb-3">Terms & Conditions</h5>
                <ul class="text-muted mb-0">
                    <li>Prices are valid for 15 days from the date of quotation</li>
                    <li>50% advance payment required with order confirmation</li>
                    <li>Balance payment before delivery</li>
                    <li>Delivery within 7-10 working days after order confirmation</li>
                    <li>Installation charges as per site requirements</li>
                    <li>Warranty as per manufacturer terms and conditions</li>
                    <li>GST/Tax as applicable</li>
                </ul>
            </div>
            
            <!-- Footer Section -->
            <div class="footer-section">
                <!-- Signatures -->
                <div class="row mb-4">
                    <div class="col-6">
                        <div class="signature-box text-center">
                            <div class="signature-line border-top border-dark w-75 mx-auto mb-2"></div>
                            <div class="signature-label text-muted">Authorized Signature</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="signature-box text-center">
                            <div class="signature-line border-top border-dark w-75 mx-auto mb-2"></div>
                            <div class="signature-label text-muted">Customer Signature</div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer Note -->
                <div class="footer-note text-center text-muted fst-italic">
                    Thank you for choosing our solar solutions!
                </div>
            </div>
        </div>
    `;
}

function printPreview() {
    const printContent = document.getElementById('previewContent').innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Preview</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                <link rel="stylesheet" href="/static/styles.css">
                <style>
                    body {
                        visibility: hidden;
                        background-color: white !important;
                        margin: 0;
                        padding: 0;
                    }

                    .invoice-preview {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        height: 297mm;
                        margin: 0;
                        padding: 20mm !important;
                        box-shadow: none !important;
                        background: white;
                    }

                    .invoice-preview * {
                        visibility: visible;
                    }

                    @page {
                        margin: 0;
                        size: A4;
                    }

                    /* Table styles */
                    .table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }

                    .table th,
                    .table td {
                        padding: 0.5rem !important;
                        border: 1px solid #dee2e6 !important;
                    }

                    .table-striped tbody tr:nth-of-type(odd) {
                        background-color: rgba(0, 0, 0, 0.05) !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Ensure proper page breaks */
                    .customer-section,
                    .terms-section,
                    .footer-section {
                        page-break-inside: avoid;
                    }

                    /* Adjust font sizes */
                    .invoice-preview {
                        font-size: 10pt;
                    }

                    .invoice-preview h2 {
                        font-size: 16pt;
                    }

                    .invoice-preview h5 {
                        font-size: 12pt;
                    }

                    /* Ensure borders print properly */
                    .border,
                    .border-top,
                    .border-bottom,
                    .border-start,
                    .border-end {
                        border-color: #000 !important;
                    }

                    /* Bootstrap color overrides */
                    .bg-light {
                        background-color: #f8f9fa !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .text-muted {
                        color: #6c757d !important;
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

async function exportRecords() {
    try {
        const response = await fetch('/api/export-records');
        if (!response.ok) throw new Error('Failed to export records');
        
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        showToast('Records exported successfully');
        
    } catch (error) {
        console.error('Error exporting records:', error);
        showToast('Error exporting records', 'error');
    }
}

async function sendWhatsApp(documentNumber, phone) {
    try {
        // Remove any non-digits first
        let formattedPhone = phone.replace(/\D/g, '');
        
        // If number starts with 0, remove it and add Pakistan code
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '92' + formattedPhone.substring(1);
        }
        // If number doesn't have country code, add it
        else if (!formattedPhone.startsWith('92')) {
            formattedPhone = '92' + formattedPhone;
        }
        
        // Create WhatsApp message
        const message = `Dear Valued Customer,\n\n` +
            `Thank you for choosing Combined Solar Works for your solar energy needs. ` +
            `This message is regarding your ${documentNumber}.\n\n` +
            `We appreciate your business and are committed to providing you with the best solar solutions.\n\n` +
            `Best Regards,\nCombined Solar Works Team`;
        
        // Open WhatsApp with message
        window.open(`https://api.whatsapp.com/send/?phone=${formattedPhone}&text=${encodeURIComponent(message)}`, '_blank');
        
    } catch (error) {
        console.error('Error sending WhatsApp:', error);
        showToast('Error sending WhatsApp message', 'error');
    }
} 