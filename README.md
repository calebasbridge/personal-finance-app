# Personal Finance App

A **complete** desktop personal finance application featuring advanced envelope budgeting with multi-envelope credit card payment management and compensation planning. Built with Electron, React, TypeScript, and SQLite.

## 🚀 Project Overview

This application automates and enhances envelope budgeting beyond traditional solutions by solving the complex challenge of credit card payments across multiple spending categories. Unlike simple budgeting apps, this system maintains perfect account-envelope balance alignment while enabling sophisticated financial planning workflows.

### Key Innovation: Complete Multi-Envelope Financial Management System
Traditional envelope budgeting struggles with modern financial complexity. This app provides comprehensive solutions:
- **Individual Transaction Control**: Select specific credit card transactions to pay
- **Partial Payment Support**: Pay any amount on individual transactions with automatic splitting
- **Cross-Envelope Payments**: Draw from multiple cash envelopes for a single credit card payment
- **Smart Cash Envelope Matching**: Auto-suggests appropriate envelopes based on debt categories
- **Transaction Splitting**: Partial payments automatically split original transactions into paid/unpaid portions
- **Compensation Creator**: Calculate twice-monthly self-employment payments with funding targets
- **Perfect Balance Integrity**: All balances accurately reflect true financial state
- **Complete Audit Trail**: Maintains detailed transaction history for all financial activity

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript for type-safe component development
- **Desktop Framework**: Electron for cross-platform native desktop experience
- **Database**: SQLite with better-sqlite3 for local, secure data storage
- **Architecture**: Transaction-aware balance system with real-time calculations
- **Build System**: Webpack with custom configuration for Electron compatibility
- **Development**: Node.js v22+ with comprehensive testing infrastructure

## ✅ Complete Feature Set - Production Ready

### Core Financial Management ✅ PRODUCTION READY
- **Complete Account Management**: Professional CRUD interface for all account types
- **Advanced Envelope System**: Full envelope management with transaction-aware balances
- **Real-Time Transaction Entry**: Comprehensive transaction system with status-based logic
- **Envelope Transfers**: Money movement between envelopes with perfect validation
- **Account Transfers**: Cross-account money movement with envelope coordination
- **Multi-Account Support**: Checking, Savings, Credit Card, Cash accounts
- **Perfect Balance Integrity**: Account balances always equal sum of envelopes

### Advanced Credit Card Payment System ✅ PRODUCTION READY
- **Multi-Envelope Credit Card Payment Wizard**: Complete with transaction-level control
- **Individual Transaction Selection**: Choose specific debts to pay with checkbox interface
- **Partial Payment Processing**: Pay any amount on transactions with automatic splitting
- **Smart Cash Envelope Matching**: Auto-suggests matching envelopes (e.g., "Electric" → "Credit Card Electric")
- **Cross-Envelope Payment Flexibility**: Pay grocery debt with gas envelope money
- **Real-Time Payment Summary**: Shows selected transactions and envelope allocation breakdown
- **Transaction Splitting Logic**: Partial payments split into paid/unpaid portions automatically
- **Balance Accuracy**: Debt envelope balances correctly show remaining amounts after partial payments
- **Professional Validation**: Complete error handling and fund availability checking

### Compensation Creator System ✅ PRODUCTION READY
- **Twice-Monthly Paycheck Calculator**: Automatic 1st & 15th date calculation for self-employment
- **Credit Card Debt Analysis**: Real-time debt display by envelope category
- **Funding Target Management**: Set and persist envelope funding goals with descriptions
- **Automatic Payment Split**: 75% W-2 paycheck / 25% dividend calculation
- **Target Type Support**: Monthly minimums, per-paycheck amounts, monthly stipends
- **Professional 2-Tab Interface**: Calculator and Targets management
- **Real-Time Calculations**: Instant compensation updates based on debt and targets
- **Forward Planning Integration**: Uses existing transaction system for projections

### Database Foundation ✅ COMPLETE
- **Transaction-Aware Architecture**: Real-time balance calculations respecting transaction status
- **Account Types**: Checking, Savings, Credit Card, Cash with specialized logic
- **Status-Driven Transactions**: Bank (Not Posted/Pending/Cleared), Credit Card (Unpaid/Paid)
- **Transaction Splitting Support**: Handles partial payments with proper audit trails
- **Funding Target Persistence**: Complete compensation creator database support
- **Data Persistence**: Survives application restarts with SQLite reliability
- **Type Safety**: Full TypeScript integration throughout data layer
- **Advanced Views**: SQL views for complex balance calculations and integrity validation

