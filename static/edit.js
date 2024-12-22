let currentDocument = null;
let items = [];
let documentNumber = '';

// Load document data when page loads
document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    documentNumber = pathParts[pathParts.length - 1];
    loadDocument(documentNumber);
});

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

function calculateTotal() {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
}

// Load document data from server
async function loadDocument(documentNumber) {
    try {
        const response = await fetch(`/api/document/${documentNumber}`);
        if (!response.ok) throw new Error('Failed to load document');
        
        const documentData = await response.json();
        
        // Populate form fields
        document.getElementById('documentNumber').textContent = documentData.number;
        document.getElementById('customerName').value = documentData.customer_name;
        document.getElementById('customerPhone').value = documentData.customer_phone || '';
        document.getElementById('documentDate').value = documentData.date;
        
        // Load items
        items = JSON.parse(documentData.items);
        displayItems();
        
    } catch (error) {
        console.error('Error loading document:', error);
        showToast('Error loading document', 'error');
    }
}

// Display items in table
function displayItems() {
    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = '';
    
    let total = 0;
    items.forEach((item, index) => {
        total += item.total;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>Rs. ${item.price.toLocaleString()}</td>
            <td>Rs. ${item.total.toLocaleString()}</td>
            <td>
                <button onclick="removeItem(${index})" class="btn btn-danger btn-sm">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Update total amount
    document.getElementById('totalAmount').textContent = `Rs. ${total.toLocaleString()}`;
}

// Add new item
function addItem() {
    const name = document.getElementById('itemName').value;
    const description = document.getElementById('itemDescription').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const price = parseFloat(document.getElementById('itemPrice').value);
    
    if (!name || !quantity || !price) {
        alert('Please fill in all item fields');
        return;
    }
    
    const item = {
        name,
        description,
        quantity,
        price,
        total: quantity * price
    };
    
    items.push(item);
    displayItems();
    
    // Clear form
    document.getElementById('itemName').value = '';
    document.getElementById('itemDescription').value = '';
    document.getElementById('itemQuantity').value = '1';
    document.getElementById('itemPrice').value = '';
}

// Remove item
function removeItem(index) {
    items.splice(index, 1);
    displayItems();
}

// Save changes
async function saveChanges() {
    try {
        const data = {
            customer_name: document.getElementById('customerName').value,
            customer_phone: document.getElementById('customerPhone').value,
            date: document.getElementById('documentDate').value,
            items: JSON.stringify(items),
            tax: 0,
            total: calculateTotal()
        };
        
        const response = await fetch(`/api/invoices/${documentNumber}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to save changes');
        
        showToast('Changes saved successfully');
        setTimeout(() => {
            window.location.href = '/records';
        }, 1000);
        
    } catch (error) {
        console.error('Error saving changes:', error);
        showToast('Error saving changes', 'error');
    }
}

// Cancel edit
function cancelEdit() {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
        window.location.href = '/records';
    }
}

function updatePreview() {
    // Update customer details
    document.getElementById('previewCustomerName').textContent = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const phoneContainer = document.getElementById('previewCustomerPhoneContainer');
    const phoneElement = document.getElementById('previewCustomerPhone');
    
    if (customerPhone) {
        phoneContainer.style.display = 'block';
        phoneElement.textContent = customerPhone;
    } else {
        phoneContainer.style.display = 'none';
    }
    
    // Update date
    const date = document.getElementById('documentDate').value;
} 