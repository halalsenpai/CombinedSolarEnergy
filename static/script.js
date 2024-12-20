const inventoryData = {
    lastUpdated: "2024-12-10",
    batteries: [
        {
            name: "Dyness Lithium Battery 48V 100Ah",
            description: "Lithium Battery System",
            price: 222000,
            updatedAt: "2024-12-04"
        },
        {
            name: "Phoenix-1800 Battery 185Ah",
            description: "Lead Acid Battery",
            price: 45000,
            updatedAt: "2024-12-01"
        },
        {
            name: "AGS Battery 140Ah",
            description: "Lead Acid Battery",
            price: 42000,
            updatedAt: "2024-12-01"
        },
        {
            name: "AGS Battery 90Ah",
            description: "Lead Acid Battery",
            price: 35000,
            updatedAt: "2024-12-01"
        }
    ],
    inverters: [
        {
            name: "Crown Elego Oyster 6KW",
            description: "Hybrid Inverter",
            price: 315000,
            updatedAt: "2024-12-10"
        },
        {
            name: "Inveriox 6KW Hybrid-IP65",
            description: "Hybrid Inverter IP65",
            price: 335000,
            updatedAt: "2024-12-01"
        },
        {
            name: "Crown 3.2KW-IP65",
            description: "Hybrid Inverter IP65",
            price: 250000,
            updatedAt: "2024-12-01"
        },
        {
            name: "Growatt 15KW",
            description: "On-Grid Inverter",
            price: 232000,
            updatedAt: "2024-12-06"
        },
        {
            name: "Growatt 10KW",
            description: "On-Grid Inverter",
            price: 190000,
            updatedAt: "2024-12-06"
        },
        {
            name: "Crown Elego 6KW",
            description: "Hybrid Inverter",
            price: 195000,
            updatedAt: "2024-12-10"
        },
        {
            name: "TESLA 6KW",
            description: "Hybrid Inverter",
            price: 175000,
            updatedAt: "2024-12-09"
        },
        {
            name: "Crown Arceus 5.8KW",
            description: "Hybrid Inverter",
            price: 165000,
            updatedAt: "2024-12-10"
        },
        {
            name: "Knox 6KW",
            description: "Hybrid Inverter",
            price: 162000,
            updatedAt: "2024-12-09"
        },
        {
            name: "Inverex Yukon II 5.6KW",
            description: "48V - 5 Years Warranty",
            price: 156000,
            updatedAt: "2024-12-10"
        }
    ],
    solarPanels: [
        {
            name: "Jinko N-type Bifacial 585W",
            description: "Premium Solar Panel",
            pricePerWatt: 30.5,
            price: 17842.5, // 585W * 30.5
            updatedAt: "2024-12-05"
        },
        {
            name: "Jinko N-type Bifacial 585W (Pallet)",
            description: "Bulk Purchase Price",
            pricePerWatt: 29.75,
            price: 17403.75, // 585W * 29.75
            updatedAt: "2024-12-05"
        },
        {
            name: "Longi Himo X6 580W",
            description: "Monofacial Panel",
            pricePerWatt: 28,
            price: 16240, // 580W * 28
            updatedAt: "2024-12-05"
        },
        {
            name: "Longi Himo X6 580W (Pallet)",
            description: "Bulk Purchase Price",
            pricePerWatt: 27.5,
            price: 15950, // 580W * 27.5
            updatedAt: "2024-12-05"
        },
        {
            name: "Longi Himo X7 605W (Pallet)",
            description: "High Power Panel - Bulk",
            pricePerWatt: 29.5,
            price: 17847.5, // 605W * 29.5
            updatedAt: "2024-12-05"
        }
    ],
    wiring: [
        {
            name: "DC Wire 6mm",
            description: "Solar DC Cable",
            price: 25000,
            updatedAt: "2024-12-01"
        },
        {
            name: "DC Wire 25mm",
            description: "Heavy Duty Solar DC Cable",
            price: 89100,
            updatedAt: "2024-12-01"
        },
        {
            name: "Wire 7/44",
            description: "Standard Cable",
            price: 28000,
            updatedAt: "2024-12-01"
        }
    ]
};

