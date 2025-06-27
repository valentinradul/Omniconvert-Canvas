
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const LoginPageHeader = () => {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Homepage
        </Link>
      </div>
      <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Sign in to your account</h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Or{" "}
        <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
          create a free account
        </Link>
      </p>
    </div>
  );
};
