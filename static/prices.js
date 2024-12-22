let components = [];
let categories = [];
let vendors = [];
let editingComponent = null;
let editingVendor = null;
let currentView = 'grid';
let quickEditingComponent = null;
let selectedComponents = new Set();
let importData = {
    sheets: [],
    columns: [],
    preview: [],
    selectedSheet: null
};

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
    document.getElementById('searchInput').addEventListener('input', () => {
        displayComponents();
        updateFilterStats();
    });
    
    document.getElementById('categoryFilter').addEventListener('change', () => {
        displayComponents();
        updateFilterStats();
    });
    
    document.getElementById('sortBy').addEventListener('change', () => {
        displayComponents();
    });
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
        
        const currentValue = select.value;
        
        select.innerHTML = selectId === 'categoryFilter' 
            ? `
                <option value="">All Categories</option>
                <option value="uncategorized">Uncategorized</option>
            `
            : '<option value="">Select Category</option>';
            
        categories.forEach(category => {
            select.innerHTML += `
                <option value="${category.id}">${category.name}</option>
            `;
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

// Load all components
async function loadComponents() {
    try {
        const response = await fetch('/api/components');
        if (!response.ok) throw new Error('Failed to load components');
        
        components = await response.json();
        
        // Display components with current filters
        displayComponents();
        updateFilterStats();
        
    } catch (error) {
        console.error('Error loading components:', error);
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
    
    // Group components by category
    const groupedComponents = components.reduce((acc, comp) => {
        const categoryName = comp.category_name || 'Uncategorized';
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(comp);
        return acc;
    }, {});
    
    // Display each category group
    Object.entries(groupedComponents).forEach(([category, comps]) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'col-12 mb-4';
        categorySection.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">${category}</h5>
                ${category === 'Uncategorized' ? `
                    <button class="btn btn-sm btn-outline-primary" onclick="showCategoryAssignModal()">
                        <i class="bi bi-folder-plus"></i> Assign Categories
                    </button>
                ` : ''}
            </div>
            <div class="row g-3">
                ${comps.map(comp => generateComponentCard(comp)).join('')}
            </div>
        `;
        grid.appendChild(categorySection);
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
        tr.className = 'component-row';
        tr.dataset.id = component.id;
        tr.innerHTML = `
            <td class="text-center">
                <div class="form-check">
                    <input class="form-check-input component-checkbox" type="checkbox" 
                           value="${component.id}" onchange="handleComponentSelection(this)">
                </div>
            </td>
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
        
        // Add click handler for the entire row
        tr.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons or checkboxes
            if (!e.target.closest('button') && !e.target.closest('.form-check')) {
                const checkbox = tr.querySelector('.component-checkbox');
                checkbox.checked = !checkbox.checked;
                handleComponentSelection(checkbox);
            }
        });
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
            (component.description || '').toLowerCase().includes(searchTerm);
        
        let matchesCategory = true;
        if (categoryId === 'uncategorized') {
            matchesCategory = !component.category_id || component.category_id === null;
        } else if (categoryId) {
            matchesCategory = component.category_id === parseInt(categoryId, 10);
        }
        
        const matchesVendor = !vendorId || component.vendor_id === parseInt(vendorId, 10);
        
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
    
    // Ensure vendors are loaded in the dropdown
    populateVendorSelects();
    
    // Pre-select current vendor if one is active
    const activeVendorId = document.getElementById('activeVendor').value;
    if (activeVendorId) {
        document.getElementById('importVendor').value = activeVendorId;
    }
    
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
      
      // Ensure vendors are loaded in the dropdown
      populateVendorSelects();
      
      // Pre-select current vendor if one is active
      const activeVendorId = document.getElementById('activeVendor').value;
      if (activeVendorId) {
          document.getElementById('importVendor').value = activeVendorId;
      }
      
      modal.show();
  }

  // Import Excel file
  async function importComponents() {
      try {
          const vendorId = document.getElementById('importVendor').value;
          const file = document.getElementById('importFile').files[0];
          
          if (!vendorId) {
              showToast('Please select a vendor', 'error');
              return;
          }
          
          if (!file) {
              showToast('Please select a file', 'error');
              return;
          }
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('vendor_id', vendorId);
          
          const response = await fetch('/api/import-components', {
              method: 'POST',
              body: formData
          });
          
          if (!response.ok) throw new Error('Failed to import components');
          
          const result = await response.json();
          
          // Close modal and show success message
          const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
          modal.hide();
          
          showToast(`Successfully imported ${result.count} components`);
          
          // Refresh components list
          loadComponents();
          
      } catch (error) {
          console.error('Error importing components:', error);
          showToast('Error importing components', 'error');
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
      const selects = ['activeVendor', 'componentVendor', 'importVendor'];
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
      const statsBar = document.getElementById('vendorStats');
      
      const vendorComponents = components.filter(c => c.vendor_id === parseInt(vendorId));
      
      if (!vendor || vendorComponents.length === 0) {
          statsBar.classList.add('d-none');
          return;
      }
      
      statsBar.classList.remove('d-none');
      document.getElementById('vendorTotalComponents').textContent = vendorComponents.length;
      
      const lastUpdated = vendorComponents.length > 0 
          ? new Date(Math.max(...vendorComponents.map(c => new Date(c.last_price_update))))
          : null;
      
      document.getElementById('vendorLastUpdated').textContent = 
          lastUpdated ? lastUpdated.toLocaleDateString() : '-';
      
      document.getElementById('vendorContact').innerHTML = `
          ${vendor.email ? `<i class="bi bi-envelope me-1"></i>${vendor.email}` : ''}
          ${vendor.phone ? `<span class="ms-3"><i class="bi bi-telephone me-1"></i>${vendor.phone}</span>` : ''}
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
      
      // Clear any existing selection
      clearSelection();
      
      // Refresh display
      displayComponents();
  }

  // Initialize view on page load
  document.addEventListener('DOMContentLoaded', () => {
      // Load saved view preference
      const savedView = localStorage.getItem('componentsView');
      if (savedView) {
          switchView(savedView);
      }

      // Add click handlers to view buttons
      document.querySelectorAll('[data-view]').forEach(btn => {
          btn.addEventListener('click', (e) => {
              e.preventDefault();
              switchView(btn.dataset.view);
          });
      });
  });

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

  // Generate component card HTML
  function generateComponentCard(component) {
      return `
          <div class="col-md-6 col-lg-3">
              <div class="card price-card h-100" onclick="toggleCardSelection(this, ${component.id})" data-id="${component.id}">
                  <div class="card-header">
                      <div class="form-check position-absolute top-0 end-0 mt-2 me-2">
                          <input class="form-check-input component-checkbox" type="checkbox" 
                                 value="${component.id}" 
                                 onchange="handleComponentSelection(this, event)"
                                 onclick="event.stopPropagation()">
                      </div>
                      <div class="d-flex gap-1 mb-2">
                          <div class="badges d-flex flex-wrap gap-1">
                              <span class="badge bg-primary category-badge" title="Category">
                                  <i class="bi bi-tag-fill me-1"></i>${component.category_name}
                              </span>
                              <span class="badge vendor-badge" title="Vendor">
                                  <i class="bi bi-building-fill me-1"></i>${component.vendor_name || 'No Vendor'}
                              </span>
                          </div>
                      </div>
                      <h5 class="card-title mb-0 text-truncate fw-semibold" title="${component.name}">
                          ${component.name}
                      </h5>
                  </div>
                  <div class="card-body">
                      <p class="component-description mb-3">
                          ${component.description || 'No description'}
                      </p>
                      <div class="price-section">
                          <div class="d-flex justify-content-between align-items-end mb-2">
                              <div>
                                  <div class="price-label">Price</div>
                                  <div class="price-value">Rs. ${component.price.toLocaleString()}</div>
                              </div>
                              <div class="last-updated text-end">
                                  Last updated
                                  ${new Date(component.last_price_update || Date.now()).toLocaleDateString()}
                              </div>
                          </div>
                      </div>
                  </div>
                  <div class="card-footer">
                      <div class="d-flex justify-content-between">
                          <button onclick="quickEdit(${component.id}); event.stopPropagation();" 
                                  class="btn btn-sm btn-outline-primary flex-grow-1 me-2">
                              <i class="bi bi-pencil-square"></i> Quick Edit
                          </button>
                          <div class="dropdown">
                              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                      data-bs-toggle="dropdown" onclick="event.stopPropagation();">
                                  <i class="bi bi-three-dots-vertical"></i>
                              </button>
                              <ul class="dropdown-menu dropdown-menu-end">
                                  <li>
                                      <a class="dropdown-item" href="#" 
                                         onclick="event.preventDefault(); editComponent(${component.id})">
                                          <i class="bi bi-pencil"></i> Full Edit
                                      </a>
                                  </li>
                                  <li>
                                      <a class="dropdown-item" href="#" 
                                         onclick="event.preventDefault(); duplicateComponent(${component.id})">
                                          <i class="bi bi-copy"></i> Duplicate
                                      </a>
                                  </li>
                                  <li><hr class="dropdown-divider"></li>
                                  <li>
                                      <a class="dropdown-item text-danger" href="#" 
                                         onclick="event.preventDefault(); deleteComponent(${component.id})">
                                          <i class="bi bi-trash"></i> Delete
                                      </a>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `;
  }

  // Toggle card selection
  function toggleCardSelection(card, componentId) {
      const checkbox = card.querySelector('.component-checkbox');
      checkbox.checked = !checkbox.checked;
      handleComponentSelection(checkbox);
      card.classList.toggle('selected', checkbox.checked);
  }

  // Handle component selection
  function handleComponentSelection(checkbox, event) {
      if (event) event.stopPropagation();
      
      const componentId = parseInt(checkbox.value);
      const isChecked = checkbox.checked;
      
      // Update selected components set
      if (isChecked) {
          selectedComponents.add(componentId);
      } else {
          selectedComponents.delete(componentId);
      }
      
      // Update UI
      const container = checkbox.closest('.price-card, .component-row');
      if (container) {
          container.classList.toggle('selected', isChecked);
      }
      
      updateMassActionToolbar();
  }

  // Toggle select all
  function toggleSelectAll(checkbox, sourceView) {
      // Get checkboxes from the current view only
      const viewContainer = document.getElementById(currentView === 'grid' ? 'gridView' : 'listView');
      const componentCheckboxes = viewContainer.querySelectorAll('.component-checkbox');
      
      componentCheckboxes.forEach(cb => {
          cb.checked = checkbox.checked;
          const componentId = parseInt(cb.value);
          if (checkbox.checked) {
              selectedComponents.add(componentId);
              cb.closest('.price-card, .component-row')?.classList.add('selected');
          } else {
              selectedComponents.delete(componentId);
              cb.closest('.price-card, .component-row')?.classList.remove('selected');
          }
      });
      
      // Sync both select all checkboxes
      const gridSelectAll = document.getElementById('selectAllCheckbox');
      const listSelectAll = document.getElementById('listSelectAll');
      gridSelectAll.checked = checkbox.checked;
      listSelectAll.checked = checkbox.checked;
      gridSelectAll.indeterminate = false;
      listSelectAll.indeterminate = false;
      
      updateMassActionToolbar();
  }

  // Update mass action toolbar
  function updateMassActionToolbar() {
      const toolbar = document.getElementById('massActionToolbar');
      const selectedCount = selectedComponents.size;
      const viewContainer = document.getElementById(currentView === 'grid' ? 'gridView' : 'listView');
      const componentCheckboxes = viewContainer.querySelectorAll('.component-checkbox');
      const totalComponents = componentCheckboxes.length;
      
      if (selectedCount > 0) {
          toolbar.classList.remove('d-none');
          toolbar.querySelector('.selected-count').textContent = 
              `${selectedCount} item${selectedCount === 1 ? '' : 's'} selected`;
          
          // Update both select all checkboxes
          const gridSelectAll = document.getElementById('selectAllCheckbox');
          const listSelectAll = document.getElementById('listSelectAll');
          const isAllSelected = selectedCount === totalComponents;
          const isPartiallySelected = selectedCount > 0 && selectedCount < totalComponents;
          
          gridSelectAll.checked = isAllSelected;
          listSelectAll.checked = isAllSelected;
          gridSelectAll.indeterminate = isPartiallySelected;
          listSelectAll.indeterminate = isPartiallySelected;
      } else {
          toolbar.classList.add('d-none');
          const gridSelectAll = document.getElementById('selectAllCheckbox');
          const listSelectAll = document.getElementById('listSelectAll');
          gridSelectAll.checked = false;
          listSelectAll.checked = false;
          gridSelectAll.indeterminate = false;
          listSelectAll.indeterminate = false;
      }
  }

  // Clear selection
  function clearSelection() {
      selectedComponents.clear();
      document.querySelectorAll('.component-checkbox').forEach(checkbox => {
          checkbox.checked = false;
          const container = checkbox.closest('.price-card, .component-row');
          if (container) {
              container.classList.remove('selected');
          }
      });
      document.getElementById('listSelectAll').checked = false;
      document.getElementById('listSelectAll').indeterminate = false;
      document.getElementById('selectAllCheckbox').checked = false;
      document.getElementById('selectAllCheckbox').indeterminate = false;
      updateMassActionToolbar();
  }

  // Delete selected components
  async function deleteSelectedComponents() {
      if (selectedComponents.size === 0) return;
      
      if (!confirm(`Are you sure you want to delete ${selectedComponents.size} component(s)?`)) {
          return;
      }
      
      try {
          const response = await fetch('/api/components/bulk-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  componentIds: Array.from(selectedComponents)
              })
          });
          
          if (!response.ok) throw new Error('Failed to delete components');
          
          showToast(`Successfully deleted ${selectedComponents.size} component(s)`);
          selectedComponents.clear();
          updateMassActionToolbar();
          await loadComponents();
          
      } catch (error) {
          console.error('Error deleting components:', error);
          showToast('Error deleting components', 'error');
      }
  }

  // Reset selection when filters change
  document.addEventListener('DOMContentLoaded', () => {
      ['searchInput', 'categoryFilter', 'activeVendor'].forEach(id => {
          document.getElementById(id)?.addEventListener('change', clearSelection);
      });
  });

  // Show specific import step
  function showStep(stepNumber) {
      document.querySelectorAll('.step').forEach(step => step.classList.add('d-none'));
      document.getElementById(`step${stepNumber}`).classList.remove('d-none');
  }

  // Handle file selection and sheet loading
  document.getElementById('importFile').addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/excel/sheets', {
              method: 'POST',
              body: formData
          });
          
          if (!response.ok) throw new Error('Failed to read file');
          
          const result = await response.json();
          importData.sheets = result.sheets;
          
          // Populate sheet select
          const sheetSelect = document.getElementById('sheetSelect');
          sheetSelect.innerHTML = result.sheets.map(sheet => 
              `<option value="${sheet}">${sheet}</option>`
          ).join('');
          sheetSelect.disabled = false;
          
      } catch (error) {
          showToast('Error reading Excel file', 'error');
      }
  });

  // Preview sheet data and setup column mapping
  async function previewSheet() {
      const file = document.getElementById('importFile').files[0];
      const sheet = document.getElementById('sheetSelect').value;
      
      if (!file || !sheet) {
          showToast('Please select a file and sheet', 'error');
          return;
      }
      
      try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('sheet', sheet);
          
          const response = await fetch('/api/excel/preview', {
              method: 'POST',
              body: formData
          });
          
          if (!response.ok) throw new Error('Failed to preview sheet');
          
          const result = await response.json();
          importData.columns = result.columns;
          importData.preview = result.preview;
          
          // Populate column mapping selects
          const columnOptions = ['<option value="">Select Column</option>']
              .concat(importData.columns.map(col => 
                  `<option value="${col}">${col}</option>`
              ));
              
          document.querySelectorAll('.column-map').forEach(select => {
              select.innerHTML = columnOptions.join('');
          });
          
          // Show preview table
          updatePreviewTable();
          
          // Show step 2
          showStep(2);
          
      } catch (error) {
          showToast('Error previewing data', 'error');
      }
  }

  // Update preview table
  function updatePreviewTable() {
      const table = document.getElementById('previewTable');
      table.innerHTML = `
          <thead>
              <tr>
                  ${importData.columns.map(col => `<th>${col}</th>`).join('')}
              </tr>
          </thead>
          <tbody>
              ${importData.preview.map(row => `
                  <tr>
                      ${importData.columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                  </tr>
              `).join('')}
          </tbody>
      `;
      
      // Update preview cells
      document.querySelectorAll('.column-map').forEach(select => {
          const field = select.dataset.field;
          const previewCell = select.closest('tr').querySelector('.preview-cell');
          
          select.addEventListener('change', () => {
              const selectedColumn = select.value;
              if (selectedColumn && importData.preview.length > 0) {
                  const sampleValues = importData.preview
                      .slice(0, 3)
                      .map(row => row[selectedColumn])
                      .filter(val => val)
                      .join(', ');
                  previewCell.textContent = sampleValues;
              } else {
                  previewCell.textContent = '';
              }
          });
      });
  }

  // Import mapped data
  async function importMappedData() {
      const mapping = {};
      document.querySelectorAll('.column-map').forEach(select => {
          mapping[select.dataset.field] = select.value;
      });
      
      // Validate required fields
      if (!mapping.name || !mapping.price) {
          showToast('Name and Price mappings are required', 'error');
          return;
      }
      
      const vendorId = document.getElementById('importVendor').value;
      if (!vendorId) {
          showToast('Please select a vendor', 'error');
          return;
      }
      
      try {
          const formData = new FormData();
          formData.append('file', document.getElementById('importFile').files[0]);
          formData.append('sheet', document.getElementById('sheetSelect').value);
          formData.append('mapping', JSON.stringify(mapping));
          formData.append('vendor_id', vendorId);
          
          const response = await fetch('/api/import-components', {
              method: 'POST',
              body: formData
          });
          
          if (!response.ok) throw new Error('Failed to import data');
          
          const result = await response.json();
          bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
          showToast(`Successfully imported ${result.count} components`);
          loadComponents();
          
      } catch (error) {
          showToast('Error importing data', 'error');
      }
  }

  // Update filter statistics
  function updateFilterStats() {
      const filtered = filterComponentsList();
      const categoryFilter = document.getElementById('categoryFilter');
      const selectedCategory = categoryFilter.options[categoryFilter.selectedIndex].text;
      
      const statsHtml = `
          <small class="text-muted ms-2">
              (${filtered.length} item${filtered.length !== 1 ? 's' : ''} 
              ${categoryFilter.value ? `in ${selectedCategory}` : 'total'})
          </small>
      `;
  }

  // Show category management modal
  function showCategoryModal() {
      const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
      loadCategoriesTable();
      modal.show();
  }

  // Load categories table
  async function loadCategoriesTable() {
      try {
          const response = await fetch('/api/categories/details');
          if (!response.ok) throw new Error('Failed to load categories');
          
          const categories = await response.json();
          const tbody = document.getElementById('categoriesTableBody');
          tbody.innerHTML = categories.map(category => `
              <tr>
                  <td>
                      <span class="category-name">${category.name}</span>
                      <input type="text" class="form-control d-none category-edit" 
                             value="${category.name}">
                  </td>
                  <td>${category.component_count} components</td>
                  <td>
                      <div class="btn-group btn-group-sm">
                          <button onclick="toggleEditCategory(${category.id})" 
                                  class="btn btn-outline-primary edit-btn">
                              <i class="bi bi-pencil"></i>
                          </button>
                          <button onclick="saveCategory(${category.id})" 
                                  class="btn btn-outline-success d-none save-btn">
                              <i class="bi bi-check"></i>
                          </button>
                          <button onclick="deleteCategory(${category.id})" 
                                  class="btn btn-outline-danger"
                                  ${category.component_count > 0 ? 'disabled' : ''}>
                              <i class="bi bi-trash"></i>
                          </button>
                      </div>
                  </td>
              </tr>
          `).join('');
          
          // Update merge category selects
          const selects = ['sourceCategory', 'targetCategory'];
          selects.forEach(selectId => {
              const select = document.getElementById(selectId);
              select.innerHTML = '<option value="">Select Category</option>' +
                  categories.map(cat => 
                      `<option value="${cat.id}">${cat.name}</option>`
                  ).join('');
          });
          
      } catch (error) {
          showToast('Error loading categories', 'error');
      }
  }

  // Add new category
  async function addCategory() {
      const nameInput = document.getElementById('categoryName');
      const name = nameInput.value.trim();
      
      if (!name) {
          showToast('Please enter a category name', 'error');
          return;
      }
      
      try {
          const response = await fetch('/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name })
          });
          
          if (!response.ok) throw new Error('Failed to add category');
          
          nameInput.value = '';
          await loadCategoriesTable();
          await loadCategories();  // Refresh all category lists
          showToast('Category added successfully');
          
      } catch (error) {
          showToast('Error adding category', 'error');
      }
  }

  // Toggle category edit mode
  function toggleEditCategory(categoryId) {
      const row = document.querySelector(`tr[data-category="${categoryId}"]`);
      row.querySelector('.category-name').classList.toggle('d-none');
      row.querySelector('.category-edit').classList.toggle('d-none');
      row.querySelector('.edit-btn').classList.toggle('d-none');
      row.querySelector('.save-btn').classList.toggle('d-none');
  }

  // Save category edit
  async function saveCategory(categoryId) {
      const row = document.querySelector(`tr[data-category="${categoryId}"]`);
      const newName = row.querySelector('.category-edit').value.trim();
      
      if (!newName) {
          showToast('Category name cannot be empty', 'error');
          return;
      }
      
      try {
          const response = await fetch(`/api/categories/${categoryId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newName })
          });
          
          if (!response.ok) throw new Error('Failed to update category');
          
          await loadCategoriesTable();
          await loadCategories();
          showToast('Category updated successfully');
          
      } catch (error) {
          showToast('Error updating category', 'error');
      }
  }

  // Delete category
  async function deleteCategory(categoryId) {
      if (!confirm('Are you sure you want to delete this category?')) return;
      
      try {
          const response = await fetch(`/api/categories/${categoryId}`, {
              method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('Failed to delete category');
          
          await loadCategoriesTable();
          await loadCategories();
          showToast('Category deleted successfully');
          
      } catch (error) {
          showToast('Error deleting category', 'error');
      }
  }

  // Merge categories
  async function mergeCategories() {
      const sourceId = document.getElementById('sourceCategory').value;
      const targetId = document.getElementById('targetCategory').value;
      
      if (!sourceId || !targetId || sourceId === targetId) {
          showToast('Please select different source and target categories', 'error');
          return;
      }
      
      if (!confirm('Are you sure you want to merge these categories? This cannot be undone.')) {
          return;
      }
      
      try {
          const response = await fetch('/api/categories/merge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  source_id: sourceId,
                  target_id: targetId
              })
          });
          
          if (!response.ok) throw new Error('Failed to merge categories');
          
          await loadCategoriesTable();
          await loadCategories();
          showToast('Categories merged successfully');
          
      } catch (error) {
          showToast('Error merging categories', 'error');
      }
  }