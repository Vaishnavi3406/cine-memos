import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, History, Settings, LogOut, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAuthOpen(false);
      setEmail("");
      setPassword("");
    } catch (e: any) {
      setAuthError(e.message || "Sign in failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setAuthOpen(false);
      setEmail("");
      setPassword("");
    } catch (e: any) {
      setAuthError(e.message || "Sign up failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Home", icon: FileText },
    { href: "/history", label: "History", icon: History },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-glow bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-poppins text-xl font-bold gradient-text">ZapNote</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(href)
                    ? 'text-primary bg-primary/10 border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.name || "User"} />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white">
                        {profile?.name?.[0] || user.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card/95 backdrop-blur-xl border-glow" align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-box film-button">Sign In / Sign Up</Button>
                </DialogTrigger>
                <DialogContent className="bg-card/95 backdrop-blur-xl border-glow">
                  <DialogHeader>
                    <DialogTitle className="gradient-text">Welcome to ZapNote</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="signin" className="mt-4">
                    <TabsList className="bg-card/50 border-glow grid grid-cols-2">
                      <TabsTrigger value="signin" className="film-button">Sign In</TabsTrigger>
                      <TabsTrigger value="signup" className="film-button">Sign Up</TabsTrigger>
                    </TabsList>
                    <div className="mt-4 space-y-3">
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background/60 border-glow"
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background/60 border-glow"
                      />
                      {authError && (
                        <p className="text-sm text-destructive">{authError}</p>
                      )}
                    </div>
                    <TabsContent value="signin" className="mt-4">
                      <Button className="w-full glow-box film-button" onClick={handleSignIn} disabled={authLoading}>
                        {authLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </TabsContent>
                    <TabsContent value="signup" className="mt-4">
                      <Button className="w-full glow-box film-button" onClick={handleSignUp} disabled={authLoading}>
                        {authLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-glow py-4 animate-slide-up">
            <div className="flex flex-col space-y-2">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(href)
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
              {user ? (
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                  <DialogTrigger asChild>
                    <Button className="glow-box film-button">Sign In / Sign Up</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card/95 backdrop-blur-xl border-glow">
                    <DialogHeader>
                      <DialogTitle className="gradient-text">Welcome to ZapNote</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="signin" className="mt-4">
                      <TabsList className="bg-card/50 border-glow grid grid-cols-2">
                        <TabsTrigger value="signin" className="film-button">Sign In</TabsTrigger>
                        <TabsTrigger value="signup" className="film-button">Sign Up</TabsTrigger>
                      </TabsList>
                      <div className="mt-4 space-y-3">
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-background/60 border-glow"
                        />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background/60 border-glow"
                        />
                        {authError && (
                          <p className="text-sm text-destructive">{authError}</p>
                        )}
                      </div>
                      <TabsContent value="signin" className="mt-4">
                        <Button className="w-full glow-box film-button" onClick={handleSignIn} disabled={authLoading}>
                          {authLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                      </TabsContent>
                      <TabsContent value="signup" className="mt-4">
                        <Button className="w-full glow-box film-button" onClick={handleSignUp} disabled={authLoading}>
                          {authLoading ? 'Creating account...' : 'Create Account'}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;