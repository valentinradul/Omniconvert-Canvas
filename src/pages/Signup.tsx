
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SignupForm, { SignupFormData } from "@/components/auth/SignupForm";
import GoogleSignupButton from "@/components/auth/GoogleSignupButton";
import SignupDivider from "@/components/auth/SignupDivider";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signup, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Redirect to onboarding instead of dashboard
      navigate("/onboarding-team-invite");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  const handleFormSubmit = async (values: SignupFormData) => {
    try {
      setIsSubmitting(true);
      await signup(values.email, values.password, values.name);
      // User will be redirected to onboarding page after successful signup
      // (handled in the useEffect above)
    } catch (error) {
      // Error is handled in the auth context
      console.error("Signup submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding-team-invite` // Redirect to onboarding
        }
      });
      
      if (error) {
        if (error.message.includes('provider is not enabled')) {
          toast({
            variant: "destructive",
            title: "Google signup is not enabled",
            description: "The administrator needs to configure Google authentication in Supabase.",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup with Google failed",
        description: error.message || "Please try again later",
      });
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
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="absolute top-8 left-8">
          <Link to="/" className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Homepage
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignupForm 
            onSubmit={handleFormSubmit} 
            isSubmitting={isSubmitting} 
          />
          
          <div className="mt-6">
            <SignupDivider />
            <div className="mt-6">
              <GoogleSignupButton onClick={handleGoogleSignup} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
