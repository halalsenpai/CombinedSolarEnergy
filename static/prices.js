let components = [];
let categories = [];
let vendors = [];
let editingComponent = null;
let editingVendor = null;
let currentView = 'grid';
let quickEditingComponent = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadVendors();
    loadComponents();
    initializeEventListeners();

    // Load saved view preference
    const savedView = localStorage.getItem('componentsView');
    if (savedView) {
        switchView(savedView);
    }

    // Add vendor change handler
    document.getElementById('activeVendor').addEventListener('change', (e) => {
        const vendorId = e.target.value;
        if (vendorId) {
            updateVendorStats(vendorId);
            document.getElementById('vendorStats').style.display = 'block';
        } else {
            document.getElementById('vendorStats').style.display = 'none';
        }
        loadComponents();
    });
});

// Initialize event listeners
function initializeEventListeners() {
    document.getElementById('searchInput').addEventListener('input', () => displayComponents());
    document.getElementById('categoryFilter').addEventListener('change', () => displayComponents());
    document.getElementById('sortBy').addEventListener('change', () => displayComponents());
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        populateCategorySelects();
    } catch (error) {
        showToast('Error loading categories', 'error');
    }
}

// Populate category select elements
function populateCategorySelects() {
    const selects = ['categoryFilter', 'componentCategory', 'bulkCategory'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = selectId === 'categoryFilter' 
            ? '<option value="">All Categories</option>'
            : '<option value="">Select Category</option>';
            
        categories.forEach(category => {
            select.innerHTML += `
                <option value="${category.id}">${category.name}</option>
            `;
        });
    });
}

// Load all components
async function loadComponents() {
    try {
        const response = await fetch('/api/components');
        components = await response.json();
        displayComponents();
    } catch (error) {
        showToast('Error loading components', 'error');
    }
}

// Display components
function displayComponents() {
    const filteredComponents = filterComponentsList();
    
    if (currentView === 'grid') {
        displayGridView(filteredComponents);
    } else {
        displayListView(filteredComponents);
    }
}

// Display grid view
function displayGridView(components) {
    const grid = document.getElementById('gridView');
    grid.innerHTML = '';
    
    components.forEach(component => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-3';
        card.innerHTML = `
            <div class="card price-card h-100">
                <div class="card-header bg-transparent border-0 pt-3 pb-0">
                    <div class="d-flex gap-1 mb-2">
                        <span class="badge bg-primary category-badge">
                            <i class="bi bi-tag"></i> ${component.category_name}
                        </span>
                        <span class="badge bg-secondary vendor-badge">
                            <i class="bi bi-building"></i> ${component.vendor_name || 'No Vendor'}
                        </span>
                    </div>
                    <h5 class="card-title text-truncate" title="${component.name}">${component.name}</h5>
                </div>
                <div class="card-body">
                    <p class="card-text text-muted small mb-3" style="min-height: 3em;">
                        ${component.description || 'No description'}
                    </p>
                    <div class="price-section">
                        <div class="d-flex justify-content-between align-items-end mb-2">
                            <div>
                                <small class="text-muted">Price</small>
                                <h4 class="mb-0">Rs. ${component.price.toLocaleString()}</h4>
                            </div>
                            <small class="text-muted text-end">
                                Last updated<br>
                                ${new Date(component.last_price_update || Date.now()).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-0">
                    <div class="d-flex justify-content-between">
                        <button onclick="quickEdit(${component.id})" class="btn btn-sm btn-outline-primary flex-grow-1 me-2">
                            <i class="bi bi-pencil-square"></i> Quick Edit
                        </button>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li>
                                    <a class="dropdown-item" href="#" onclick="editComponent(${component.id})">
                                        <i class="bi bi-pencil"></i> Full Edit
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#" onclick="duplicateComponent(${component.id})">
                                        <i class="bi bi-copy"></i> Duplicate
                                    </a>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                                <li>
                                    <a class="dropdown-item text-danger" href="#" onclick="deleteComponent(${component.id})">
                                        <i class="bi bi-trash"></i> Delete
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    if (components.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h3 class="mt-3">No Components Found</h3>
                <p class="text-muted">Try adjusting your search or filters</p>
            </div>
        `;
    }
}

