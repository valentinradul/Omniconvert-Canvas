
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInvitationHandler } from "@/hooks/useInvitationHandler";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { invitationId, isProcessingInvitation } = useInvitationHandler();
  const [invitationDetails, setInvitationDetails] = useState<any>(null);
  
  // Load invitation details if invitation ID is present
  useEffect(() => {
    const loadInvitationDetails = async () => {
      if (!invitationId) return;
      
      try {
        const { data: invitation, error } = await supabase
          .from('company_invitations')
          .select(`
            id,
            email,
            role,
            companies (
              name
            )
          `)
          .eq('id', invitationId)
          .eq('accepted', false)
          .single();
          
        if (!error && invitation) {
          setInvitationDetails(invitation);
        }
      } catch (error) {
        console.error('Error loading invitation details:', error);
      }
    };
    
    loadInvitationDetails();
  }, [invitationId]);

  // If already authenticated and no invitation processing, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isProcessingInvitation) {
      // If there's no invitation, go to dashboard
      if (!invitationId) {
        navigate("/dashboard");
      }
      // If there's an invitation, the handler will process it
    }
  }, [isAuthenticated, isLoading, navigate, invitationId, isProcessingInvitation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: invitationDetails?.email || "",
      password: "",
    },
  });
  
  // Update form email when invitation details are loaded
  useEffect(() => {
    if (invitationDetails?.email) {
      form.setValue('email', invitationDetails.email);
    }
  }, [invitationDetails, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await login(values.email, values.password);
      // The invitation will be handled automatically by the useInvitationHandler hook after auth
      // No need to navigate here as the effect will handle it
    } catch (error) {
      // Error is handled in the auth context
      console.error("Login submission error:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectTo = invitationId 
        ? `${window.location.origin}/dashboard?invitation=${invitationId}`
        : `${window.location.origin}/dashboard`;
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo
        }
      });
      
      if (error) {
        if (error.message.includes('provider is not enabled')) {
          toast({
            variant: "destructive",
            title: "Google login is not enabled",
            description: "The administrator needs to configure Google authentication in Supabase.",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login with Google failed",
        description: error.message || "Please try again later",
      });
    }
  };

  // If checking auth status, show loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }
  
  // Show processing state when handling invitation
  if (isProcessingInvitation) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="mb-4">Processing your invitation...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
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
        
        {invitationDetails && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-1">You're invited!</h3>
            <p className="text-sm text-blue-600">
              Join <strong>{(invitationDetails.companies as any)?.name}</strong> as a{' '}
              <strong>{invitationDetails.role}</strong>
            </p>
          </div>
        )}

        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {invitationDetails ? 'Sign in to join the team' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link 
            to={invitationId ? `/signup?invitation=${invitationId}` : "/signup"} 
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        autoComplete="email" 
                        disabled={!!invitationDetails?.email}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        autoComplete="current-password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </Form>

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
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
