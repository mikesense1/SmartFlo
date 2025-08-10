import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Zap, Menu } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-slate-900">SmartFlo</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {location === "/" ? (
                <>
                  <button 
                    onClick={() => scrollToSection("features")}
                    className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => scrollToSection("pricing")}
                    className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Pricing
                  </button>
                  <button 
                    onClick={() => scrollToSection("testimonials")}
                    className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Reviews
                  </button>
                </>
              ) : (
                <>
                  <Link href="/" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                    Home
                  </Link>
                  <Link href="/features" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                    Features
                  </Link>
                  <Link href="/pricing" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                    Pricing
                  </Link>
                  <Link href="/about" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                    About
                  </Link>
                  <Link href="/freelancer-dashboard" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                    Freelancer
                  </Link>
                  <Link href="/client-dashboard" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors">
                    Client
                  </Link>
                </>
              )}
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
              <Link href="/dashboard">
                <Button className="bg-primary hover:bg-primary/90">
                  {location === "/" ? "Start Free Trial" : "Dashboard"}
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6 text-slate-600" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  {location === "/" ? (
                    <>
                      <button 
                        onClick={() => scrollToSection("features")}
                        className="text-left text-slate-600 hover:text-slate-900 py-2 text-sm font-medium"
                      >
                        Features
                      </button>
                      <button 
                        onClick={() => scrollToSection("pricing")}
                        className="text-left text-slate-600 hover:text-slate-900 py-2 text-sm font-medium"
                      >
                        Pricing
                      </button>
                      <button 
                        onClick={() => scrollToSection("testimonials")}
                        className="text-left text-slate-600 hover:text-slate-900 py-2 text-sm font-medium"
                      >
                        Reviews
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/freelancer-dashboard" onClick={() => setIsOpen(false)} className="text-left text-slate-600 hover:text-slate-900 py-2 text-sm font-medium">
                        Freelancer Dashboard
                      </Link>
                      <Link href="/client-dashboard" onClick={() => setIsOpen(false)} className="text-left text-slate-600 hover:text-slate-900 py-2 text-sm font-medium">
                        Client Dashboard
                      </Link>
                      <Link href="/pricing" onClick={() => setIsOpen(false)} className="text-left text-slate-600 hover:text-slate-900 py-2 text-sm font-medium">
                        Pricing
                      </Link>
                    </>
                  )}
                  <Button variant="ghost" className="justify-start text-slate-600 hover:text-slate-900">
                    Sign In
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