### Professional User Interface ✅ COMPLETE
- **Account Management UI**: Create, edit, delete accounts with modern interface
- **Envelope Management**: Complete CRUD operations with search and filtering
- **Transaction Entry Form**: Google Sheets-like interface with real-time validation
- **Envelope Transfer Interface**: Professional transfer system with balance preview
- **Credit Card Payment Interface**: Sophisticated payment wizard with transaction-level control
- **Account Transfer Interface**: Cross-account money movement with professional validation
- **Compensation Creator Interface**: Complete paycheck calculator with funding targets
- **Real-Time Updates**: All interfaces update immediately upon data changes
- **Color-Coded Design**: Visual distinction between account types and envelope categories

### Technical Excellence ✅ COMPLETE
- **Safe Electron API Access**: TypeScript-safe utility functions prevent runtime errors
- **Complete IPC Communication**: 50+ handlers for secure React ↔ Electron communication
- **Atomic Operations**: Multi-step financial operations succeed or fail completely
- **Comprehensive Testing**: Real-time verification interfaces for all systems
- **Error Handling**: Robust validation and error management throughout
- **Balance Validation**: Automatic integrity checking across entire system
- **Transaction Splitting**: Advanced partial payment logic with proper balance updates
- **Build System**: Successfully compiling and running production application

## 🗂️ Project Structure