// Update the presetComponents to use the new inventory data
const presetComponents = {
    panels: inventoryData.solarPanels,
    batteries: inventoryData.batteries,
    inverters: inventoryData.inverters,
    wiring: inventoryData.wiring
};

// Add this function to show last update date
function showLastUpdate() {
    const dateStr = new Date(inventoryData.lastUpdated).toLocaleDateString();
    console.log(`Prices last updated on: ${dateStr}`);
}

// Modify the component type select to include wiring
document.getElementById('componentType').innerHTML = `
    <option value="">Select Component Type</option>
    <option value="panels">Solar Panels</option>
    <option value="batteries">Batteries</option>
    <option value="inverters">Inverters</option>
    <option value="wiring">Wiring</option>
`;

let items = [];

function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    const quantity = parseFloat(document.getElementById('itemQuantity').value);
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!name || !description || !quantity || !price) {
        alert('Please fill in all fields');
        return;
    }

    if (quantity < 1) {
        alert('Quantity must be at least 1');
        return;
    }

    if (price < 0) {
        alert('Price cannot be negative');
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
    updateItemsTable();
    clearInputs();
    
    // Add visual feedback
    const addButton = document.querySelector('.add-item-btn');
    addButton.style.backgroundColor = '#45a049';
    addButton.textContent = 'Added!';
    setTimeout(() => {
        addButton.style.backgroundColor = '#4CAF50';
        addButton.innerHTML = '<i class="plus-icon">+</i> Add Item';
    }, 1000);
}

function clearInputs() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemDescription').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemPrice').value = '';
}

function updateItemsTable() {
    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = '';

    items.forEach((item, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>Rs.${item.price.toFixed(2)}</td>
            <td>Rs.${item.total.toFixed(2)}</td>
            <td>
                <button onclick="removeItem(${index})" class="remove-btn">
                    Remove
                </button>
            </td>
        `;
    });
}

function removeItem(index) {
    items.splice(index, 1);
    updateItemsTable();
}

// Add these functions to handle terms and conditions
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

// Shared function to display document preview
function displayDocument(documentData, isQuotation = false) {
    // Set document type
    document.getElementById('documentType').textContent = isQuotation ? 'QUOTATION' : 'INVOICE';
    
    // Update preview
    document.getElementById('previewCompanyName').textContent = documentData.company_name;
    document.getElementById('previewCustomerName').textContent = documentData.customer_name;
    document.getElementById('previewInvoiceNumber').textContent = documentData.number || '';
    document.getElementById('previewInvoiceDate').textContent = 
        new Date(documentData.date).toLocaleDateString();

    // Calculate validity date for quotations
    const validityDate = new Date(documentData.date);
    if (isQuotation) {
        validityDate.setDate(validityDate.getDate() + 7);
    }
    document.getElementById('validityDate').textContent = validityDate.toLocaleDateString();

    // Add terms and conditions
    document.getElementById('termsContent').innerHTML = 
        isQuotation ? terms.quotation : terms.invoice;

    // Calculate totals and populate table
    const previewBody = document.getElementById('previewBody');
    previewBody.innerHTML = '';
    
    let total = 0;
    const itemsList = Array.isArray(documentData.items) ? 
        documentData.items : JSON.parse(documentData.items || '[]');

    itemsList.forEach(item => {
        const row = previewBody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td class="amount">Rs.${item.price.toFixed(2)}</td>
            <td class="amount">Rs.${item.total.toFixed(2)}</td>
        `;
        total += item.total;
    });

    document.getElementById('totalAmount').textContent = `Rs.${total.toFixed(2)}`;

    // Show preview
    document.getElementById('invoicePreview').style.display = 'block';
}

