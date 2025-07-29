# Personal Finance App

A desktop personal finance application featuring advanced envelope budgeting with multi-envelope credit card payment management. Built with Electron, React, TypeScript, and SQLite.

## 🚀 Project Overview

This application automates and enhances envelope budgeting beyond traditional solutions by solving the complex challenge of credit card payments across multiple spending categories. Unlike simple budgeting apps, this system maintains perfect account-envelope balance alignment while enabling sophisticated financial planning workflows.

### Key Innovation: Multi-Envelope Credit Card Payments
Traditional envelope budgeting struggles with credit cards because a single payment typically covers multiple spending categories. This app solves this by:
- Tracking debt by spending category (groceries, gas, utilities, etc.)
- Enabling single payments that draw from multiple cash envelopes
- Automatically handling cross-envelope transfers when needed
- Maintaining perfect balance integrity across all accounts

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript for type-safe component development
- **Desktop Framework**: Electron for cross-platform native desktop experience
- **Database**: SQLite with better-sqlite3 for local, secure data storage
- **Build System**: Webpack with custom configuration for Electron compatibility
- **Development**: Node.js v22+ with comprehensive testing infrastructure

## ✅ Current Features (Phase 1 Complete)

### Database Foundation
- **Complete CRUD Operations**: Create, read, update, delete for all account types
- **Account Types**: Checking, Savings, Credit Card, Cash accounts
- **Data Persistence**: Survives application restarts with SQLite reliability
- **Type Safety**: Full TypeScript integration throughout data layer
- **Error Handling**: Robust validation and error management

### Application Architecture
- **IPC Communication**: Secure React ↔ Electron main process communication
- **Modular Design**: Clean separation of concerns for scalability
- **Testing Infrastructure**: Comprehensive database testing with real-time verification
- **Professional Build System**: Webpack configuration optimized for Electron

## 🗂️ Project Structure

```
personal-finance-app/
├── src/
│   ├── database/
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── connection.ts      # SQLite setup and configuration
│   │   ├── accounts.ts        # Account CRUD operations
│   │   └── index.ts           # Database module exports
│   ├── components/
│   │   └── DatabaseTest.tsx   # Comprehensive testing interface
│   ├── main.ts                # Electron main process
│   ├── preload.ts             # IPC security bridge
│   ├── App.tsx                # React application root
│   └── index.tsx              # React entry point
├── .gitignore                 # Proper exclusions for Node.js/Electron
├── package.json               # Dependencies and scripts
├── webpack.config.js          # Build configuration
└── tsconfig.json              # TypeScript configuration
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
   cd personal-finance-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Rebuild native modules for Electron**
   ```bash
   npx electron-rebuild
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Launch the Electron app**
   ```bash
   npm run electron
   ```

### Available Scripts

- `npm run dev` - Start React development server
- `npm run electron` - Launch Electron application
- `npm run build` - Build production bundle
- `npm run test` - Run test suite (planned)

## 🎯 Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Electron + React + TypeScript setup
- [x] SQLite database integration
- [x] Account management (CRUD operations)
- [x] Comprehensive testing infrastructure
- [x] Account Management UI

### ✅ Current Working Features:
- **Professional Account Management**: Create, edit, delete accounts through beautiful UI
- **Multiple Account Types**: Checking, savings, credit card, cash accounts
- **Advanced UI Features**: Sorting, filtering, search functionality
- **Data Persistence**: All data survives application restarts
- **Professional Design**: Color-coded cards with modern interface

### Phase 2: Envelope System (Planned)
- [ ] Envelope creation and management
- [ ] Account-envelope relationship enforcement
- [ ] Envelope transfer functionality
- [ ] Balance integrity validation

### Phase 3: Transaction Management (Planned)
- [ ] Transaction entry with status system
- [ ] Bank account transaction statuses (Not Posted/Pending/Cleared)
- [ ] Credit card transaction statuses (Unpaid/Paid)
- [ ] Balance calculations respecting transaction status

### Phase 4: Advanced Credit Card Payments (Planned)
- [ ] Multi-envelope payment allocation interface
- [ ] Automatic cross-envelope transfers
- [ ] Payment history and tracking
- [ ] Debt categorization reporting

### Phase 5: Financial Planning (Planned)
- [ ] Compensation planning calculator
- [ ] Envelope funding targets
- [ ] Forward transaction planning
- [ ] Financial reporting and analytics

## 🏗️ Architecture Decisions

### Local-First Approach
- **SQLite Database**: Complete user control, no cloud dependencies
- **Desktop Native**: Full filesystem access and native OS integration
- **Privacy by Design**: All financial data remains on user's device

### Envelope-Account Integrity
- **Perfect Balance Alignment**: Account balances always equal sum of contained envelopes
- **Atomic Operations**: Multi-step financial operations succeed or fail completely
- **Status-Driven Logic**: Transaction status determines balance impact

### Scalable Foundation
- **Component-Based Architecture**: React components enable incremental feature testing
- **TypeScript Throughout**: Compile-time error catching and enhanced developer experience
- **Modular Database Layer**: Easy to extend with new financial features

## 🤝 Contributing

This project is currently in active development. Future contribution guidelines will be established as the application matures.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Project Goals

### Immediate (2025)
- Complete desktop application with full envelope budgeting functionality
- Share with friends and family for real-world testing
- Establish as portfolio demonstration of full-stack development skills

### Future Opportunities
- Mobile app adaptation using React Native
- Commercial distribution potential
- Open source community development

---

**Current Status**: Phase 1 Foundation Complete - Ready for Account Management UI Development

**Last Updated**: July 28, 2025