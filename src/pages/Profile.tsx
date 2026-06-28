import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import companyService, { Company } from '@/services/company.service';
import { useCompany } from '@/contexts/CompanyContext';

const Profile = () => {
  const navigate = useNavigate();
  const { refreshCompany } = useCompany();
  const [form, setForm] = useState<Company | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await companyService.getMyCompany();
        setForm(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load company data');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
    if (type === 'file' && files && files[0]) {
      setLogoFile(files[0]);
      setLogoPreview(URL.createObjectURL(files[0]));
    } else {
      setForm(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('industry', form.industry);
      formData.append('size', form.size);
      formData.append('location', form.location);
      if (form.website) formData.append('website', form.website);
      if (form.founded) formData.append('founded', form.founded);
      if (form.mission) formData.append('mission', form.mission);
      if (form.values) formData.append('values', form.values);
      if (form.culture) formData.append('culture', form.culture);
      if (logoFile) formData.append('logo', logoFile);
      await companyService.upsertCompany(formData);
      await refreshCompany();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading your company profile...</p>
      </div>
    );
  }

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'details', label: 'Details' },
    { id: 'culture', label: 'Culture & Values' },
  ];

  return (
    <div style={styles.page}>
      {/* Left sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarInner}>
          {/* Logo area */}
          <div style={styles.logoArea}>
            <div style={styles.avatarWrapper}>
              <div style={styles.avatar}>
                {(logoPreview || form?.logoUrl) ? (
                  <img src={logoPreview || form?.logoUrl} alt="Logo" style={styles.avatarImg} />
                ) : (
                  <span style={styles.avatarPlaceholder}>
                    {form?.name?.charAt(0) || 'C'}
                  </span>
                )}
              </div>
              <label style={styles.uploadBadge} htmlFor="logo-upload" title="Change logo">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <h3 style={styles.companyNameSidebar}>{form?.name || 'Your Company'}</h3>
            <span style={styles.industryBadge}>{form?.industry || 'Industry'}</span>
          </div>

          {/* Nav */}
          <nav style={styles.nav}>
            {sections.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                style={{
                  ...styles.navItem,
                  ...(activeSection === s.id ? styles.navItemActive : {}),
                }}
              >
                <span style={styles.navIcon}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>

          {/* Quick stats */}
          <div style={styles.statsBox}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Location</span>
              <span style={styles.statValue}>{form?.location || '—'}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Size</span>
              <span style={styles.statValue}>{form?.size || '—'}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Founded</span>
              <span style={styles.statValue}>{form?.founded || '—'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formHeader}>
            <div>
              <h1 style={styles.pageTitle}>Company Profile</h1>
              <p style={styles.pageSubtitle}>
                {activeSection === 'basic' && 'Update your core company information'}
                {activeSection === 'details' && 'Add website, founding year and description'}
                {activeSection === 'culture' && 'Share your mission, values and culture'}
              </p>
            </div>
            <div style={styles.headerActions}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} style={styles.saveBtn}>
                {saving ? (
                  <>
                    <span style={styles.btnSpinner} />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Section: Basic Info */}
          {activeSection === 'basic' && (
            <div style={styles.section}>
              <div style={styles.grid2}>
                <Field label="Company Name" required>
                  <input
                    name="name"
                    value={form?.name || ''}
                    onChange={handleChange}
                    required
                    placeholder="Acme Corp"
                    style={styles.input}
                  />
                </Field>
                <Field label="Industry" required>
                  <input
                    name="industry"
                    value={form?.industry || ''}
                    onChange={handleChange}
                    required
                    placeholder="Technology"
                    style={styles.input}
                  />
                </Field>
                <Field label="Company Size" required>
                  <input
                    name="size"
                    value={form?.size || ''}
                    onChange={handleChange}
                    required
                    placeholder="50–200 employees"
                    style={styles.input}
                  />
                </Field>
                <Field label="Location" required>
                  <input
                    name="location"
                    value={form?.location || ''}
                    onChange={handleChange}
                    required
                    placeholder="San Francisco, CA"
                    style={styles.input}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Section: Details */}
          {activeSection === 'details' && (
            <div style={styles.section}>
              <div style={styles.grid2}>
                <Field label="Website">
                  <input
                    name="website"
                    value={form?.website || ''}
                    onChange={handleChange}
                    placeholder="https://yourcompany.com"
                    style={styles.input}
                  />
                </Field>
                <Field label="Founded Year">
                  <input
                    name="founded"
                    value={form?.founded || ''}
                    onChange={handleChange}
                    placeholder="2018"
                    style={styles.input}
                  />
                </Field>
              </div>
              <Field label="Description" required hint="Describe what your company does">
                <textarea
                  name="description"
                  value={form?.description || ''}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="We build tools that help teams collaborate..."
                  style={styles.textarea}
                />
              </Field>
            </div>
          )}

          {/* Section: Culture */}
          {activeSection === 'culture' && (
            <div style={styles.section}>
              <Field label="Mission" hint="What drives your company forward?">
                <textarea
                  name="mission"
                  value={form?.mission || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Our mission is to..."
                  style={styles.textarea}
                />
              </Field>
              <Field label="Core Values" hint="What principles guide your team?">
                <textarea
                  name="values"
                  value={form?.values || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Integrity, Innovation, Collaboration..."
                  style={styles.textarea}
                />
              </Field>
              <Field label="Culture" hint="What's it like to work here?">
                <textarea
                  name="culture"
                  value={form?.culture || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="We foster an environment where..."
                  style={styles.textarea}
                />
              </Field>
            </div>
          )}

          {/* Section navigation */}
          <div style={styles.sectionNav}>
            {sections.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                style={{
                  ...styles.sectionDot,
                  ...(activeSection === s.id ? styles.sectionDotActive : {}),
                }}
              />
            ))}
            <div style={styles.sectionNavActions}>
              {activeSection !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = sections.findIndex(s => s.id === activeSection);
                    setActiveSection(sections[idx - 1].id);
                  }}
                  style={styles.prevBtn}
                >
                  ← Previous
                </button>
              )}
              {activeSection !== 'culture' && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = sections.findIndex(s => s.id === activeSection);
                    setActiveSection(sections[idx + 1].id);
                  }}
                  style={styles.nextBtn}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

