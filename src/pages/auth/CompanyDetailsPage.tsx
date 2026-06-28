import React from 'react';
import CompanyForm from '@/components/CompanyForm';

const CompanyDetailsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-primary mb-2">Complete Your Company Profile</h2>
          <p className="text-muted-foreground text-lg">This information helps candidates understand your company and culture. You can update it anytime in settings.</p>
        </div>
        <CompanyForm />
      </div>
    </div>
  );
};

export default CompanyDetailsPage;
