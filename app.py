from flask import Flask, request, jsonify, send_file, render_template, redirect
import sqlite3
from datetime import datetime
import os
import pandas as pd
from werkzeug.utils import secure_filename
from datetime import timedelta
import json
import csv

app = Flask(__name__, static_url_path='/static', static_folder='static')

# Database initialization
def init_db():
    with sqlite3.connect('invoices.db') as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS counters (
                type TEXT PRIMARY KEY,
                count INTEGER
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT,
                number TEXT UNIQUE,
                date TEXT,
                company_name TEXT,
                customer_name TEXT,
                items TEXT,
                tax REAL,
                total REAL,
                created_at TEXT
            )
        ''')
        
        # Create vendors table first
        conn.execute('''
            CREATE TABLE IF NOT EXISTS vendors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                email TEXT,
                phone TEXT,
                notes TEXT
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS components (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER,
                vendor_id INTEGER,
                name TEXT,
                description TEXT,
                price REAL,
                last_price_update TEXT,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (category_id) REFERENCES categories (id),
                FOREIGN KEY (vendor_id) REFERENCES vendors (id)
            )
        ''')
        
        # Initialize counters if they don't exist
        conn.execute('INSERT OR IGNORE INTO counters (type, count) VALUES (?, ?)', ('invoice', 0))
        conn.execute('INSERT OR IGNORE INTO counters (type, count) VALUES (?, ?)', ('quotation', 0))
        
        # Add some default categories if none exist
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM categories')
        if cursor.fetchone()[0] == 0:
            default_categories = [
                'Solar Panels',
                'Inverters',
                'Batteries',
                'Wiring'
            ]
            for category in default_categories:
                conn.execute('INSERT OR IGNORE INTO categories (name) VALUES (?)', (category,))
        
        # Add some default vendors
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM vendors')
        if cursor.fetchone()[0] == 0:
            default_vendors = [
                ('Direct Import', 'import@example.com', '+92123456789', 'Direct imports from manufacturers'),
                ('Local Distributor', 'local@example.com', '+9213456789', 'Local distribution partner'),
                ('Wholesale Market', 'wholesale@example.com', '+92123456789', 'Wholesale market rates')
            ]
            for vendor in default_vendors:
                conn.execute('INSERT INTO vendors (name, email, phone, notes) VALUES (?, ?, ?, ?)', vendor)

def get_db():
    db = sqlite3.connect('invoices.db')
    return db

def migrate_components():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Check if we need to migrate
            cursor.execute('SELECT COUNT(*) FROM components')
            if cursor.fetchone()[0] > 0:
                return  # Already have components, skip migration
            
            # Get the first vendor (Direct Import)
            cursor.execute('SELECT id FROM vendors WHERE name = ?', ('Direct Import',))
            vendor_id = cursor.fetchone()[0]
            
            # Get the old components from wherever they were stored
            default_components = {
                'Solar Panels': [
                    {'name': 'Jinko N-type Bifacial 585W', 'description': 'Premium Solar Panel', 'price': 17842.5},
                    {'name': 'Jinko N-type Bifacial 585W (Pallet)', 'description': 'Bulk Purchase Price', 'price': 17403.75},
                    {'name': 'Longi Himo X6 580W', 'description': 'Monofacial Panel', 'price': 16240},
                    {'name': 'Longi Himo X6 580W (Pallet)', 'description': 'Bulk Purchase Price', 'price': 15950},
                    {'name': 'Longi Himo X7 605W (Pallet)', 'description': 'High Power Panel - Bulk', 'price': 17847.5}
                ],
                'Inverters': [
                    {'name': 'Crown Xavier 3KW', 'description': 'Hybrid Inverter', 'price': 85000},
                    {'name': 'Knox inverter-5KW', 'description': 'Hybrid Inverter', 'price': 136000},
                    {'name': 'POWER SQUARE-6 KW', 'description': 'Hybrid Inverter', 'price': 139000}
                ],
                'Batteries': [
                    {'name': 'Dyness Lithium Battery 48V 100Ah', 'description': 'Lithium Battery System', 'price': 222000},
                    {'name': 'Phoenix-1800 Battery 185Ah', 'description': 'Lead Acid Battery', 'price': 45000},
                    {'name': 'AGS Battery 140Ah', 'description': 'Lead Acid Battery', 'price': 42000},
                    {'name': 'AGS Battery 90Ah', 'description': 'Lead Acid Battery', 'price': 35000}
                ],
                'Wiring': [
                    {'name': 'DC Wire 6mm', 'description': 'Solar DC Cable', 'price': 25000},
                    {'name': 'DC Wire 25mm', 'description': 'Heavy Duty Solar DC Cable', 'price': 89100},
                    {'name': 'Wire 7/44', 'description': 'Standard Cable', 'price': 28000}
                ]
            }
            
            # Insert components for each category
            for category_name, components in default_components.items():
                # Get category id
                cursor.execute('SELECT id FROM categories WHERE name = ?', (category_name,))
                category = cursor.fetchone()
                if not category:
                    # Create category if it doesn't exist
                    cursor.execute('INSERT INTO categories (name) VALUES (?)', (category_name,))
                    category_id = cursor.lastrowid
                else:
                    category_id = category[0]
                
                # Insert components
                for component in components:
                    cursor.execute('''
                        INSERT INTO components (category_id, vendor_id, name, description, price, last_price_update)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        category_id,
                        vendor_id,
                        component['name'],
                        component['description'],
                        component['price'],
                        datetime.now().isoformat()
                    ))
            
            conn.commit()
            print("Components migration completed successfully")
            
    except Exception as e:
        print(f"Error during migration: {e}")

