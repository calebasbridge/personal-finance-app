# Personal Finance App - Design System Guide

## 🎯 Quick Start for New Components

When creating new components, follow these patterns to maintain consistency:

### **1. Basic Component Structure**
```jsx
// Always import design system CSS
import React from 'react';

const MyNewComponent = () => {
  return (
    <div className="page-container"> {/* If it's a page */}
      <div className="page-header">
        <h1 className="page-title">My New Feature</h1>
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
      </div>
      
      {/* Your content here */}
    </div>
  );
};
```

### **2. Card-Based Components**
```jsx
<div className="finance-card">
  <div className="finance-card-header">
    <h3 className="finance-card-title">Card Title</h3>
    <div className="d-flex gap-2">
      <button className="btn btn-sm btn-primary">Edit</button>
    </div>
  </div>
  
  <div className="finance-card-content">
    {/* Your content */}
  </div>
  
  <div className="finance-card-footer">
    <span className="text-xs text-muted">Footer info</span>
  </div>
</div>
```

### **3. Forms**
```jsx
<div className="form-container">
  <div className="form-group">
    <label className="form-label required">Field Name</label>
    <input 
      type="text" 
      className="form-input" 
      placeholder="Enter value"
    />
  </div>
  
  <div className="form-actions">
    <button className="btn btn-secondary">Cancel</button>
    <button className="btn btn-primary">Save</button>
  </div>
</div>
```

### **4. Messages & Alerts**
```jsx
{successMessage && (
  <div className="message message-success">
    {successMessage}
  </div>
)}

{error && (
  <div className="message message-error">
    {error}
  </div>
)}
```

## 🎨 Design System Classes Reference

### **Layout & Structure**
- `page-header`, `page-title`, `page-subtitle` - Page headers
- `finance-card`, `finance-card-header`, `finance-card-content`, `finance-card-footer` - Card system
- `modal-overlay`, `modal-content`, `modal-header`, `modal-body` - Modals
- `section-group`, `section-title` - Section organization

### **Forms**
- `form-container` - Form wrapper
- `form-group` - Individual field groups
- `form-label` - Field labels (add `required` class for asterisk)
- `form-input`, `form-select`, `form-textarea` - Form controls
- `form-grid-2`, `form-grid-3` - Grid layouts
- `form-actions` - Button container
- `form-error` - Error messages

### **Buttons**
- `btn` - Base button class
- `btn-sm`, `btn-lg` - Size variants
- `btn-primary`, `btn-success`, `btn-danger`, `btn-secondary` - Color variants
- `nav-btn nav-btn-[color]` - Navigation buttons with shadows
- `back-button` - Consistent back button styling

### **Messages & Status**
- `message message-success/error/warning/info` - Alert messages
- `badge badge-[type]` - Status badges
- `badge-checking`, `badge-savings`, `badge-credit`, `badge-cash` - Account type badges

### **Financial Display**
- `balance-positive`, `balance-negative`, `balance-zero` - Balance colors
- `balance-large`, `balance-small` - Balance sizes
- `currency` - Monospace font for currency

### **Utilities**
- `d-flex`, `justify-between`, `align-center` - Flexbox
- `gap-1` through `gap-5` - Spacing
- `text-xs` through `text-2xl` - Font sizes
- `font-normal`, `font-medium`, `font-semibold`, `font-bold` - Font weights
- `text-success`, `text-error`, `text-warning`, `text-muted`, `text-dark` - Text colors

## 🎯 Best Practices

### **Do:**
- ✅ Use semantic class names (`finance-card` not `blue-box`)
- ✅ Follow the established patterns above
- ✅ Use utility classes for spacing and layout
- ✅ Maintain consistent button hierarchy
- ✅ Use proper form structure with labels and groups

### **Don't:**
- ❌ Add inline styles (use design system classes)
- ❌ Create new color variants without updating design system
- ❌ Mix different button styles in same context
- ❌ Skip form labels or accessibility features

## 🔧 Extending the Design System

If you need new patterns, add them to `src/styles/design-system.css`:

```css
/* Add new component patterns following existing structure */
.my-new-component {
  /* Use existing design tokens */
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  /* etc... */
}
```

## 📱 Responsive Design

All components are mobile-first. Test your new components at:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

## 🎨 Color Palette

### **Account Types:**
- Checking: `#3498db` (blue)
- Savings: `#27ae60` (green)
- Credit Card: `#e74c3c` (red)
- Cash: `#f39c12` (orange)

### **Status Colors:**
- Success: `#28a745` (green)
- Error: `#dc3545` (red)
- Warning: `#fd7e14` (orange)
- Info: `#17a2b8` (teal)

### **Action Colors:**
- Primary: `#17a2b8` (teal)
- Secondary: `#6c757d` (gray)

This design system ensures your application maintains its professional, commercial-grade appearance as you add new features!

---

**Last Updated**: August 4, 2025
**Design System Version**: 1.0 (Complete)