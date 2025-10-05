# IGCFMS - Integrated Government Cash Flow Management System

[![Laravel](https://img.shields.io/badge/Laravel-10.x-red.svg)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive web-based financial management system designed for government institutions to efficiently manage cash flow, fund accounts, and financial transactions with complete audit trails and real-time reporting.

## 🎯 **Project Overview**

IGCFMS is a modern, secure, and scalable financial management system that provides:

- **Fund Account Management** - Create and manage multiple government fund accounts
- **Transaction Processing** - Handle both money collections and disbursements
- **Real-time Balance Tracking** - Monitor fund balances with automatic updates
- **Comprehensive Audit Trail** - Complete logging of all financial activities
- **User Management** - Role-based access control for different user types
- **Receipt Generation** - Automatic receipt creation for all transactions
- **Dashboard Analytics** - Real-time financial insights and reporting

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React.js      │    │   Laravel API   │    │     MySQL       │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Port 3306)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Docker        │    │   File Storage  │
│   Web Server    │    │   Container     │    │   (Laravel)     │
│   (Port 80)     │    │   Orchestration │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ **Technology Stack**

### **Backend**
- **Framework:** Laravel 10.x (PHP 8.2)
- **Authentication:** Laravel Sanctum (API Tokens)
- **Database:** MySQL 8.0
- **Web Server:** Nginx
- **Containerization:** Docker & Docker Compose

### **Frontend**
- **Framework:** React.js 18.x
- **HTTP Client:** Axios
- **Routing:** React Router DOM
- **Styling:** Custom CSS with responsive design
- **Icons:** Font Awesome

### **Development Tools**
- **Version Control:** Git
- **IDE:** VS Code (recommended)
- **Package Manager:** Composer (PHP), NPM (JavaScript)
- **Database Management:** MySQL Workbench / phpMyAdmin

## 🚀 **Quick Start**

### **Prerequisites**
- Docker Desktop
- Git
- VS Code (recommended)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/igcfms_capstone_project.git
   cd igcfms_capstone_project
   ```

2. **Start with Docker (Recommended)**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Setup database
   docker-compose exec backend php artisan migrate
   docker-compose exec backend php artisan key:generate
   ```

3. **Access the application**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:8000/api
   - **Database:** localhost:3306

### **Manual Installation (Alternative)**

<details>
<summary>Click to expand manual installation steps</summary>

#### **Backend Setup**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --port=8000
```

#### **Frontend Setup**
```bash
cd igcfms
npm install
npm start
```

#### **Database Setup**
- Create MySQL database named `igcfms`
- Update `.env` file with database credentials
- Run migrations: `php artisan migrate`

</details>

## 📁 **Project Structure**

```
igcfms_capstone_project/
├── backend/                    # Laravel API Backend
│   ├── app/
│   │   ├── Http/Controllers/   # API Controllers
│   │   ├── Models/            # Eloquent Models
│   │   └── Services/          # Business Logic Services
│   ├── database/
│   │   ├── migrations/        # Database Schema
│   │   └── seeders/          # Sample Data
│   ├── routes/api.php         # API Routes
│   └── .env                   # Environment Configuration
├── igcfms/                    # React Frontend
│   ├── src/
│   │   ├── components/        # React Components
│   │   │   ├── admin/        # Admin Components
│   │   │   ├── common/       # Shared Components
│   │   │   └── pages/        # Page Components
│   │   ├── services/         # API Services
│   │   └── utils/            # Utility Functions
│   └── package.json          # Dependencies
├── nginx/                     # Nginx Configuration
├── docker-compose.yml         # Docker Services
└── README.md                 # This file
```

## 🔑 **Key Features**

### **💰 Fund Account Management**
- Create and manage multiple fund accounts
- Support for different account types (General, Special, Trust)
- Real-time balance tracking
- Department-wise fund allocation

### **💸 Transaction Processing**
- **Money Collection:** Record incoming payments with receipt generation
- **Money Disbursement:** Process outgoing payments with approval workflow
- **Balance Validation:** Prevent overdrafts with real-time balance checking
- **Auto-numbering:** Sequential receipt and reference number generation

### **📊 Dashboard & Analytics**
- Real-time financial overview
- Transaction history and trends
- Fund performance metrics
- Recent activity logs

### **👥 User Management**
- Role-based access control
- User profile management
- Activity tracking and audit logs
- Secure authentication with Laravel Sanctum

### **🔒 Security Features**
- JWT token-based authentication
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Comprehensive audit trails

## 🎮 **Usage Examples**

### **Creating a Fund Account**
```javascript
// Frontend API call
const createAccount = async (accountData) => {
    const response = await api.post('/fund-accounts', {
        name: 'General Fund',
        code: 'GF-2024-001',
        account_type: 'General Fund',
        initial_balance: 1000000.00,
        department: 'Finance'
    });
    return response.data;
};
```

### **Processing a Transaction**
```javascript
// Money collection example
const receivePayment = async (paymentData) => {
    const response = await api.post('/transactions', {
        type: 'Collection',
        amount: 5000.00,
        fund_account_id: 1,
        recipient: 'Nikki Sixx Acosta',
        department: 'Finance',
        category: 'Tax Collection',
        mode_of_payment: 'Cash'
    });
    return response.data;
};
```

## 🗄️ **Database Schema**

### **Core Tables**
- **users** - System users and authentication
- **fund_accounts** - Government fund accounts
- **transactions** - All financial transactions
- **receipts** - Generated receipts for collections
- **audit_logs** - Complete activity audit trail
- **notifications** - System notifications

### **Key Relationships**
```sql
users (1) ──────── (many) transactions
users (1) ──────── (many) fund_accounts
fund_accounts (1) ── (many) transactions
transactions (1) ─── (1) receipts
```

## 🔧 **API Documentation**

### **Authentication**
```bash
POST /api/login          # User login
POST /api/logout         # User logout
GET  /api/user/profile   # Get user profile
```

### **Fund Accounts**
```bash
GET    /api/fund-accounts     # List all accounts
POST   /api/fund-accounts     # Create new account
GET    /api/fund-accounts/{id} # Get specific account
PUT    /api/fund-accounts/{id} # Update account
DELETE /api/fund-accounts/{id} # Delete account
```

### **Transactions**
```bash
GET  /api/transactions        # List all transactions
POST /api/transactions        # Create new transaction
GET  /api/transactions/{id}   # Get specific transaction
```

### **Dashboard**
```bash
GET /api/dashboard/summary           # Dashboard overview
GET /api/dashboard/recent-transactions # Recent transactions
GET /api/dashboard/fund-distribution  # Fund distribution data
```

## 🐳 **Docker Configuration**

The project includes a complete Docker setup with:

- **MySQL 8.0** - Database server
- **Laravel Backend** - PHP-FPM with Nginx
- **React Frontend** - Node.js development server
- **Nginx** - Web server and reverse proxy

### **Docker Commands**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose build --no-cache
```

## 🧪 **Testing**

### **Backend Testing**
```bash
cd backend
php artisan test
```

### **Frontend Testing**
```bash
cd igcfms
npm test
```

## 📚 **Documentation**

- **[Quick Start Guide](docker%20guide/DOCKER_QUICK_START_GUIDE.md)** - Get up and running quickly
- **[Detailed Code Analysis](study_guide/DETAILED_CODE_ANALYSIS.md)** - In-depth code documentation
- **[System Flow Analysis](study_guide/SYSTEM_FLOW_ANALYSIS.md)** - System architecture and flows
- **[API Documentation](docs/API.md)** - Complete API reference

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow PSR-12 coding standards for PHP
- Use ESLint configuration for JavaScript
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 🐛 **Troubleshooting**

### **Common Issues**

**Port conflicts with XAMPP:**
```bash
# Stop XAMPP services before starting Docker
# Or change ports in docker-compose.yml
```

**Database connection errors:**
```bash
# Restart MySQL container
docker-compose restart mysql

# Check database logs
docker-compose logs mysql
```

**Frontend not loading:**
```bash
# Check if all services are running
docker-compose ps

# Restart frontend container
docker-compose restart frontend
```

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Authors**

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 **Acknowledgments**

- Laravel community for the excellent framework
- React team for the powerful frontend library
- Docker for containerization technology
- All contributors who helped improve this project

## 📞 **Support**

If you encounter any issues or have questions:

1. Check the [documentation](study_guide/)
2. Search existing [issues](https://github.com/yourusername/igcfms_capstone_project/issues)
3. Create a new issue with detailed information
4. Contact the development team

---

**Built with ❤️ for government financial management from  DPWH**