init_db()
migrate_components()

# Add this near the top with other configurations
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Create exports directory if it doesn't exist
EXPORT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'invoices')
if not os.path.exists(EXPORT_FOLDER):
    os.makedirs(EXPORT_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def serve_app():
    return render_template('index.html')

@app.route('/records')
def serve_records():
    return render_template('records.html')

@app.route('/prices')
def serve_prices():
    return render_template('prices.html')

@app.route('/api/counter/<type>')
def get_counter(type):
    with sqlite3.connect('invoices.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT count FROM counters WHERE type = ?', (type,))
        result = cursor.fetchone()
        return jsonify({'count': result[0] if result else 0})

@app.route('/api/save', methods=['POST'])
def save_invoice():
    try:
        data = request.json
        doc_type = data['type']  # 'invoice' or 'quotation'
        
        with sqlite3.connect('invoices.db') as conn:
            cursor = conn.cursor()
            
            # Get the latest number for the specified document type
            cursor.execute(
                'SELECT number FROM invoices WHERE type = ? ORDER BY id DESC LIMIT 1',
                (doc_type,)
            )
            result = cursor.fetchone()

            if result:
                # Extract the number part and increment
                last_num = int(result[0].split('-')[1])
                next_num = last_num + 1
            else:
                # Start from 1 if no previous records
                next_num = 1

            # Format number (e.g., INV-001 or QT-001)
            prefix = 'INV' if doc_type == 'invoice' else 'QT'
            number = f"{prefix}-{next_num:03d}"
            
            # Save invoice/quotation
            cursor.execute('''
                INSERT INTO invoices (
                    type, number, date, company_name, customer_name,
                    items, tax, total, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                doc_type,
                number,
                data['date'],
                data['company_name'],
                data['customer_name'],
                data['items'],
                data['tax'],
                data['total'],
                datetime.now().isoformat()
            ))
            
            return jsonify({
                'success': True,
                'number': number
            })
    except Exception as e:
        print(f"Error saving document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/invoices')
def get_invoices():
    with sqlite3.connect('invoices.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM invoices 
            ORDER BY created_at DESC
        ''')
        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
        return jsonify(results)

@app.route('/api/invoices/<number>', methods=['DELETE'])
def delete_invoice(number):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM invoices WHERE number = ?', (number,))
            
            if cursor.rowcount == 0:
                return jsonify({'error': 'Record not found'}), 404
                
            return jsonify({'success': True})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/next-number/<doc_type>')
def get_next_number(doc_type):
    try:
        with sqlite3.connect('invoices.db') as conn:
            cursor = conn.cursor()
            # Get the latest number for the specified document type
            cursor.execute(
                'SELECT number FROM invoices WHERE type = ? ORDER BY id DESC LIMIT 1',
                (doc_type,)
            )
            result = cursor.fetchone()

            if result:
                # Extract the number part and increment
                last_num = int(result[0].split('-')[1])
                next_num = last_num + 1
            else:
                # Start from 1 if no previous records
                next_num = 1

            # Format: INV-001 or QT-001
            prefix = 'INV' if doc_type == 'invoice' else 'QT'
            next_number = f"{prefix}-{next_num:03d}"
            
            return jsonify({'number': next_number}), 200
    except Exception as e:
        print(f"Error getting next number: {e}")
        return jsonify({'error': 'Failed to get next number'}), 500

@app.route('/edit/<document_number>')
def edit_document(document_number):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM invoices WHERE number = ?', (document_number,))
            document = cursor.fetchone()
            
            if not document:
                return redirect('/records')
            
            return render_template('edit.html', document_number=document_number)
            
    except Exception as e:
        print(f"Error loading document: {e}")
        return redirect('/records')

@app.route('/api/document/<document_number>')
def get_document(document_number):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM invoices WHERE number = ?', (document_number,))
            record = cursor.fetchone()
            
            if record:
                # Convert row to dictionary
                columns = [desc[0] for desc in cursor.description]
                document = dict(zip(columns, record))
                return jsonify(document)
            else:
                return jsonify({'error': 'Document not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices/<number>', methods=['PUT'])
def update_invoice(number):
    try:
        data = request.json
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE invoices 
                SET customer_name = ?, date = ?, items = ?,
                    tax = ?, total = ?
                WHERE number = ?
            ''', (
                data['customer_name'],
                data['date'],
                data['items'],
                data['tax'],
                data['total'],
                number
            ))
            
            if cursor.rowcount > 0:
                return jsonify({'success': True})
            else:
                return jsonify({'error': 'Document not found'}), 404
                
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories')
def get_categories():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM categories ORDER BY name')
            categories = []
            for row in cursor.fetchall():
                categories.append({
                    'id': row[0],
                    'name': row[1]
                })
            return jsonify(categories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['POST'])
def add_category():
    try:
        data = request.json
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('INSERT INTO categories (name) VALUES (?)', (data['name'],))
            category_id = cursor.lastrowid
            return jsonify({
                'id': category_id,
                'name': data['name']
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/<int:id>/components')
def get_components(id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, name, description, price, category_id 
                FROM components 
                WHERE category_id = ?
            ''', (id,))
            components = []
            for row in cursor.fetchall():
                components.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'price': row[3],
                    'category_id': row[4]
                })
            return jsonify(components)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/<int:id>/components', methods=['POST'])