const Field = ({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div style={styles.field}>
    <label style={styles.fieldLabel}>
      {label}
      {required && <span style={styles.required}>*</span>}
    </label>
    {hint && <p style={styles.fieldHint}>{hint}</p>}
    {children}
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f7f8fa',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  sidebar: {
    width: 260,
    minHeight: '100vh',
    background: '#fff',
    borderRight: '1px solid #e8eaed',
    flexShrink: 0,
    position: 'sticky' as any,
    top: 0,
    alignSelf: 'flex-start',
  },
  sidebarInner: {
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column' as any,
    gap: 28,
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column' as any,
    alignItems: 'center',
    gap: 10,
    paddingBottom: 24,
    borderBottom: '1px solid #f0f1f3',
  },
  avatarWrapper: {
    position: 'relative' as any,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '2px solid #e8eaed',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as any,
  },
  avatarPlaceholder: {
    fontSize: 28,
    fontWeight: 700,
    color: '#4285f4',
  },
  uploadBadge: {
    position: 'absolute' as any,
    bottom: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 8,
    background: '#4285f4',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '2px solid #fff',
  },
  companyNameSidebar: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
    textAlign: 'center' as any,
  },
  industryBadge: {
    fontSize: 11,
    fontWeight: 500,
    color: '#4285f4',
    background: '#e8f0fe',
    padding: '3px 10px',
    borderRadius: 20,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as any,
    gap: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    fontSize: 13.5,
    fontWeight: 500,
    color: '#666',
    cursor: 'pointer',
    textAlign: 'left' as any,
    transition: 'all 0.15s',
  },
  navItemActive: {
    background: '#e8f0fe',
    color: '#1967d2',
    fontWeight: 600,
  },
  navIcon: {
    fontSize: 16,
  },
  statsBox: {
    background: '#f7f8fa',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column' as any,
    gap: 0,
  },
  statItem: {
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column' as any,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: 500,
    textTransform: 'uppercase' as any,
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: 600,
  },
  statDivider: {
    height: 1,
    background: '#e8eaed',
  },
  main: {
    flex: 1,
    padding: '40px 48px',
    maxWidth: 820,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as any,
    gap: 28,
  },
  formHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 24,
    borderBottom: '1px solid #e8eaed',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#888',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    padding: '9px 18px',
    borderRadius: 10,
    border: '1px solid #e0e0e0',
    background: '#fff',
    fontSize: 13.5,
    fontWeight: 500,
    color: '#555',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '9px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #4285f4, #1967d2)',
    color: '#fff',
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    boxShadow: '0 2px 8px rgba(66,133,244,0.3)',
  },
  btnSpinner: {
    width: 12,
    height: 12,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 10,
    fontSize: 13.5,
    color: '#dc2626',
    fontWeight: 500,
  },
  section: {
    background: '#fff',
    borderRadius: 16,
    padding: '28px 32px',
    border: '1px solid #e8eaed',
    display: 'flex',
    flexDirection: 'column' as any,
    gap: 20,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as any,
    gap: 5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
  },
  required: {
    color: '#dc2626',
    marginLeft: 3,
  },
  fieldHint: {
    fontSize: 12,
    color: '#999',
    margin: 0,
  },
  input: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #e0e0e0',
    fontSize: 14,
    color: '#1a1a2e',
    background: '#fafafa',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    boxSizing: 'border-box' as any,
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #e0e0e0',
    fontSize: 14,
    color: '#1a1a2e',
    background: '#fafafa',
    outline: 'none',
    resize: 'vertical' as any,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box' as any,
    transition: 'border-color 0.15s',
  },
  sectionNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#d1d5db',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s',
  },
  sectionDotActive: {
    background: '#4285f4',
    width: 24,
    borderRadius: 4,
  },
  sectionNavActions: {
    marginLeft: 'auto',
    display: 'flex',
    gap: 8,
  },
  prevBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    background: '#fff',
    fontSize: 13,
    color: '#555',
    cursor: 'pointer',
    fontWeight: 500,
  },
  nextBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#4285f4',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 600,
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as any,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    background: '#f7f8fa',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #e0e0e0',
    borderTopColor: '#4285f4',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    margin: 0,
  },
};

export default Profile;