// Display list view
function displayListView(components) {
    const tbody = document.getElementById('componentsTable');
    tbody.innerHTML = '';
    
    components.forEach(component => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="d-flex flex-column">
                    <strong>${component.name}</strong>
                    <small class="text-muted">${component.description || 'No description'}</small>
                </div>
            </td>
            <td><span class="badge bg-primary">${component.category_name}</span></td>
            <td><span class="badge bg-secondary">${component.vendor_name || 'No Vendor'}</span></td>
            <td class="text-end">
                <strong>Rs. ${component.price.toLocaleString()}</strong>
            </td>
            <td>
                <small class="text-muted">
                    ${new Date(component.last_price_update || Date.now()).toLocaleDateString()}
                </small>
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button onclick="quickEdit(${component.id})" class="btn btn-outline-primary">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item" href="#" onclick="editComponent(${component.id})">
                                    <i class="bi bi-pencil"></i> Full Edit
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="duplicateComponent(${component.id})">
                                    <i class="bi bi-copy"></i> Duplicate
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="deleteComponent(${component.id})">
                                    <i class="bi bi-trash"></i> Delete
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (components.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h3 class="mt-3">No Components Found</h3>
                    <p class="text-muted">Try adjusting your search or filters</p>
                </td>
            </tr>
        `;
    }
}

// Filter components based on search and category
function filterComponentsList() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryId = document.getElementById('categoryFilter').value;
    const vendorId = document.getElementById('activeVendor').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filtered = components.filter(component => {
        const matchesSearch = 
            component.name.toLowerCase().includes(searchTerm) ||
            component.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryId || component.category_id === parseInt(categoryId);
        const matchesVendor = !vendorId || component.vendor_id === parseInt(vendorId);
        return matchesSearch && matchesCategory && matchesVendor;
    });
    
    // Sort components
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return b.price - a.price;
            case 'updated':
                return new Date(b.last_price_update || 0) - new Date(a.last_price_update || 0);
            default:
                return a.name.localeCompare(b.name);
        }
    });
    
    return filtered;
}

// Show add/edit modal
function showAddModal(componentId = null) {
    editingComponent = componentId ? components.find(c => c.id === componentId) : null;
    const modal = new bootstrap.Modal(document.getElementById('componentModal'));
    
    document.getElementById('modalTitle').textContent = 
        editingComponent ? 'Edit Component' : 'Add New Component';
        
    if (editingComponent) {
        document.getElementById('componentCategory').value = editingComponent.category_id;
        document.getElementById('componentVendor').value = editingComponent.vendor_id;
        document.getElementById('componentName').value = editingComponent.name;
        document.getElementById('componentDescription').value = editingComponent.description;
        document.getElementById('componentPrice').value = editingComponent.price;
    } else {
        // Pre-select current vendor if one is active
        const activeVendorId = document.getElementById('activeVendor').value;
        if (activeVendorId) {
            document.getElementById('componentVendor').value = activeVendorId;
        }
        document.getElementById('componentForm').reset();
    }
    
    modal.show();
}

// Save component
async function saveComponent() {
    const form = document.getElementById('componentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const componentData = {
        category_id: parseInt(document.getElementById('componentCategory').value),
        name: document.getElementById('componentName').value,
        description: document.getElementById('componentDescription').value,
        price: parseFloat(document.getElementById('componentPrice').value)
    };
    
    try {
        const url = editingComponent
            ? `/api/components/${editingComponent.id}`
            : `/api/categories/${componentData.category_id}/components`;
            
        const response = await fetch(url, {
            method: editingComponent ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(componentData)
        });
        
        if (!response.ok) throw new Error('Failed to save component');
        
        bootstrap.Modal.getInstance(document.getElementById('componentModal')).hide();
        await loadComponents();
        showToast('Component saved successfully');
        
    } catch (error) {
        showToast('Error saving component', 'error');
    }
}

// Delete component
async function deleteComponent(id) {
    if (!confirm('Are you sure you want to delete this component?')) return;
    
    try {
        const response = await fetch(`/api/components/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete component');
        
        await loadComponents();
        showToast('Component deleted successfully');
        
    } catch (error) {
        showToast('Error deleting component', 'error');
    }
}

// Show import modal
function showImportModal() {
    const modal = new bootstrap.Modal(document.getElementById('importModal'));
    document.getElementById('importForm').reset();
    modal.show();
}

// Show bulk update modal
function showBulkUpdateModal() {
    const modal = new bootstrap.Modal(document.getElementById('bulkUpdateModal'));
    
    // Pre-select current vendor's category if one is active
    const activeVendorId = document.getElementById('activeVendor').value;
    if (activeVendorId) {
        const vendorComponents = components.filter(c => c.vendor_id === parseInt(activeVendorId));
        if (vendorComponents.length > 0) {
            const categories = [...new Set(vendorComponents.map(c => c.category_id))];
            if (categories.length === 1) {
                document.getElementById('bulkCategory').value = categories[0];
            }
        }
    }
    
    // Reset form values
    document.getElementById('adjustmentType').value = 'percentage';
    document.getElementById('adjustmentValue').value = '';
    document.getElementById('adjustmentDirection').value = 'increase';
    
    modal.show();
}

// Apply bulk price update
async function applyBulkUpdate() {
    const categoryId = document.getElementById('bulkCategory').value;
    const type = document.getElementById('adjustmentType').value;
    const value = parseFloat(document.getElementById('adjustmentValue').value);
    const direction = document.getElementById('adjustmentDirection').value;
    
    if (!categoryId || isNaN(value)) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/categories/${categoryId}/bulk-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, value, direction })
        });
        
        if (!response.ok) throw new Error('Failed to update prices');
        
        bootstrap.Modal.getInstance(document.getElementById('bulkUpdateModal')).hide();
        await loadComponents();
        showToast('Prices updated successfully');
        
    } catch (error) {
        showToast('Error updating prices', 'error');
    }
}

