import { Button } from "@/components/ui/button";
import { Brain, Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-background/10 rounded-lg">
                <Brain className="w-6 h-6 text-background" />
              </div>
              <div>
                <h3 className="text-xl font-bold">HirerMind</h3>
                <p className="text-sm text-background/70">AI Recruitment Platform</p>
              </div>
            </div>
            <p className="text-background/70 text-sm leading-relaxed max-w-xs">
              Revolutionizing recruitment with AI-powered automation and intelligent candidate matching.
            </p>
            {/* Social links */}
            <div className="flex space-x-2 pt-2">
              <Button variant="ghost" size="icon" className="text-background/70 hover:text-background hover:bg-background/10">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background/70 hover:text-background hover:bg-background/10">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background/70 hover:text-background hover:bg-background/10">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background/70 hover:text-background hover:bg-background/10">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#features" className="hover:text-background transition-colors">Features</a></li>
              <li><a href="#pipeline" className="hover:text-background transition-colors">Pipeline</a></li>
              <li><a href="#analytics" className="hover:text-background transition-colors">Analytics</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-background transition-colors">API</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">About</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Press</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Status</a></li>
              <li>
                <Link to="/auth/login" className="hover:text-background transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-background transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-background transition-colors">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-background/70">
            © {new Date().getFullYear()} HirerMind. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
