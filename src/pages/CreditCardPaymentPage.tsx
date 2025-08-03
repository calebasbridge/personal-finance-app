import React from 'react';
import CreditCardPaymentWizard from '../components/CreditCardPaymentWizard';

const CreditCardPaymentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <CreditCardPaymentWizard />
    </div>
  );
};

export default CreditCardPaymentPage;
