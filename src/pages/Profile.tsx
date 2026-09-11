import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Heart,
  ImageUp,
  Info,
  MapPin,
  Users,
} from "lucide-react";

import companyService, { type Company } from "@/services/company.service";
import { useCompany } from "@/contexts/CompanyContext";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   COMPANY PROFILE
   Previously a 750-line page of hard-coded inline styles that only rendered
   correctly in light mode and ignored the app shell. Rebuilt as a three-step
   form inside the dashboard: same fields, same submit payload, now themable,
   responsive and keyboard-navigable.
   ══════════════════════════════════════════════════════════════════════════ */

const SECTIONS = [
  { id: "basic", label: "Basics", icon: Building2, blurb: "Your core company information" },
  { id: "details", label: "Details", icon: Info, blurb: "Website, founding year and description" },
  { id: "culture", label: "Culture", icon: Heart, blurb: "Mission, values and what it's like to work here" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const Profile = () => {
  const navigate = useNavigate();
  const { refreshCompany } = useCompany();

  const [form, setForm] = useState<Company | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("basic");

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await companyService.getMyCompany();
        setForm(data);
      } catch (err) {
        setError(
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            "Failed to load company data"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, []);

  // Revoke the object URL when the preview changes or the page unmounts.
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.type === "file" && target.files?.[0]) {
      setLogoFile(target.files[0]);
      setLogoPreview(URL.createObjectURL(target.files[0]));
    } else {
      const { name, value } = target;
      setForm((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("industry", form.industry);
      formData.append("size", form.size);
      formData.append("location", form.location);
      if (form.website) formData.append("website", form.website);
      if (form.founded) formData.append("founded", form.founded);
      if (form.mission) formData.append("mission", form.mission);
      if (form.values) formData.append("values", form.values);
      if (form.culture) formData.append("culture", form.culture);
      if (logoFile) formData.append("logo", logoFile);

      await companyService.upsertCompany(formData);
      await refreshCompany();

      // Confirm in place before leaving, so the save doesn't feel like a jump-cut.
      setSaved(true);
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to update company"
      );
    } finally {
      setSaving(false);
    }
  };

  const sectionIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const current = SECTIONS[sectionIndex];

  if (loading) {
    return (
      <div className="pb-4">
        <DashboardHeader title="Company profile" subtitle="Loading your workspace details" />
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-72 rounded-[var(--radius-2xl)]" />
          <Skeleton className="h-96 rounded-[var(--radius-2xl)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <DashboardHeader
        title="Company profile"
        subtitle={current.blurb}
        action={
          <Button
            variant="hero"
            size="sm"
            onClick={handleSubmit}
            loading={saving}
            loadingText="Saving…"
            success={saved}
            successText="Saved"
            icon={<Check className="h-4 w-4" />}
          >
            Save changes
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* ── Identity + section rail ── */}
        <div className="space-y-4">
          <Card padding="md" className="text-center">
            <div className="relative mx-auto w-fit">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-primary/18 to-primary/5 ring-1 ring-inset ring-border">
                {logoPreview || form?.logoUrl ? (
                  <img src={logoPreview || form?.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-3xl font-semibold text-primary">
                    {form?.name?.charAt(0) || "C"}
                  </span>
                )}
              </div>

              <label
                htmlFor="logo-upload"
                title="Change logo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-primary text-white shadow-glow transition-transform duration-200 hover:scale-110"
              >
                <ImageUp className="h-3.5 w-3.5" />
                <span className="sr-only">Upload a company logo</span>
                <input id="logo-upload" type="file" accept="image/*" onChange={handleChange} className="sr-only" />
              </label>
            </div>

            <h2 className="mt-4 truncate font-display text-base font-semibold text-foreground">
              {form?.name || "Your company"}
            </h2>
            <p className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {form?.industry || "Industry"}
            </p>

            <dl className="mt-5 space-y-0 divide-y divide-border/70 border-t border-border/70 text-left">
              {[
                { icon: MapPin, label: "Location", value: form?.location },
                { icon: Users, label: "Size", value: form?.size },
                { icon: Building2, label: "Founded", value: form?.founded },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <row.icon className="h-3 w-3" />
                    {row.label}
                  </dt>
                  <dd className="truncate text-[13px] font-medium text-foreground">{row.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <nav aria-label="Profile sections" className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col">
            {SECTIONS.map((s, i) => {
              const active = s.id === activeSection;
              const complete = i < sectionIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  aria-current={active}
                  className={cn(
                    "group relative flex w-full min-w-[160px] items-center gap-3 rounded-[var(--radius-lg)] border p-3 text-left transition-all duration-300 ease-expo",
                    active
                      ? "border-primary/30 bg-surface shadow-md"
                      : "border-border/60 bg-surface-2/50 hover:border-border-strong hover:bg-surface-2"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : complete
                          ? "bg-success/12 text-success"
                          : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <s.icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Step {i + 1}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-[13px] font-medium",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Form ── */}
        <Card className="min-w-0">
          <CardContent className="p-5 sm:p-7">
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-[var(--radius-md)] border border-destructive/25 bg-destructive/8 p-3.5 text-[13px] text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.26, ease: EASE.expo }}
                  className="space-y-5"
                >
                  {activeSection === "basic" && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Company name" htmlFor="name" required>
                        <Input
                          id="name"
                          name="name"
                          value={form?.name || ""}
                          onChange={handleChange}
                          required
                          placeholder="Acme Corp"
                        />
                      </Field>
                      <Field label="Industry" htmlFor="industry" required>
                        <Input
                          id="industry"
                          name="industry"
                          value={form?.industry || ""}
                          onChange={handleChange}
                          required
                          placeholder="Technology"
                        />
                      </Field>
                      <Field label="Company size" htmlFor="size" required>
                        <Input
                          id="size"
                          name="size"
                          value={form?.size || ""}
                          onChange={handleChange}
                          required
                          placeholder="50–200 employees"
                        />
                      </Field>
                      <Field label="Location" htmlFor="location" required>
                        <Input
                          id="location"
                          name="location"
                          value={form?.location || ""}
                          onChange={handleChange}
                          required
                          placeholder="San Francisco, CA"
                        />
                      </Field>
                    </div>
                  )}

                  {activeSection === "details" && (
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Website" htmlFor="website">
                          <Input
                            id="website"
                            name="website"
                            value={form?.website || ""}
                            onChange={handleChange}
                            placeholder="https://yourcompany.com"
                          />
                        </Field>
                        <Field label="Founded" htmlFor="founded">
                          <Input
                            id="founded"
                            name="founded"
                            value={form?.founded || ""}
                            onChange={handleChange}
                            placeholder="2018"
                          />
                        </Field>
                      </div>
                      <Field
                        label="Description"
                        htmlFor="description"
                        required
                        hint="This appears on your public careers page."
                      >
                        <Textarea
                          id="description"
                          name="description"
                          value={form?.description || ""}
                          onChange={handleChange}
                          required
                          rows={5}
                          placeholder="We build tools that help teams collaborate…"
                        />
                      </Field>
                    </>
                  )}

                  {activeSection === "culture" && (
                    <>
                      <Field label="Mission" htmlFor="mission" hint="What drives your company forward?">
                        <Textarea
                          id="mission"
                          name="mission"
                          value={form?.mission || ""}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Our mission is to…"
                        />
                      </Field>
                      <Field label="Core values" htmlFor="values" hint="What principles guide your team?">
                        <Textarea
                          id="values"
                          name="values"
                          value={form?.values || ""}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Integrity, innovation, collaboration…"
                        />
                      </Field>
                      <Field label="Culture" htmlFor="culture" hint="What's it like to work here?">
                        <Textarea
                          id="culture"
                          name="culture"
                          value={form?.culture || ""}
                          onChange={handleChange}
                          rows={4}
                          placeholder="We foster an environment where…"
                        />
                      </Field>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* ── Step navigation ── */}
              <div className="mt-7 flex items-center justify-between gap-3 border-t border-border/70 pt-5">
                <div className="flex gap-1.5" aria-hidden>
                  {SECTIONS.map((s, i) => (
                    <span
                      key={s.id}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-400 ease-expo",
                        i === sectionIndex ? "w-6 bg-primary" : "w-1.5 bg-border-strong"
                      )}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {sectionIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveSection(SECTIONS[sectionIndex - 1].id)}
                      icon={<ArrowLeft className="h-3.5 w-3.5" />}
                    >
                      Back
                    </Button>
                  )}
                  {sectionIndex < SECTIONS.length - 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveSection(SECTIONS[sectionIndex + 1].id)}
                      iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="hero"
                      size="sm"
                      loading={saving}
                      loadingText="Saving…"
                      success={saved}
                      successText="Saved"
                    >
                      Save changes
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/** Label + hint + control, with the label correctly bound to its input. */
const Field = ({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={htmlFor} required={required}>
      {label}
    </Label>
    {hint && <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
    {children}
  </div>
);

export default Profile;