// Update generateInvoice to use the shared function
async function generateInvoice(isQuotation = false) {
    const companyName = 'Combined Solar Works';
    const customerName = document.getElementById('customerName').value;
    const invoiceDate = document.getElementById('invoiceDate').value;

    if (!customerName || !invoiceDate) {
        alert('Please fill in all details');
        return;
    }

    try {
        // Get the next number from the server
        const docType = isQuotation ? 'quotation' : 'invoice';
        const response = await fetch(`/api/next-number/${docType}`);
        const result = await response.json();
        
        if (!response.ok || result.error) {
            throw new Error(result.error || 'Failed to get document number');
        }

        const documentNumber = result.number;
        if (!documentNumber) {
            throw new Error('Invalid document number received');
        }

        // Prepare document data
        const documentData = {
            type: docType,
            number: documentNumber,
            company_name: companyName,
            customer_name: customerName,
            date: invoiceDate,
            items: items
        };

        // Display the document
        displayDocument(documentData, isQuotation);
        
        // Smooth scroll to preview with offset
        const previewElement = document.getElementById('invoicePreview');
        const offset = 50;
        const elementPosition = previewElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    } catch (error) {
        console.error('Error generating document:', error);
        alert(`Error generating document: ${error.message}`);
    }
}

function generateQuotation() {
    generateInvoice(true);
}

