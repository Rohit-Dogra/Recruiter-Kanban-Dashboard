import { useEffect, useState, useCallback, useRef } from "react";
import { Command } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, FileText, Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResults {
  jobs: Array<{ id: number; title: string; company?: string; location?: string; status?: string }>;
  candidates: Array<{ id: number; firstName: string; lastName: string; email: string; currentTitle?: string }>;
  pages: Array<{ name: string; path: string; description: string }>;
}

const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ jobs: [], candidates: [], pages: [] });
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults({ jobs: [], candidates: [], pages: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get("/search", { params: { q } });
      setResults(res.data);
    } catch {
      setResults({ jobs: [], candidates: [], pages: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ jobs: [], candidates: [], pages: [] });
    }
  }, [open]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const hasResults = results.jobs.length > 0 || results.candidates.length > 0 || results.pages.length > 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[20%] z-50 w-full max-w-lg translate-x-[-50%] rounded-xl border bg-background shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2"
          aria-label="Command palette"
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search across jobs, candidates, and pages
          </DialogPrimitive.Description>
          <Command className="rounded-xl" shouldFilter={false}>
            <Command.Input
              placeholder="Search jobs, candidates, pages…"
              value={query}
              onValueChange={setQuery}
              className="h-12 w-full border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Command.List className="max-h-80 overflow-y-auto p-2">
              {loading && (
                <Command.Loading>
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching…
                  </div>
                </Command.Loading>
              )}

              {!loading && query.trim().length >= 2 && !hasResults && (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
              )}

              {results.jobs.length > 0 && (
                <Command.Group heading="Jobs" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {results.jobs.map((job) => (
                    <Command.Item
                      key={`job-${job.id}`}
                      value={`job-${job.id}`}
                      onSelect={() => handleSelect(`/dashboard/jobs`)}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate font-medium">{job.title}</span>
                        {(job.location || job.status) && (
                          <span className="truncate text-xs text-muted-foreground">
                            {[job.location, job.status].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results.candidates.length > 0 && (
                <Command.Group heading="Candidates" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {results.candidates.map((candidate) => (
                    <Command.Item
                      key={`candidate-${candidate.id}`}
                      value={`candidate-${candidate.id}`}
                      onSelect={() => handleSelect(`/dashboard/candidates`)}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate font-medium">
                          {candidate.firstName} {candidate.lastName}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {candidate.currentTitle || candidate.email}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results.pages.length > 0 && (
                <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {results.pages.map((page) => (
                    <Command.Item
                      key={`page-${page.path}`}
                      value={`page-${page.path}`}
                      onSelect={() => handleSelect(page.path)}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate font-medium">{page.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{page.description}</span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default CommandPalette;
