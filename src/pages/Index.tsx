
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import patagoniaLogo from '@/assets/logos/patagonia-logo.png';
import catLogo from '@/assets/logos/cat-logo.png';
import tempurLogo from '@/assets/logos/tempur-logo.webp';
import orangeLogo from '@/assets/logos/orange-logo.svg';
import kitchenaidLogo from '@/assets/logos/kitchenaid-logo.png';

const Index = () => {
  return (
    <div className="min-h-screen font-inter">
      <header className="bg-gradient-omni text-black">
        <div className="container mx-auto px-6 py-6">
          <nav className="flex justify-between items-center mb-16">
            <Logo className="flex items-center" />
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#features" className="hover:text-omni-blue">Our software</a>
              <a href="#services" className="hover:text-omni-blue">Services</a>
              <a href="#pricing" className="hover:text-omni-blue">Pricing</a>
              <a href="#about" className="hover:text-omni-blue">About</a>
            </div>
            <div className="space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-black hover:bg-black/5">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-omni-blue text-white hover:bg-omni-blue/90 rounded-full">
                  Create account
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </nav>
          
          <div className="flex flex-col lg:flex-row items-center gap-12 py-12">
            <div className="lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-black">
                Turn growth ideas into experiments
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-lg">
                Streamline your growth experiments from ideation to execution with our powerful tools.
              </p>
              <div className="pt-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-omni-blue text-white hover:bg-omni-blue/90 rounded-full">
                    Start now for free
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2">
              <img 
                src="/lovable-uploads/9aebc784-15b2-4b07-8054-818548d44392.png"
                alt="Growth experiment illustration" 
                className="w-full"
              />
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">All-in-one Growth Experiment Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your growth process from ideation to execution with our powerful tools
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-omni-light-blue text-omni-blue p-3 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Idea Backlog</h3>
              <p className="text-gray-600">Collect and organize growth ideas from your team in one centralized place.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-omni-light-blue text-omni-blue p-3 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 01 18 16.5h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Hypothesis Builder</h3>
              <p className="text-gray-600">Turn your ideas into structured hypotheses with our easy-to-use builder.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="bg-omni-light-blue text-omni-blue p-3 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Experiment Tracker</h3>
              <p className="text-gray-600">Track the progress and results of your experiments in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 bg-gradient-omni">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">Our Products are trusted by companies everywhere:</h2>
            <p className="text-xl text-gray-600">Join hundreds of teams that use OmniConvert products to drive growth</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-16">
            <div className="w-48 h-20 flex items-center justify-center">
              <img src={patagoniaLogo} alt="Patagonia" className="max-h-16 max-w-full object-contain" />
            </div>
            <div className="w-48 h-20 flex items-center justify-center">
              <img src={catLogo} alt="CAT" className="max-h-16 max-w-full object-contain" />
            </div>
            <div className="w-48 h-20 flex items-center justify-center">
              <img src={tempurLogo} alt="Tempur" className="max-h-16 max-w-full object-contain" />
            </div>
            <div className="w-48 h-20 flex items-center justify-center">
              <img src={orangeLogo} alt="Orange" className="max-h-16 max-w-full object-contain" />
            </div>
            <div className="w-48 h-20 flex items-center justify-center">
              <img src={kitchenaidLogo} alt="KitchenAid" className="max-h-16 max-w-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-omni-blue py-20 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to accelerate your growth?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Start turning your growth ideas into experiments today. No credit card required.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-omni-blue hover:bg-gray-100 rounded-full">
              Start now for free
            </Button>
          </Link>
        </div>
      </section>

      <footer id="about" className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ExperimentFlow</h3>
              <p className="text-gray-400">The complete growth experimentation platform</p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Case Studies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2025 ExperimentFlow. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