// Export prices to CSV
function exportPrices() {
    const csv = [
        ['Category', 'Name', 'Description', 'Price', 'Last Updated']
    ];
    
    components.forEach(component => {
        csv.push([
            component.category_name,
            component.name,
            component.description,
            component.price,
            new Date(component.updated_at || Date.now()).toLocaleDateString()
        ]);
    });
    
    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Edit component
function editComponent(id) {
    const component = components.find(c => c.id === id);
    if (!component) return;
    
    showAddModal(id);
}
  
  // Show add/edit modal
  function showAddModal(componentId = null) {
      editingComponent = componentId ? components.find(c => c.id === componentId) : null;
      const modal = new bootstrap.Modal(document.getElementById('componentModal'));
      
      document.getElementById('modalTitle').textContent = 
          editingComponent ? 'Edit Component' : 'Add New Component';
          
      if (editingComponent) {
          document.getElementById('componentCategory').value = editingComponent.category_id;
          document.getElementById('componentVendor').value = editingComponent.vendor_id;
          document.getElementById('componentName').value = editingComponent.name;
          document.getElementById('componentDescription').value = editingComponent.description;
          document.getElementById('componentPrice').value = editingComponent.price;
      } else {
          document.getElementById('componentForm').reset();
      }
      
      modal.show();
  }

  // Show import modal
  function showImportModal() {
      const modal = new bootstrap.Modal(document.getElementById('importModal'));
      document.getElementById('importForm').reset();
      modal.show();
  }

  // Import Excel file
  async function importExcel() {
      const form = document.getElementById('importForm');
      if (!form.checkValidity()) {
          form.reportValidity();
          return;
      }

      const categoryId = document.getElementById('importCategory').value;
      const file = document.getElementById('excelFile').files[0];
      
      if (!file) {
          showToast('Please select a file', 'error');
          return;
      }

      try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('category_id', categoryId);

          const response = await fetch('/api/import-components', {
              method: 'POST',
              body: formData
          });

          if (!response.ok) throw new Error('Failed to import components');

          const result = await response.json();
          bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
          await loadComponents();
          showToast(`Successfully imported ${result.count} components`);
      } catch (error) {
          showToast('Error importing components: ' + error.message, 'error');
      }
  }

  // Load vendors
  async function loadVendors() {
      try {
          const response = await fetch('/api/vendors');
          vendors = await response.json();
          populateVendorSelects();
          displayVendors();
      } catch (error) {
          showToast('Error loading vendors', 'error');
      }
  }

  // Populate vendor select elements
  function populateVendorSelects() {
      const selects = ['activeVendor', 'componentVendor'];
      selects.forEach(selectId => {
          const select = document.getElementById(selectId);
          if (!select) return;
          
          select.innerHTML = selectId === 'activeVendor' 
              ? '<option value="">All Vendors</option>'
              : '<option value="">Select Vendor</option>';
              
          vendors.forEach(vendor => {
              select.innerHTML += `
                  <option value="${vendor.id}">${vendor.name}</option>
              `;
          });
      });
  }

  // Display vendors in table
  function displayVendors() {
      const tbody = document.getElementById('vendorsTableBody');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      vendors.forEach(vendor => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
              <td>${vendor.name}</td>
              <td>${vendor.email || '-'}</td>
              <td>${vendor.phone || '-'}</td>
              <td>${vendor.notes || '-'}</td>
              <td>
                  <div class="btn-group btn-group-sm">
                      <button onclick="editVendor(${vendor.id})" class="btn btn-outline-primary">
                          <i class="bi bi-pencil"></i>
                      </button>
                      <button onclick="deleteVendor(${vendor.id})" class="btn btn-outline-danger">
                          <i class="bi bi-trash"></i>
                      </button>
                  </div>
              </td>
          `;
          tbody.appendChild(tr);
      });
  }

  // Add new vendor
  async function addVendor() {
      const form = document.getElementById('vendorForm');
      if (!form.checkValidity()) {
          form.reportValidity();
          return;
      }
      
      const vendorData = {
          name: document.getElementById('vendorName').value,
          email: document.getElementById('vendorEmail').value,
          phone: document.getElementById('vendorPhone').value,
          notes: document.getElementById('vendorNotes').value
      };
      
      try {
          const response = await fetch('/api/vendors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(vendorData)
          });
          
          if (!response.ok) throw new Error('Failed to add vendor');
          
          await loadVendors();
          form.reset();
          showToast('Vendor added successfully');
          
      } catch (error) {
          showToast('Error adding vendor', 'error');
      }
  }

  // Edit vendor
  function editVendor(id) {
      editingVendor = vendors.find(v => v.id === id);
      if (!editingVendor) return;
      
      document.getElementById('vendorName').value = editingVendor.name;
      document.getElementById('vendorEmail').value = editingVendor.email || '';
      document.getElementById('vendorPhone').value = editingVendor.phone || '';
      document.getElementById('vendorNotes').value = editingVendor.notes || '';
      
      const addButton = document.querySelector('#vendorForm button');
      addButton.textContent = 'Update Vendor';
      addButton.onclick = updateVendor;
  }

  // Update vendor
  async function updateVendor() {
      if (!editingVendor) return;
      
      const vendorData = {
          name: document.getElementById('vendorName').value,
          email: document.getElementById('vendorEmail').value,
          phone: document.getElementById('vendorPhone').value,
          notes: document.getElementById('vendorNotes').value
      };
      
      try {
          const response = await fetch(`/api/vendors/${editingVendor.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(vendorData)
          });
          
          if (!response.ok) throw new Error('Failed to update vendor');
          
          await loadVendors();
          document.getElementById('vendorForm').reset();
          
          const addButton = document.querySelector('#vendorForm button');
          addButton.textContent = 'Add Vendor';
          addButton.onclick = addVendor;
          
          editingVendor = null;
          showToast('Vendor updated successfully');
          
      } catch (error) {
          showToast('Error updating vendor', 'error');
      }
  }

  // Delete vendor
  async function deleteVendor(id) {
      if (!confirm('Are you sure you want to delete this vendor? All associated components will be marked as inactive.')) {
          return;
      }
      
      try {
          const response = await fetch(`/api/vendors/${id}`, {
              method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('Failed to delete vendor');
          
          await loadVendors();
          await loadComponents();
          showToast('Vendor deleted successfully');
          
      } catch (error) {
          showToast('Error deleting vendor', 'error');
      }
  }

  // Show vendor management modal
  function showVendorModal() {
      const modal = new bootstrap.Modal(document.getElementById('vendorModal'));
      document.getElementById('vendorForm').reset();
      
      // Reset add button state
      const addButton = document.querySelector('#vendorForm button');
      addButton.textContent = 'Add Vendor';
      addButton.onclick = addVendor;
      
      editingVendor = null;
      loadVendors();  // Refresh vendors list
      modal.show();
  }

  // Update vendor statistics
  async function updateVendorStats(vendorId) {
      const vendor = vendors.find(v => v.id === parseInt(vendorId));
      if (!vendor) return;
  
      const vendorComponents = components.filter(c => c.vendor_id === parseInt(vendorId));
      
      document.getElementById('vendorTotalComponents').textContent = vendorComponents.length;
      
      const lastUpdated = vendorComponents.length > 0 
          ? new Date(Math.max(...vendorComponents.map(c => new Date(c.last_price_update))))
          : null;
      
      document.getElementById('vendorLastUpdated').textContent = 
          lastUpdated ? lastUpdated.toLocaleDateString() : '-';
      
      document.getElementById('vendorContact').innerHTML = `
          ${vendor.email ? `<i class="bi bi-envelope"></i> ${vendor.email}<br>` : ''}
          ${vendor.phone ? `<i class="bi bi-telephone"></i> ${vendor.phone}` : ''}
      `;
  }

  // Switch between grid and list views
  function switchView(view) {
      currentView = view;
      localStorage.setItem('componentsView', view);
      
      // Update buttons
      document.querySelectorAll('[data-view]').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.view === view);
      });
      
      // Show/hide views
      document.getElementById('gridView').classList.toggle('d-none', view !== 'grid');
      document.getElementById('listView').classList.toggle('d-none', view !== 'list');
      
      // Refresh display
      displayComponents();
  }

  // Quick edit component price
  function quickEdit(id) {
      const component = components.find(c => c.id === id);
      if (!component) return;
      
      quickEditingComponent = component;
      
      // Set modal content
      const modal = document.getElementById('quickEditModal');
      modal.querySelector('.component-name').textContent = component.name;
      modal.querySelector('.vendor-name').textContent = component.vendor_name;
      modal.querySelector('.category-name').textContent = component.category_name;
      
      // Set current price
      document.getElementById('quickEditPrice').value = component.price;
      
      // Show modal
      new bootstrap.Modal(modal).show();
  }

  // Save quick edit changes
  async function saveQuickEdit() {
      if (!quickEditingComponent) return;
      
      const newPrice = parseFloat(document.getElementById('quickEditPrice').value);
      if (isNaN(newPrice) || newPrice < 0) {
          showToast('Please enter a valid price', 'error');
          return;
      }
      
      try {
          const response = await fetch(`/api/components/${quickEditingComponent.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  category_id: quickEditingComponent.category_id,
                  vendor_id: quickEditingComponent.vendor_id,
                  name: quickEditingComponent.name,
                  description: quickEditingComponent.description,
                  price: newPrice
              })
          });
          
          if (!response.ok) throw new Error('Failed to update price');
          
          // Close modal
          bootstrap.Modal.getInstance(document.getElementById('quickEditModal')).hide();
          
          // Refresh components
          await loadComponents();
          showToast('Price updated successfully');
          
          quickEditingComponent = null;
          
      } catch (error) {
          showToast('Error updating price', 'error');
      }
  }

  // Add keypress handler for quick edit modal
  document.addEventListener('DOMContentLoaded', () => {
      const quickEditModal = document.getElementById('quickEditModal');
      if (quickEditModal) {
          quickEditModal.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                  saveQuickEdit();
              }
          });
          
          // Auto-select price on modal show
          quickEditModal.addEventListener('shown.bs.modal', () => {
              document.getElementById('quickEditPrice').select();
          });
      }
  });