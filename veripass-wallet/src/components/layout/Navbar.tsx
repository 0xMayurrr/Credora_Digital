import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Shield, Menu, LogOut, User, LayoutDashboard, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
    if (isAuthenticated) return null;
    return (
      <>
        <Link
          to="/about"
          onClick={() => mobile && setOpen(false)}
          className="text-sm font-medium text-[hsl(220,40%,13%)] hover:text-[hsl(218,72%,23%)] transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
        >
          About
        </Link>
        <Link
          to="/verify"
          onClick={() => mobile && setOpen(false)}
          className="text-sm font-medium text-[hsl(220,40%,13%)] hover:text-[hsl(218,72%,23%)] transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
        >
          Verify Credentials
        </Link>
        <Link
          to="/gov"
          onClick={() => mobile && setOpen(false)}
          className="text-sm font-medium text-[hsl(220,40%,13%)] hover:text-[hsl(218,72%,23%)] transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
        >
          Gov Portal
        </Link>
      </>
    );
  };

  return (
    <>
      {/* Official Government Top Stripe */}
      <div className="gov-top-stripe w-full fixed top-0 left-0 right-0 z-[60]" />

      <nav
        className={`fixed top-1 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200"
            : "bg-white border-b border-gray-200"
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Official Logo & Badge */}
          <Link to="/" className="flex items-center gap-3 group" id="nav-home-link">
            <div className="w-10 h-10">
              <img src="/credora-high-resolution-logo-transparent.png" alt="Credora" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-[hsl(218,72%,23%)] tracking-tight leading-tight">
                Credora
              </span>
              <span className="text-[10px] font-semibold text-[hsl(220,10%,45%)] uppercase tracking-[0.1em] leading-tight">
                Digital Identity Service
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLinks />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-[hsl(218,72%,23%)] hover:bg-[hsl(218,72%,23%)/0.05] font-medium"
                    id="nav-dashboard-btn"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-[hsl(220,40%,13%)] hover:bg-gray-50 font-medium"
                    id="nav-profile-btn"
                  >
                    <User className="h-4 w-4" />
                    {user?.name}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  id="nav-logout-btn"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/signup">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[hsl(218,72%,23%)] hover:bg-[hsl(218,72%,23%)/0.05] font-medium"
                    id="nav-login-btn"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="bg-[hsl(218,72%,23%)] text-white hover:bg-[hsl(218,72%,28%)] font-semibold shadow-sm px-5"
                    id="nav-signup-btn"
                  >
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-[hsl(218,72%,23%)]" id="nav-mobile-menu-btn">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-white border-l border-gray-200 w-80">
              {/* Mobile Header */}
              <div className="flex items-center gap-3 mb-8 mt-4">
                <div className="w-9 h-9">
                  <img src="/credora-high-resolution-logo-transparent.png" alt="Credora Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[hsl(218,72%,23%)]">Credora</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Digital Identity Service</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <NavLinks mobile />
                <div className="border-t border-gray-200 pt-4 mt-2 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <>
                      <Link to="/dashboard" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-[hsl(218,72%,23%)] hover:bg-gray-50 font-medium">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Button>
                      </Link>
                      <Link to="/profile" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-gray-50 font-medium">
                          <User className="h-4 w-4" /> Profile
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                        className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 font-medium"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/signup" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start font-medium text-[hsl(218,72%,23%)]">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/signup" onClick={() => setOpen(false)}>
                        <Button className="w-full bg-[hsl(218,72%,23%)] text-white hover:bg-[hsl(218,72%,28%)] font-semibold">
                          Create Account
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