document.getElementById('componentType').addEventListener('change', function() {
    const type = this.value;
    const componentList = document.getElementById('componentList');
    componentList.innerHTML = '<option value="">Select Component</option>';
    
    if (type) {
        // Add visual feedback
        this.classList.add('component-selected');
        
        presetComponents[type].forEach((component, index) => {
            const formattedPrice = new Intl.NumberFormat('en-PK', {
                style: 'currency',
                currency: 'PKR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(component.price);
            
            componentList.innerHTML += `
                <option value="${index}">${component.name} - ${formattedPrice}</option>
            `;
        });
    } else {
        this.classList.remove('component-selected');
    }
});

function addPresetItem() {
    const typeSelect = document.getElementById('componentType');
    const componentSelect = document.getElementById('componentList');
    const type = typeSelect.value;
    const componentIndex = componentSelect.value;
    const quantity = parseInt(document.getElementById('presetQuantity').value) || 1;
    
    if (!type || componentIndex === '') {
        alert('Please select both component type and specific component');
        return;
    }
    
    if (quantity < 1) {
        alert('Quantity must be at least 1');
        return;
    }
    
    const component = presetComponents[type][componentIndex];
    const item = {
        name: component.name,
        description: component.description,
        quantity: quantity,
        price: component.price,
        total: component.price * quantity
    };
    
    items.push(item);
    updateItemsTable();
    
    // Reset quantity to 1 and provide visual feedback
    document.getElementById('presetQuantity').value = 1;
    
    const addButton = document.querySelector('.add-preset-btn');
    addButton.textContent = 'Added!';
    addButton.style.backgroundColor = '#4CAF50';
    
    setTimeout(() => {
        addButton.innerHTML = '<i class="plus-icon">+</i> Add Component';
        addButton.style.backgroundColor = '#2196F3';
    }, 1000);
}

function hidePreview() {
    document.getElementById('invoicePreview').style.display = 'none';
}

// Add this after the inventoryData object
const systemPresets = {
    "3.2kw": {
        name: "3.2KW Solar System Package",
        components: [
            {
                name: "Longi Himo X6 580W Solar Panels",
                description: "Monofacial Panels (6 pieces)",
                quantity: 6,
                price: 15950,  // Using pallet price
                total: 95700
            },
            {
                name: "Crown Xavier 3KW",
                description: "Hybrid Inverter",
                quantity: 1,
                price: 85000,
                total: 85000
            },
            {
                name: "Battery 140 Amp AGS",
                description: "Lead Acid Battery",
                quantity: 2,
                price: 42000,
                total: 84000
            },
            {
                name: "DC Wire 6mm",
                description: "Solar DC Cable",
                quantity: 1,
                price: 25000,
                total: 25000
            }
        ],
        totalPrice: 289700,
        description: "Complete 3.2KW system with 6x580W panels, 3KW inverter, and 2x140Ah batteries"
    },
    "5kw": {
        name: "5KW Solar System Package",
        components: [
            {
                name: "Longi Himo X6 580W Solar Panels",
                description: "Monofacial Panels (9 pieces)",
                quantity: 9,
                price: 15950,  // Using pallet price
                total: 143550
            },
            {
                name: "Knox inverter-5KW",
                description: "Hybrid Inverter",
                quantity: 1,
                price: 136000,
                total: 136000
            },
            {
                name: "Battery 185 Amp Phonix-1800",
                description: "Lead Acid Battery",
                quantity: 4,
                price: 45000,
                total: 180000
            },
            {
                name: "DC Wire 6mm",
                description: "Solar DC Cable",
                quantity: 2,
                price: 25000,
                total: 50000
            }
        ],
        totalPrice: 509550,
        description: "Complete 5KW system with 9x580W panels, 5KW inverter, and 4x185Ah batteries"
    },
    "6kw": {
        name: "6KW Solar System Package",
        components: [
            {
                name: "Longi Himo X6 580W Solar Panels",
                description: "Monofacial Panels (11 pieces)",
                quantity: 11,
                price: 15950,  // Using pallet price
                total: 175450
            },
            {
                name: "POWER SQUARE-6 KW",
                description: "Hybrid Inverter",
                quantity: 1,
                price: 139000,
                total: 139000
            },
            {
                name: "Battery 185 Amp Phonix-1800",
                description: "Lead Acid Battery",
                quantity: 4,
                price: 45000,
                total: 180000
            },
            {
                name: "DC Wire 25mm",
                description: "Heavy Duty Solar DC Cable",
                quantity: 1,
                price: 89100,
                total: 89100
            }
        ],
        totalPrice: 583550,
        description: "Complete 6KW system with 11x580W panels, 6KW inverter, and 4x185Ah batteries"
    }
};

// Add this function to handle preset system selection
function addSystemPreset() {
    const systemSize = document.getElementById('systemPreset').value;
    if (!systemSize) {
        alert('Please select a system size');
        return;
    }

    const preset = systemPresets[systemSize];
    // Clear existing items
    items = [];
    
    // Add all components from the preset
    preset.components.forEach(component => {
        items.push({
            name: component.name,
            description: component.description,
            quantity: component.quantity,
            price: component.price,
            total: component.total
        });
    });

    updateItemsTable();
}

// Initialize elements after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('invoiceDate');
    if (dateInput) {
        dateInput.value = today;
    }

    // Check if we're on the records page
    const isRecordsPage = document.querySelector('.records-section') !== null;

    if (isRecordsPage) {
        // Only load saved invoices if we're on the records page
        loadSavedInvoices();
    }

    // Add system preset selector if invoice-info exists
    const invoiceInfo = document.querySelector('.invoice-info');
    if (invoiceInfo) {
        const presetDiv = document.createElement('div');
        presetDiv.className = 'preset-systems';
        presetDiv.innerHTML = `
            <h2>Complete System Packages</h2>
            <div class="system-selector">
                <select id="systemPreset">
                    <option value="">Select Complete System Package</option>
                    <option value="3.2kw">3.2KW System (Rs.289,700)</option>
                    <option value="5kw">5KW System (Rs.509,550)</option>
                    <option value="6kw">6KW System (Rs.583,550)</option>
                </select>
                <button onclick="addSystemPreset()" class="add-preset-btn">Add Complete System</button>
            </div>
        `;
        invoiceInfo.parentNode.insertBefore(presetDiv, invoiceInfo.nextSibling);
    }

    // Initialize component type select if it exists
    const componentTypeSelect = document.getElementById('componentType');
    if (componentTypeSelect) {
        componentTypeSelect.innerHTML = `
            <option value="">Select Component Type</option>
            <option value="panels">Solar Panels</option>
            <option value="batteries">Batteries</option>
            <option value="inverters">Inverters</option>
            <option value="wiring">Wiring</option>
        `;

        componentTypeSelect.addEventListener('change', function() {
            const type = this.value;
            const componentList = document.getElementById('componentList');
            if (!componentList) return;

            componentList.innerHTML = '<option value="">Select Component</option>';
            
            if (type) {
                this.classList.add('component-selected');
                
                presetComponents[type].forEach((component, index) => {
                    const formattedPrice = new Intl.NumberFormat('en-PK', {
                        style: 'currency',
                        currency: 'PKR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(component.price);
                    
                    componentList.innerHTML += `
                        <option value="${index}">${component.name} - ${formattedPrice}</option>
                    `;
                });
            } else {
                this.classList.remove('component-selected');
            }
        });
    }

    // Initialize component list change listener if it exists
    const componentList = document.getElementById('componentList');
    if (componentList) {
        componentList.addEventListener('change', function() {
            if (this.value) {
                this.classList.add('component-selected');
            } else {
                this.classList.remove('component-selected');
            }
        });
    }

    // Initialize preset quantity input listener if it exists
    const presetQuantity = document.getElementById('presetQuantity');
    if (presetQuantity) {
        presetQuantity.addEventListener('input', function() {
            if (this.value && this.value > 0) {
                this.classList.add('component-selected');
            } else {
                this.classList.remove('component-selected');
            }
        });
    }
});

// Add event listener for component list changes
document.getElementById('componentList').addEventListener('change', function() {
    if (this.value) {
        this.classList.add('component-selected');
    } else {
        this.classList.remove('component-selected');
    }
});

// Add input event listener for quantity
document.getElementById('presetQuantity').addEventListener('input', function() {
    if (this.value && this.value > 0) {
        this.classList.add('component-selected');
    } else {
        this.classList.remove('component-selected');
    }
});

// Add notification functions
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);

    // Hide and remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update saveInvoice function
async function saveInvoice() {
    const companyName = 'Combined Solar Works';
    const customerName = document.getElementById('customerName').value;
    const date = document.getElementById('invoiceDate').value;
    
    if (!companyName || !customerName || !date || items.length === 0) {
        showNotification('Please fill in all required fields and add at least one item', 'error');
        return;
    }

    const total = items.reduce((sum, item) => sum + item.total, 0);

    const documentType = document.getElementById('documentType').textContent;
    const data = {
        type: documentType === 'INVOICE' ? 'invoice' : 'quotation',
        company_name: companyName,
        customer_name: customerName,
        date: date,
        items: JSON.stringify(items),
        total: total
    };

    try {
        // Show saving notification
        showNotification('Saving document...', 'success');

        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            // Update the document number in the preview
            document.getElementById('previewInvoiceNumber').textContent = result.number;
            showNotification(`${documentType.toLowerCase()} saved successfully with number: ${result.number}`, 'success');
            
            // Clear form if needed
            if (confirm('Document saved successfully. Would you like to create a new one?')) {
                clearForm();
            }
        } else {
            throw new Error(result.error || 'Error saving the document');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(`Error saving document: ${error.message}`, 'error');
    }
}

// Add clearForm function
function clearForm() {
    document.getElementById('customerName').value = '';
    document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
    items = [];
    updateItemsTable();
    document.getElementById('invoicePreview').style.display = 'none';
}

// Add these functions to handle saving and loading invoices
async function loadSavedInvoices() {
    const tbody = document.getElementById('savedInvoicesBody');
    if (!tbody) return; // Exit if we're not on the records page
    
    try {
        const response = await fetch('/api/invoices');
        const invoices = await response.json();
        
        tbody.innerHTML = '';
        
        invoices.forEach(invoice => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${invoice.number}</td>
                <td>${invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)}</td>
                <td>${new Date(invoice.date).toLocaleDateString()}</td>
                <td>${invoice.customer_name}</td>
                <td>Rs.${invoice.total.toFixed(2)}</td>
                <td>
                    <button onclick="loadInvoice('${invoice.number}')" class="load-btn">
                        Load
                    </button>
                </td>
            `;
        });
    } catch (error) {
        console.error('Error loading saved invoices:', error);
    }
}

// Update viewRecord to use the shared function
function viewRecord(number) {
    const record = allRecords.find(r => r.number === number);
    if (!record) return;

    const isQuotation = record.type === 'quotation';
    displayDocument(record, isQuotation);

    // Show modal
    const modal = document.getElementById('previewModal');
    modal.style.display = 'block';
}