```
personal-finance-app-v2/
├── src/
│   ├── database/
│   │   ├── types.ts              # Complete TypeScript interfaces including compensation
│   │   ├── connection.ts         # SQLite setup with comprehensive views
│   │   ├── accounts.ts           # Account operations with auto-envelope creation
│   │   ├── envelopes.ts          # Envelope operations with transaction integration
│   │   ├── transactions.ts       # Transaction system with status logic
│   │   ├── creditCardPayments.ts # Multi-envelope payment system with splitting
│   │   ├── compensationCreator.ts# Funding targets and paycheck calculations
│   │   └── index.ts              # Complete database module exports
│   ├── components/
│   │   ├── AccountForm.tsx       # Account creation/editing
│   │   ├── AccountList.tsx       # Account display with real-time balances
│   │   ├── EnvelopeManagement.tsx# Complete envelope CRUD interface
│   │   ├── EnvelopeTransfer.tsx  # Professional envelope transfer system
│   │   ├── TransactionEntry.tsx  # Comprehensive transaction entry form
│   │   ├── CreditCardPaymentWizard.tsx # Advanced payment wizard with partial payments
│   │   ├── CompensationCreator.tsx # Complete paycheck calculator with funding targets
│   │   ├── PartialPaymentTest.tsx# Comprehensive test suite for partial payments
│   │   ├── CompensationCreatorTest.tsx # Complete test suite for compensation system
│   │   ├── DatabaseTest.tsx      # Database testing interface
│   │   └── TransactionTest.tsx   # Transaction system testing
│   ├── pages/
│   │   ├── AccountManagement.tsx # Main account management page
│   │   ├── TransactionEntry.tsx  # Transaction entry page
│   │   ├── CreditCardPaymentPage.tsx # Credit card payment page
│   │   ├── AccountTransferPage.tsx # Account transfer page
│   │   └── CompensationCreatorPage.tsx # Compensation creator page
│   ├── utils/
│   │   └── electronAPI.ts        # Safe Electron API access utility
│   ├── main.ts                   # Electron main process with 50+ IPC handlers
│   ├── preload.ts                # Complete IPC security bridge
│   ├── App.tsx                   # React application with complete navigation
│   └── index.tsx                 # React entry point
├── dist/                         # ✅ Successfully compiled application
├── .gitignore                    # Proper exclusions for Node.js/Electron
├── README.md                     # This file
├── LICENSE                       # MIT License
├── package.json                  # Dependencies and scripts
├── webpack.config.js             # Build configuration
└── tsconfig.json                 # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ (for better-sqlite3 compatibility)
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/calebasbridge/personal-finance-app.git
   cd personal-finance-app-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build and start the application**
   ```bash
   npm run electron:build
   npm run start
   ```

### Available Scripts

- `npm run electron:build` - Build the complete application for Electron
- `npm run start` - Launch the Electron application
- `npm run electron:dev` - Launch in development mode
- `npm run build` - Build production bundle
- `npm run dev` - Start React development server

## 🎯 Development Complete - All Phases Finished

### Phase 1: Foundation ✅ COMPLETE
- [x] Electron + React + TypeScript setup
- [x] SQLite database integration
- [x] Account management (CRUD operations)
- [x] Comprehensive testing infrastructure
- [x] Professional Account Management UI

### Phase 2: Envelope System ✅ COMPLETE
- [x] Envelope creation and management with professional UI
- [x] Account-envelope relationship enforcement
- [x] Automatic unassigned envelope creation
- [x] Balance integrity validation
- [x] Envelope type system (cash vs debt envelopes)

### Phase 3: Transaction Management ✅ COMPLETE
- [x] Transaction entry with comprehensive status system
- [x] Bank account transaction statuses (Not Posted/Pending/Cleared)
- [x] Credit card transaction statuses (Unpaid/Paid)
- [x] Transaction-aware balance calculations
- [x] Account transfer system
- [x] Credit card payment infrastructure

### Phase 4: Complete Application UI ✅ COMPLETE (7/7 Components)
- [x] **Professional Transaction Entry Interface** - Production ready
- [x] **Envelope Transfer System** - Production ready with perfect validation
- [x] **Envelope Management Interface** - Complete CRUD operations
- [x] **Account Management Interface** - Complete account lifecycle management
- [x] **Multi-Envelope Credit Card Payment Wizard** - Complete with partial payment support
- [x] **Account Transfer Interface** - Inter-account money movement
- [x] **Compensation Creator System** - Complete paycheck calculator with funding targets

### Phase 5: Future Enhancements (Planned)
- [ ] Real-world testing and optimization
- [ ] Distribution preparation and packaging
- [ ] Advanced reporting and analytics
- [ ] Mobile app adaptation
- [ ] Commercial preparation

## 🏆 Major Achievements

### Complete Personal Finance Application ✅ ACHIEVED
**All 7 Core Components Implemented and Operational:**
1. **Account Management** - Complete lifecycle management
2. **Envelope Management** - Full CRUD with transaction-aware balances
3. **Transaction Entry** - Professional input with intelligent validation
4. **Envelope Transfers** - Seamless money movement between envelopes
5. **Credit Card Payment Wizard** - Advanced payment system with partial payment support
6. **Account Transfer Interface** - Cross-account money movement
7. **Compensation Creator System** - Complete paycheck calculator with funding targets

### Advanced Financial Capabilities ✅ ACHIEVED
- **Transaction Splitting**: Partial payments with automatic debt tracking
- **Cross-Envelope Payments**: Pay any debt with any cash source
- **Status-Aware Balances**: Bank vs credit card transaction logic
- **Funding Target System**: Multiple target types with automatic calculations
- **Account Transfer System**: Money movement between different accounts with envelope coordination
- **Compensation Planning**: Twice-monthly paycheck calculation with debt analysis

### Technical Excellence ✅ ACHIEVED
- **Production-Ready Build**: Successfully compiling TypeScript application
- **Safe API Access**: Utility functions prevent runtime errors
- **Complete IPC System**: 50+ bidirectional communication handlers
- **Professional React Architecture**: Consistent design patterns throughout
- **Comprehensive Error Handling**: Robust validation and user guidance
- **Perfect Balance Integrity**: Account-envelope alignment maintained across all operations

## 🎮 How to Use

### Basic Workflow
1. **Create Accounts**: Add your checking, savings, and credit card accounts
2. **Manage Envelopes**: Create spending category envelopes within each account
3. **Enter Transactions**: Record income, expenses, and credit card purchases
4. **Transfer Between Envelopes**: Reallocate funds as spending needs change
5. **Track Balances**: Monitor real-time account and envelope balances

### Advanced Credit Card Payment Workflow
1. **Select Credit Card**: Choose credit card account from transaction-aware dropdown
2. **Review Unpaid Transactions**: See individual transactions with dates and descriptions
3. **Select Transactions to Pay**: Use checkboxes to choose specific debts
4. **Choose Payment Amounts**: Full payment buttons or custom partial amounts
5. **Smart Envelope Matching**: Auto-suggested cash envelopes or manual selection
6. **Review Payment Summary**: Verify transaction details and envelope allocation
7. **Execute Payment**: Single payment with multiple envelope allocation and transaction splitting

### Compensation Creator Workflow
1. **Access Calculator Tab**: View paycheck calculation interface
2. **Set Paycheck Date**: Choose 1st or 15th or custom date
3. **Review Debt Analysis**: See current credit card debt by envelope category
4. **Check Funding Targets**: View envelope funding goals and shortfalls
5. **Calculate Payment**: Get automatic 75% W-2 / 25% dividend split
6. **Manage Targets Tab**: Create and edit funding targets for envelopes
7. **Plan Forward**: Use calculations for financial planning and budgeting

### Advanced Features
- **Partial Payment Management**: Pay any amount on individual transactions
- **Transaction Status Management**: Track pending vs cleared transactions
- **Credit Card Debt Categorization**: Organize credit card spending by category
- **Account-Envelope Integrity**: Automatic validation of balance consistency
- **Cross-Envelope Payments**: Pay any debt with any available cash envelope
- **Funding Target Planning**: Set and track envelope funding goals
- **Compensation Planning**: Calculate self-employment payments with debt analysis

## 🧪 Testing & Verification

### Comprehensive Test Suite ✅ COMPLETE
- **Partial Payment Test**: 10-step verification of transaction splitting functionality
- **Compensation Creator Test**: 7-step verification of paycheck calculation system
- **Database Integrity Tests**: Validation of account-envelope balance alignment
- **Transaction System Tests**: Comprehensive testing of all transaction types
- **Balance Calculation Tests**: Verification of real-time balance accuracy
- **User Interface Tests**: Professional testing interfaces for all 7 major components

### Quality Assurance
- **Real-World Scenarios**: Tests based on actual financial management workflows
- **Edge Case Handling**: Robust error handling and validation throughout
- **Data Integrity**: Comprehensive verification of all financial calculations
- **User Experience**: Professional interfaces with intuitive workflows
- **Production Readiness**: All components tested and verified operational

## 🤝 Contributing

This project represents a complete personal finance application. Future contribution guidelines will be established based on community interest.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Project Status & Goals

### Current Status: ✅ COMPLETE PHASE 4 APPLICATION
- **All 7 Core Components**: Implemented and operational
- **Build Status**: Successfully compiling and running
- **Feature Completeness**: Advanced financial management capabilities
- **Technical Excellence**: Production-ready codebase with comprehensive testing
- **User Experience**: Professional-grade interfaces throughout

### Immediate Goals (2025)
- Real-world testing and optimization
- Distribution preparation and packaging
- Documentation for friends and family
- Portfolio demonstration of advanced development skills

### Future Opportunities
- Mobile app adaptation using React Native
- Commercial distribution potential
- Open source community development
- Advanced financial planning features
- Integration with banking APIs

## 🏅 Project Highlights

### Technical Sophistication
- **Complex Financial Logic**: Multi-envelope credit card payments with partial payment support
- **Professional Architecture**: Transaction-aware balance system with perfect integrity
- **Advanced Database Design**: SQLite with custom views and real-time calculations
- **Type-Safe Development**: Full TypeScript integration throughout all layers
- **Production Build System**: Successfully compiling Electron application

### User Experience Excellence
- **Google Sheets-Quality Interfaces**: Professional, intuitive financial management
- **Real-Time Validation**: Immediate feedback and error prevention
- **Smart Automation**: Auto-suggestions and intelligent defaults throughout
- **Comprehensive Functionality**: Handles complex real-world financial scenarios
- **Perfect Balance Integrity**: Account balances always equal envelope totals

### Business Value
- **Complete Personal Finance Solution**: Rival to commercial financial software
- **Advanced Envelope Budgeting**: Solves complex credit card payment challenges
- **Self-Employment Planning**: Sophisticated compensation calculation system
- **Portfolio Demonstration**: Advanced full-stack development capabilities
- **Commercial Potential**: Foundation for future business opportunities

---

**Current Status**: ✅ PHASE 4 COMPLETE - All 7 Components Operational

**Latest Achievement**: Complete Personal Finance Application with Advanced Financial Management ✅

**Build Status**: ✅ Successfully Compiling and Running

**Last Updated**: August 3, 2025