let currentDocument = null;
let items = [];

// Load document data when page loads
document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    const documentNumber = pathParts[pathParts.length - 1];
    loadDocument(documentNumber);
});

// Load document data from server
async function loadDocument(documentNumber) {
    try {
        const response = await fetch(`/api/document/${documentNumber}`);
        if (!response.ok) throw new Error('Document not found');
        
        currentDocument = await response.json();
        
        // Populate form fields
        document.getElementById('documentNumber').textContent = currentDocument.number;
        document.getElementById('customerName').value = currentDocument.customer_name;
        document.getElementById('invoiceDate').value = currentDocument.date;
        
        // Load items
        items = JSON.parse(currentDocument.items);
        displayItems();
    } catch (error) {
        console.error('Error loading document:', error);
        alert('Error loading document. Redirecting to records page...');
        window.location.href = '/records';
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
    const updatedDocument = {
        ...currentDocument,
        customer_name: document.getElementById('customerName').value,
        date: document.getElementById('invoiceDate').value,
        items: JSON.stringify(items),
        subtotal: items.reduce((sum, item) => sum + item.total, 0),
        tax: items.reduce((sum, item) => sum + item.total, 0) * 0.17,
        total: items.reduce((sum, item) => sum + item.total, 0) * 1.17
    };
    
    try {
        const response = await fetch(`/api/invoices/${currentDocument.number}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedDocument)
        });
        
        if (!response.ok) throw new Error('Failed to save changes');
        
        alert('Changes saved successfully');
        window.location.href = '/records';
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Error saving changes. Please try again.');
    }
}

// Cancel edit
function cancelEdit() {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
        window.location.href = '/records';
    }
} 