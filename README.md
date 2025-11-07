# 🏪 Digital Printing POS System

<div align="center">

![POS System](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38b2ac?style=for-the-badge&logo=tailwind-css&logoColor=white)

*A comprehensive Point of Sale system designed for digital printing businesses with inventory management, customer tracking, and financial analytics.*

[🚀 Live Demo](#) · [📖 Documentation](#features) · [🛠️ Installation](#installation) · [🤝 Contributing](#contributing)

</div>

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎯 Business Use Cases](#-business-use-cases)
- [🛠️ Tech Stack](#️-tech-stack)
- [📊 Database Schema](#-database-schema)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [📱 Key Features Overview](#-key-features-overview)
- [🔧 Development](#-development)
- [📝 License](#-license)

## ✨ Features

### 🛍️ **Sales Management**
- **Smart Product Types**: Handle both size-based (width × height) and quantity-based products
- **Dynamic Pricing**: Automatic price calculation based on dimensions for printing services
- **Customer Management**: Track customer information and purchase history
- **Real-time Sales**: Instant transaction processing and receipt generation

### 📄 **Invoice Generation**
- **Professional PDFs**: Beautiful, branded invoices with company information
- **Detailed Line Items**: Product descriptions, sizes, quantities, and pricing
- **Automatic Calculations**: Cost analysis with profit margins
- **Download & Share**: One-click PDF download functionality

### 📊 **Financial Analytics**
- **COGS Tracking**: Comprehensive Cost of Goods Sold analysis
- **Profit Margins**: Real-time profit calculation per item and overall
- **Monthly Filtering**: Filter sales and COGS by month/year
- **Revenue Dashboard**: Track business performance over time

### 📦 **Inventory Management**
- **Product Catalog**: Organize products by type and pricing
- **Cost Tracking**: Set cost prices and selling prices
- **Flexible Sizing**: Support for custom dimensions (width × height)
- **Stock Monitoring**: Track product availability

### 👥 **Customer Relations**
- **Customer Database**: Store customer contact information
- **Purchase History**: View past transactions per customer
- **Walk-in Support**: Handle anonymous customers seamlessly

### 🎨 **User Experience**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Fast Performance**: Optimized for speed and reliability
- **Mobile Sign-out**: Full mobile functionality with proper authentication

## 🎯 Business Use Cases

### 🖨️ **Digital Printing Services**
Perfect for businesses that offer:
- Large format printing (banners, posters, signs)
- Custom dimension products
- Variable pricing based on size
- Bulk order processing

### 📱 **Mobile-Friendly Operations**
- Take orders on tablets or phones
- Process sales anywhere in your shop
- Generate invoices on the spot
- Access business analytics on the go

### 💰 **Financial Management**
- Track exact costs vs revenue
- Monitor profit margins per product
- Monthly financial reporting
- Data-driven business decisions

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **shadcn/ui** - Modern UI components

### **Backend**
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Real-time subscriptions
  - Authentication system
  - Row-level security

### **PDF Generation**
- **jsPDF** - Client-side PDF creation
- **Dynamic imports** - Optimized bundle size
- **Custom layouts** - Professional invoice design

## 📊 Database Schema

```sql
-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR CHECK (type IN ('size', 'quantity')),
  price_per_unit NUMERIC NOT NULL,
  cost_price NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sales Table
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  total_price NUMERIC NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sale Items Table
CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id),
  product_id INTEGER REFERENCES products(id),
  width NUMERIC,
  height NUMERIC,
  quantity INTEGER,
  item_total NUMERIC NOT NULL,
  description TEXT,
  cost_price NUMERIC,
  price_per_unit NUMERIC
);

-- Customers Table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Installation

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Git

### **Step 1: Clone Repository**
```bash
git clone https://github.com/win123id/pos.git
cd pos
```

### **Step 2: Install Dependencies**
```bash
npm install
# or
yarn install
```

### **Step 3: Set Up Supabase**
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from above in your Supabase SQL editor
3. Get your project URL and anon key from Supabase settings

### **Step 4: Environment Configuration**
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Step 5: Run Development Server**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

### **Company Information**
Edit the invoice generation in `lib/pdf.ts` to customize:
- Company name: "Digital Printing Indoor - Outdoor"
- Contact: "Offset & Media Promotion | Email: win123id@gmail.com"
- Logo: Place your logo in `public/invoice.png`

### **Database Customization**
- Add more product types by modifying the `type` constraint
- Extend customer fields for additional information
- Customize tax calculations in the sales logic

### **UI Customization**
- Modify colors in `tailwind.config.js`
- Update components in `components/ui/`
- Adjust layouts in `app/` directory

## 📱 Key Features Overview

### 🏠 **Dashboard**
- Real-time sales overview
- Quick action buttons
- Recent activity feed
- Business metrics at a glance

### 🛒 **Sales Management**
- Intuitive product selection
- Dynamic price calculation for size-based products
- Customer information capture
- Instant PDF invoice generation

### 📊 **COGS Analytics**
- Visual profit metrics with gradient cards
- Monthly/yearly filtering options
- Detailed cost breakdown per item
- Profit margin analysis

### 📄 **Professional Invoices**
- Beautiful PDF layout with company branding
- Detailed line items with dimensions
- Automatic cost and profit calculations
- One-click download functionality

## 🔧 Development

### **Available Scripts**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### **Project Structure**
```
pos/
├── app/                 # Next.js app directory
│   ├── protected/       # Dashboard page
│   ├── sales/           # Sales management
│   ├── products/        # Product management
│   ├── customers/       # Customer management
│   ├── cogs/           # Cost analysis
│   └── auth/           # Authentication pages
├── components/          # Reusable components
│   ├── ui/             # Base UI components
│   └── layout/         # Layout components
├── lib/                # Utility functions
│   ├── supabase/       # Database client
│   ├── currency.ts     # Currency formatting
│   └── pdf.ts          # PDF generation
└── public/             # Static assets
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### **How to Contribute**
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Give the project a star

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Supabase** - For the excellent backend solution
- **Tailwind CSS** - For the utility-first CSS framework
- **shadcn/ui** - For the beautiful UI components

---

<div align="center">

**Made with ❤️ for Digital Printing Businesses**

📧 **Contact:** win123id@gmail.com · 🌐 **Repository:** [github.com/win123id/pos](https://github.com/win123id/pos)

</div>
