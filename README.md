# Solar System Invoice Generator

A web-based application for generating and managing invoices and quotations for solar system installations. Built with Flask and Bootstrap, this application helps streamline the process of creating, tracking, and managing solar system sales and installations.

## Features

### 1. Invoice Management
- Create professional invoices and quotations
- Automatic document numbering
- Print-ready document generation
- Save and retrieve documents
- Customer information management

### 2. Component Management
- Maintain component catalog
- Track prices and updates
- Categorize components (Panels, Inverters, Batteries, etc.)
- Vendor management
- Bulk price updates

### 3. Dashboard Analytics
- Revenue tracking and trends
- Order statistics
- Top-performing components
- Category-wise sales analysis
- Recent price updates monitoring

### 4. Records System
- Search and filter documents
- View document history
- Export records to CSV
- Document status tracking

## Technology Stack

- **Backend**: Python/Flask
- **Database**: SQLite
- **Frontend**: 
  - HTML5/CSS3
  - Bootstrap 5
  - JavaScript
  - Chart.js for analytics
- **Icons**: Bootstrap Icons

## Installation

1. Clone the repository: 
```bash
git clone https://github.com/bashalog/solar-invoice-generator.git
cd solar-invoice-generator
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database:
```bash
python app.py
```

5. Run the application:
```bash
flask run --port=5001
```

The application will be available at `http://localhost:5001`

## Project Structure

```
solar-invoice-generator/
├── app.py              # Main application file
├── static/
│   ├── styles.css      # Global styles
│   ├── script.js       # Main JavaScript file
│   └── dashboard.js    # Dashboard specific JavaScript
├── templates/
│   ├── base.html       # Base template
│   ├── index.html      # Invoice creation page
│   ├── records.html    # Records management
│   ├── prices.html     # Price management
│   └── dashboard.html  # Analytics dashboard
├── invoices.db         # SQLite database
└── requirements.txt    # Python dependencies
```

## Database Schema

### Tables
1. **invoices**
   - Document management (invoices and quotations)
   - Customer information
   - Items and pricing

2. **components**
   - Component catalog
   - Pricing information
   - Category and vendor relationships

3. **categories**
   - Component categorization

4. **vendors**
   - Vendor management
   - Contact information

5. **counters**
   - Document numbering system

## Usage

### Creating an Invoice/Quotation
1. Navigate to "Home"
2. Select document type (Invoice/Quotation)
3. Enter customer details
4. Add components from the catalog
5. Adjust quantities if needed
6. Preview and save/print the document

### Managing Prices
1. Go to "Prices" section
2. View and filter components
3. Update prices individually or in bulk
4. Track price history

### Viewing Analytics
1. Access the "Dashboard"
2. View revenue trends
3. Monitor sales performance
4. Track component popularity
5. Analyze category distribution

### Managing Records
1. Go to "Records" section
2. View all invoices and quotations
3. Search and filter documents
4. Export records to CSV (saved in 'invoices' folder)
5. View individual documents

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@bashalog.com or open an issue in the repository.

## Screenshots

Coming soon...