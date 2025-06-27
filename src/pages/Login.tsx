
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { ultraCleanupAuthState } from "@/utils/authCleanup";
import { LoginPageHeader } from "@/components/auth/LoginPageHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useGoogleLogin } from "@/hooks/useGoogleLogin";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { handleGoogleLogin } = useGoogleLogin();
  
  // Ultra cleanup when component mounts for persistent login issues
  useEffect(() => {
    ultraCleanupAuthState();
  }, []);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      // Additional cleanup before login attempt
      await ultraCleanupAuthState();
      
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back to ExperimentFlow!",
      });
      
      // Use window.location.href for a clean navigation
      window.location.href = "/dashboard";
    } catch (error) {
      // Error is handled in the auth context
      console.error("Login submission error:", error);
    }
  };

  // If checking auth status, show loading
  if (isLoading && isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <LoginPageHeader />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm onSubmit={handleLogin} />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleLoginButton onClick={handleGoogleLogin} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
