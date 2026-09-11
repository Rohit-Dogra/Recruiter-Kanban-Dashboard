import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Search, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CandidateLayout from "@/layouts/CandidateLayout";
import candidateAuthService from "@/services/candidate-auth.service";
import companyService from "@/services/company.service";
import { useToast } from "@/hooks/use-toast";

const AllCompaniesPage = () => {
  const [candidate, setCandidate] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const candidateData = candidateAuthService.getCurrentCandidate();
    setCandidate(candidateData);
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, companies]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyService.getAllCompanies();
      
      if (response.success) {
        setCompanies(response.companies);
        setFilteredCompanies(response.companies);
      }
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
  };
  
  const handleViewCompany = (company: any) => {
    navigate(`/careers?company=${company.id}&u=${company.userId}`);
  };

  if (loading) {
    return (
      <CandidateLayout hideFooter>
        <div className="max-w-7xl mx-auto py-12">
          <div className="text-center py-20">
            <div className="relative inline-flex">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-primary border-r-primary/60"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-lg text-muted-foreground mt-6 font-medium">Discovering amazing companies...</p>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout hideFooter>
      
      <div className="max-w-7xl mx-auto pb-16">
        {/* Header Section with Gradient */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-info/10 to-primary/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-surface/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-info to-primary rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-info to-primary bg-clip-text text-transparent">
                Explore Companies
              </h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5 text-success" />
              <p className="text-lg font-medium">
                <span className="text-2xl font-bold text-foreground">{companies.length}</span> companies hiring now
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Section - Combined in One Card */}
        <Card className="mb-8 border-none shadow-2xl bg-surface/90 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-info/5 to-primary/5 pointer-events-none"></div>
          <CardContent className="p-8 relative">
            {/* Combined Search Bar with Dropdown */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-info to-primary rounded-2xl opacity-0 group-focus-within:opacity-10 transition-opacity duration-300 blur-xl pointer-events-none"></div>
              
              {/* Search Input */}
              <div className="relative z-10 flex items-center gap-4 bg-surface border-2 border-border rounded-2xl shadow-lg focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all duration-300">
                {/* Search Icon */}
                <Search className="ml-5 text-muted-foreground w-6 h-6 transition-colors group-focus-within:text-blue-600 flex-shrink-0" />
                
                {/* Search Input */}
                <Input
                  placeholder="Search by company name, industry, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg py-7 px-0 shadow-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Grid with Enhanced Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company, index) => (
              <Card 
                key={company.id} 
                className="group relative border-none shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden bg-surface/90 backdrop-blur-sm transform hover:-translate-y-2"
                onClick={() => handleViewCompany(company)}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards',
                  opacity: 0
                }}
              >
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-info/0 to-primary/0 group-hover:from-info/5 group-hover:to-primary/5 transition-all duration-500"></div>
                
                {/* Decorative Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info via-primary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                
                <CardContent className="p-6 relative">
                  {/* Header Section - Logo + Company Name + Location */}
                  <div className="flex items-start gap-4 mb-6">
                    {/* Company Logo */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-info to-primary rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-info via-primary to-primary rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-500 shadow-lg">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-info transition-colors duration-300 truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{company.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Industry and Job Count */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-foreground/80 rounded-full text-sm font-medium border border-info/14">
                      {company.industry}
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-foreground/80 rounded-full text-sm font-medium border border-success/14">
                      {company.jobCount || 0} Open Jobs
                    </span>
                  </div>

                  {/* View Profile Link */}
                  <Button 
                    className="w-auto bg-transparent hover:bg-blue-50 text-info hover:text-info font-semibold py-2 px-0 rounded-none shadow-none border-none justify-start p-0 h-auto group/link"
                  >
                    <span className="flex items-center gap-2">
                      View Profile
                      <span className="transform group-hover/link:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="border-none shadow-2xl bg-surface/90 backdrop-blur-sm">
                <CardContent className="p-16 text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl blur-2xl opacity-50"></div>
                    <div className="relative p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl">
                      <Building2 className="w-20 h-20 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">No companies found</h3>
                  <p className="text-lg text-muted-foreground">
                    {searchTerm
                      ? "Try adjusting your search criteria" 
                      : "No companies available at the moment"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </CandidateLayout>
  );
};

export default AllCompaniesPage;