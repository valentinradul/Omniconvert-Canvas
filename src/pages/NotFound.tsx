
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      { isAuthenticated }
    );
  }, [location.pathname, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center p-8 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-2xl text-gray-700 mb-6">Page not found</p>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for.
          The page might have been removed, renamed, or is temporarily unavailable.
        </p>
        <div className="space-y-4">
          <Button asChild size="lg" className="bg-omni-blue hover:bg-omni-blue/90">
            <Link to={isAuthenticated ? "/dashboard" : "/"}>
              {isAuthenticated ? "Return to Dashboard" : "Return to Home"}
            </Link>
          </Button>
          <div className="text-gray-500 text-sm pt-4">
            Path: <code className="bg-gray-100 p-1 rounded">{location.pathname}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