def add_component(id):
    try:
        data = request.json
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO components (category_id, vendor_id, name, description, price, last_price_update)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                id,
                data.get('vendor_id'),
                data['name'],
                data['description'],
                data['price'],
                datetime.now().isoformat()
            ))
            component_id = cursor.lastrowid
            return jsonify({
                'id': component_id,
                'category_id': id,
                'vendor_id': data.get('vendor_id'),
                'name': data['name'],
                'description': data['description'],
                'price': data['price']
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/components/<int:id>', methods=['DELETE'])
def delete_component(id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM components WHERE id = ?', (id,))
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM components WHERE category_id = ?', (id,))
            cursor.execute('DELETE FROM categories WHERE id = ?', (id,))
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/components')
def get_all_components():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT 
                    components.*,
                    categories.name as category_name,
                    vendors.name as vendor_name
                FROM components 
                JOIN categories ON components.category_id = categories.id
                LEFT JOIN vendors ON components.vendor_id = vendors.id
                WHERE components.is_active = 1
                ORDER BY categories.name, components.name
            ''')
            components = []
            for row in cursor.fetchall():
                components.append({
                    'id': row[0],
                    'category_id': row[1],
                    'vendor_id': row[2],
                    'name': row[3],
                    'description': row[4],
                    'price': row[5],
                    'last_price_update': row[6],
                    'is_active': row[7],
                    'category_name': row[8],
                    'vendor_name': row[9]
                })
            return jsonify(components)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/components/<int:id>', methods=['PUT'])
def update_component(id):
    try:
        data = request.json
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE components 
                SET category_id = ?, name = ?, description = ?, price = ?, updated_at = ?
                WHERE id = ?
            ''', (
                data['category_id'],
                data['name'],
                data['description'],
                data['price'],
                datetime.now().isoformat(),
                id
            ))
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/<int:id>/bulk-update', methods=['POST'])
def bulk_update_prices(id):
    try:
        data = request.json
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get all components in category
            cursor.execute('SELECT id, price FROM components WHERE category_id = ?', (id,))
            components = cursor.fetchall()
            
            for component_id, current_price in components:
                if data['type'] == 'percentage':
                    adjustment = current_price * (data['value'] / 100)
                else:
                    adjustment = data['value']
                    
                new_price = current_price + adjustment if data['direction'] == 'increase' else current_price - adjustment
                
                cursor.execute('''
                    UPDATE components 
                    SET price = ?, updated_at = ?
                    WHERE id = ?
                ''', (max(0, new_price), datetime.now().isoformat(), component_id))
            
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/import-components', methods=['POST'])
def import_components():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        category_id = request.form.get('category_id')
        
        if not file or not file.filename:
            return jsonify({'error': 'No file selected'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Read Excel file
            df = pd.read_excel(filepath)
            
            # Validate columns
            required_columns = ['Name', 'Description', 'Price']
            if not all(col in df.columns for col in required_columns):
                raise ValueError('Excel file must contain columns: Name, Description, Price')
            
            # Import components
            with get_db() as conn:
                cursor = conn.cursor()
                count = 0
                
                for _, row in df.iterrows():
                    cursor.execute('''
                        INSERT INTO components (category_id, name, description, price, updated_at)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        category_id,
                        str(row['Name']),
                        str(row['Description']),
                        float(row['Price']),
                        datetime.now().isoformat()
                    ))
                    count += 1
                
            return jsonify({'success': True, 'count': count})
            
        finally:
            # Clean up temporary file
            os.remove(filepath)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vendors')
def get_vendors():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM vendors ORDER BY name')
            vendors = []
            for row in cursor.fetchall():
                vendors.append({
                    'id': row[0],
                    'name': row[1],
                    'email': row[2],
                    'phone': row[3],
                    'notes': row[4]
                })
            return jsonify(vendors)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vendors', methods=['POST'])
def add_vendor():
    try:
        data = request.json
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO vendors (name, email, phone, notes)
                VALUES (?, ?, ?, ?)
            ''', (
                data['name'],
                data.get('email'),
                data.get('phone'),
                data.get('notes')
            ))
            return jsonify({
                'id': cursor.lastrowid,
                'name': data['name'],
                'email': data.get('email'),
                'phone': data.get('phone'),
                'notes': data.get('notes')
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vendors/<int:id>', methods=['PUT'])
def update_vendor(id):
    try:
        data = request.json
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE vendors 
                SET name = ?, email = ?, phone = ?, notes = ?
                WHERE id = ?
            ''', (
                data['name'],
                data.get('email'),
                data.get('phone'),
                data.get('notes'),
                id
            ))
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vendors/<int:id>', methods=['DELETE'])
def delete_vendor(id):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # Mark components as inactive instead of deleting them
            cursor.execute('''
                UPDATE components 
                SET is_active = 0 
                WHERE vendor_id = ?
            ''', (id,))
            cursor.execute('DELETE FROM vendors WHERE id = ?', (id,))
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/dashboard-stats')
def get_dashboard_stats():
    days = int(request.args.get('days', 30))
    start_date = datetime.now() - timedelta(days=days)
    previous_start = start_date - timedelta(days=days)  # For trend comparison
    
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get current period stats
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total) as total_revenue,
                    AVG(total) as avg_order_value
                FROM invoices 
                WHERE date >= ? AND type = 'invoice'
            ''', (start_date.isoformat(),))
            
            current_stats = cursor.fetchone()
            
            # Get previous period stats for trend calculation
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total) as total_revenue,
                    AVG(total) as avg_order_value
                FROM invoices 
                WHERE date >= ? AND date < ? AND type = 'invoice'
            ''', (previous_start.isoformat(), start_date.isoformat()))
            
            previous_stats = cursor.fetchone()
            
            # Calculate trends
            def calculate_trend(current, previous):
                if not previous or previous == 0:
                    return 0
                return ((current - previous) / previous) * 100
            
            revenue_trend = calculate_trend(current_stats[1] or 0, previous_stats[1] or 0)
            orders_trend = calculate_trend(current_stats[0] or 0, previous_stats[0] or 0)
            avg_value_trend = calculate_trend(current_stats[2] or 0, previous_stats[2] or 0)
            
            # Get component and vendor counts
            cursor.execute('SELECT COUNT(*) FROM components WHERE is_active = 1')
            active_components = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM vendors')
            vendor_count = cursor.fetchone()[0]
            
            # Get revenue trend data
            cursor.execute('''
                SELECT 
                    date,
                    SUM(total) as daily_revenue
                FROM invoices
                WHERE date >= ? AND type = 'invoice'
                GROUP BY date
                ORDER BY date
            ''', (start_date.isoformat(),))
            
            revenue_data = cursor.fetchall()
            
            # Get category distribution
            cursor.execute('''
                SELECT 
                    c.name as category,
                    COUNT(DISTINCT i.id) as order_count,
                    SUM(i.total) as category_revenue
                FROM invoices i
                JOIN json_each(i.items) items
                JOIN components comp ON json_extract(items.value, '$.id') = comp.id
                JOIN categories c ON comp.category_id = c.id
                WHERE i.date >= ? AND i.type = 'invoice'
                GROUP BY c.name
                ORDER BY category_revenue DESC
            ''', (start_date.isoformat(),))
            
            category_data = cursor.fetchall()
            
            # Get recent price updates
            cursor.execute('''
                SELECT 
                    c.name as component,
                    v.name as vendor,
                    c.price as new_price,
                    c.last_price_update,
                    c.price as current_price
                FROM components c
                JOIN vendors v ON c.vendor_id = v.id
                WHERE c.is_active = 1
                ORDER BY c.last_price_update DESC
                LIMIT 5
            ''')
            
            price_updates = cursor.fetchall()
            
            # Get top components by revenue
            cursor.execute('''
                SELECT 
                    comp.name as component,
                    cat.name as category,
                    COUNT(*) as units_sold,
                    SUM(json_extract(items.value, '$.price') * json_extract(items.value, '$.quantity')) as revenue
                FROM invoices i
                JOIN json_each(i.items) items
                JOIN components comp ON json_extract(items.value, '$.id') = comp.id
                JOIN categories cat ON comp.category_id = cat.id
                WHERE i.date >= ? AND i.type = 'invoice'
                GROUP BY comp.id
                ORDER BY revenue DESC
                LIMIT 5
            ''', (start_date.isoformat(),))
            
            top_components = cursor.fetchall()
            
            return jsonify({
                'stats': {
                    'totalOrders': current_stats[0] or 0,
                    'totalRevenue': current_stats[1] or 0,
                    'avgOrderValue': current_stats[2] or 0,
                    'activeComponents': active_components,
                    'vendorCount': vendor_count,
                    'trends': {
                        'revenue': revenue_trend,
                        'orders': orders_trend,
                        'avgValue': avg_value_trend
                    }
                },
                'charts': {
                    'revenue': {
                        'labels': [row[0] for row in revenue_data],
                        'data': [row[1] for row in revenue_data]
                    },
                    'categories': {
                        'labels': [row[0] for row in category_data],
                        'data': [row[2] for row in category_data]
                    }
                },
                'tables': {
                    'priceUpdates': [{
                        'component': row[0],
                        'vendor': row[1],
                        'price': row[2],
                        'updated': row[3],
                        'currentPrice': row[4]
                    } for row in price_updates],
                    'topComponents': [{
                        'name': row[0],
                        'category': row[1],
                        'unitsSold': row[2],
                        'revenue': row[3]
                    } for row in top_components]
                }
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices', methods=['POST'])
def create_invoice():
    try:
        data = request.json
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get next invoice number
            cursor.execute('SELECT count FROM counters WHERE type = ?', (data['type'],))
            current_count = cursor.fetchone()[0] + 1
            
            # Update counter
            cursor.execute('UPDATE counters SET count = ? WHERE type = ?', (current_count, data['type']))
            
            # Generate invoice number
            invoice_number = f"{data['type'].upper()}-{current_count:04d}"
            
            # Insert invoice
            cursor.execute('''
                INSERT INTO invoices (
                    type, number, date, company_name, customer_name, 
                    items, tax, total, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['type'],
                invoice_number,
                data['date'],
                data['company_name'],
                data['customer_name'],
                json.dumps(data['items']),
                data['tax'],
                data['total'],
                datetime.now().isoformat()
            ))
            
            return jsonify({
                'success': True,
                'invoice_number': invoice_number
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export-records')
def export_records():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get all records
            cursor.execute('''
                SELECT 
                    number,
                    type,
                    date,
                    company_name,
                    customer_name,
                    total,
                    created_at
                FROM invoices
                ORDER BY created_at DESC
            ''')
            
            records = cursor.fetchall()
            
            # Create CSV file
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'records_export_{timestamp}.csv'
            filepath = os.path.join(EXPORT_FOLDER, filename)
            
            with open(filepath, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                # Write headers
                writer.writerow([
                    'Document Number',
                    'Type',
                    'Date',
                    'Company',
                    'Customer',
                    'Total Amount',
                    'Created At'
                ])
                # Write data
                for record in records:
                    writer.writerow([
                        record[0],
                        record[1].capitalize(),
                        record[2],
                        record[3],
                        record[4],
                        f"Rs. {record[5]:,.2f}",
                        datetime.fromisoformat(record[6]).strftime('%Y-%m-%d %H:%M:%S')
                    ])
            
            return send_file(
                filepath,
                mimetype='text/csv',
                as_attachment=True,
                download_name=filename
            )
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001) 