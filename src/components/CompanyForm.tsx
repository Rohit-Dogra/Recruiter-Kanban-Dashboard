import React, { useState, useEffect } from 'react';
import companyService, { CompanyData } from '@/services/company.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CompanyFormProps {
  onSuccess?: () => void;
}

const initialState: CompanyData = {
  name: '',
  description: '',
  website: '',
  industry: '',
  size: '',
  location: '',
  founded: '',
  mission: '',
  values: '',
  culture: '',
  logoUrl: ''
};

const CompanyForm: React.FC<CompanyFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<CompanyData>(initialState);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prefill from user table if available
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}');
      } catch {
        return {};
      }
    })();
    setForm(prev => ({
      ...prev,
      name: user.company || prev.name,
      size: user.teamSize || prev.size,
      // Optionally prefill other fields if available
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
    if (type === 'file' && files && files[0]) {
      setLogoFile(files[0]);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value ?? '');
      });
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      await companyService.upsertCompany(formData);
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Use navigate instead of window.location for better UX
        window.location.href = '/dashboard';
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err?.response?.data?.error || 'Failed to save company details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white/80 rounded-2xl shadow-lg p-8 space-y-6 border border-border/30 max-w-2xl mx-auto" onSubmit={handleSubmit}>
      <div className="text-center mb-6">
        <div className="mx-auto w-20 h-20 rounded-full shadow-md mb-2 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center overflow-hidden">
          {logoFile ? (
            <img src={URL.createObjectURL(logoFile)} alt="Company Logo" className="w-full h-full object-cover" />
          ) : (
            <img src={'/favicon.ico'} alt="Company Logo" className="w-12 h-12 object-cover opacity-60" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-primary mb-1">Company Profile</h2>
        <p className="text-muted-foreground">Tell candidates about your company and culture</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="name">Company Name</label>
          <Input name="name" id="name" value={form.name} onChange={handleChange} required placeholder="Your Company" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="size">Company Size</label>
          <Input name="size" id="size" value={form.size} onChange={handleChange} required placeholder="e.g. 51-200" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="industry">Industry</label>
          <Input name="industry" id="industry" value={form.industry} onChange={handleChange} required placeholder="e.g. Software, Finance" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="location">Location</label>
          <Input name="location" id="location" value={form.location} onChange={handleChange} required placeholder="e.g. New York, Remote" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="website">Website</label>
          <Input name="website" id="website" value={form.website} onChange={handleChange} placeholder="https://yourcompany.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="founded">Founded Year</label>
          <Input name="founded" id="founded" value={form.founded} onChange={handleChange} placeholder="e.g. 2012" />
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <label className="block text-sm font-semibold mb-1" htmlFor="description">Description</label>
        <Textarea name="description" id="description" value={form.description} onChange={handleChange} required placeholder="Describe your company, products, and mission..." />

        <label className="block text-sm font-semibold mb-1" htmlFor="mission">Mission</label>
        <Textarea name="mission" id="mission" value={form.mission} onChange={handleChange} placeholder="What is your company's mission?" />

        <label className="block text-sm font-semibold mb-1" htmlFor="values">Values</label>
        <Textarea name="values" id="values" value={form.values} onChange={handleChange} placeholder="What values define your company?" />

        <label className="block text-sm font-semibold mb-1" htmlFor="culture">Culture</label>
        <Textarea name="culture" id="culture" value={form.culture} onChange={handleChange} placeholder="Describe your company culture..." />

  <label className="block text-sm font-semibold mb-1" htmlFor="logo">Company Logo</label>
  <Input name="logo" id="logo" type="file" accept="image/*" onChange={handleChange} />
      </div>

      {error && <div className="text-destructive text-sm text-center mt-2">{error}</div>}
      <Button type="submit" disabled={loading} className="w-full mt-6 text-lg font-semibold py-3">
        {loading ? 'Saving...' : 'Save Company Details'}
      </Button>
    </form>
  );
};

export default CompanyForm;
