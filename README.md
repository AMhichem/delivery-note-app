# DeliverPro - Bon de Livraison Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-5.0-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-3.0-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/CSS)

A modern, web-based delivery note (Bon de Livraison) management system designed for Algerian businesses. Built with vanilla JavaScript, featuring user accounts, Excel import, and professional PDF-ready documents.

![DeliverPro Screenshot](https://via.placeholder.com/800x400/1a56db/ffffff?text=DeliverPro+Dashboard)

## ✨ Features

### 🔐 User Management
- **Secure Authentication**: User registration and login system
- **Session Management**: Persistent login sessions with localStorage
- **Multi-user Support**: Each user has their own data space

### 📊 Dashboard
- **Real-time Statistics**: Monthly BL count, revenue, products, and clients
- **Recent Activity**: Quick access to recent delivery notes
- **Visual Analytics**: Clean, professional dashboard interface

### 📄 Bon de Livraison (BL) Management
- **Auto-numbering**: Automatic BL numbering (BL-2026-001 format)
- **Rich Form Editor**: Client details, delivery address, items, notes
- **Dynamic Calculations**: Automatic subtotal, TVA, and total calculations
- **Auto-save**: Drafts saved automatically as you type
- **Print-ready**: Professional layout optimized for printing

### 📤 Excel Import
- **Bulk Product Import**: Upload Excel/CSV files to populate product database
- **Flexible Format**: Supports multiple column headers (Désignation/Description, Prix/Price)
- **Data Validation**: Automatic filtering of invalid entries

### 📋 History & Search
- **Complete Archive**: All BLs stored with full search capability
- **Advanced Filtering**: Filter by month, client, or BL number
- **Quick Actions**: Edit, print, or delete BLs directly from history

### 🛍️ Product Management
- **Product Database**: Centralized product catalog per user
- **Manual Entry**: Add products individually
- **Excel Import**: Bulk import from spreadsheets
- **Search & Filter**: Easy product lookup with search functionality

### ⚙️ Settings
- **Company Information**: Customize company name, address, contact details
- **BL Preferences**: Set default TVA rate, BL prefix, currency
- **Footer Notes**: Add custom footer text to all BLs

### 🖨️ Print & Export
- **Professional Layout**: Print-ready BL documents with company branding
- **PDF Export**: Export to PDF for sharing
- **Signature Areas**: Designated spaces for signatures
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for file upload functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/deliverpro.git
   cd deliverpro
   ```

2. **Start a local server**
   ```bash
   # Using Python (recommended)
   python -m http.server 8000

   # Or using Node.js
   npx http-server -p 8000

   # Or using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📖 Usage Guide

### First Time Setup
1. **Create Account**: Click "Créer un compte" and fill in your details
2. **Login**: Use your credentials to access the application
3. **Configure Settings**: Go to Settings to add your company information

### Importing Products
1. **Prepare Excel File**: Create a spreadsheet with columns:
   - `Désignation` or `Description` (Product name)
   - `Prix` or `Price` (Unit price in DA)
2. **Upload**: Go to Products → Import Excel
3. **Select File**: Choose your Excel/CSV file

### Creating a BL
1. **New BL**: Click "Nouveau BL" from dashboard or sidebar
2. **Fill Details**: Enter client info, delivery address, date
3. **Add Products**: Search and select products, enter quantities
4. **Review Totals**: TVA and totals calculated automatically
5. **Print/Export**: Use Print button or Export PDF

### Managing History
- **View All BLs**: Access History from sidebar
- **Search**: Use search bar to find specific BLs
- **Filter**: Filter by month using dropdown
- **Actions**: Edit, print, or delete BLs

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Libraries**:
  - [SheetJS (xlsx)](https://sheetjs.com/) - Excel file parsing
  - [jQuery](https://jquery.com/) - DOM manipulation
  - [Select2](https://select2.org/) - Enhanced dropdowns
- **Fonts**: [Google Fonts](https://fonts.google.com/) (DM Serif Display, DM Sans)
- **Storage**: Browser localStorage (client-side)
- **Icons**: Unicode emoji and custom CSS

## 📁 Project Structure

```
deliverpro/
├── index.html          # Main application HTML
├── script.js           # Application logic and functionality
├── style.css           # Styling and responsive design
├── produits_template.csv # Sample product data file
└── README.md           # This file
```

## 🎨 Customization

### Styling
The application uses CSS custom properties (variables) for easy theming:

```css
:root {
  --primary: #1a56db;      /* Main brand color */
  --accent: #0e9f6e;       /* Success/accent color */
  --danger: #e02424;       /* Error/danger color */
  --font-body: 'DM Sans', sans-serif;
  --font-serif: 'DM Serif Display', serif;
}
```

### Company Branding
Customize the BL header by updating settings:
- Company name and details
- Logo (if added)
- Footer text
- Default TVA rate

## 🔧 Development

### Local Development
```bash
# Install dependencies (if using package manager)
npm install  # Not required for vanilla version

# Start development server
python -m http.server 8000

# Open browser to http://localhost:8000
```

### Building for Production
No build process required - the application runs directly in the browser. Simply upload the files to your web server.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and structure
- Test on multiple browsers
- Ensure responsive design works on mobile
- Add comments for complex logic
- Update README for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Icons**: Unicode emoji for consistent cross-platform display
- **Fonts**: Google Fonts for professional typography
- **Libraries**: Open source libraries for enhanced functionality
- **Inspiration**: Algerian business document standards

## 📞 Support

For support, please:
1. Check the [Issues](https://github.com/yourusername/deliverpro/issues) page
2. Create a new issue with detailed description
3. Include browser version and steps to reproduce

---

**Made with ❤️ for Algerian businesses**</content>
<parameter name="filePath">c:\Users\PC\Documents\Bon de livraison\README.md
