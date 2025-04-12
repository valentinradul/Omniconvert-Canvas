
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      { isAuthenticated }
    );
  }, [location.pathname, isAuthenticated]);

  // Function to export all localStorage data
  const exportAllData = () => {
    // Get all keys from localStorage
    const data = {};
    
    // Specifically extract app data keys
    const appDataKeys = ['ideas', 'hypotheses', 'experiments', 'departments'];
    
    appDataKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      } catch (e) {
        console.error(`Error parsing ${key} data:`, e);
      }
    });
    
    // Create a downloadable file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'growth-experiments-backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Your data has been exported to a JSON file.",
    });
  };

  // Function to export a specific data type
  const exportSpecificData = (key: string) => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const data = JSON.parse(value);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `growth-experiments-${key}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: `${key.charAt(0).toUpperCase() + key.slice(1)} Data Exported`,
          description: `Your ${key} data has been exported to a JSON file.`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: `No ${key} data was found in your browser storage.`,
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error(`Error exporting ${key} data:`, e);
      toast({
        title: "Export Error",
        description: `There was an error exporting your ${key} data.`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center p-8 max-w-md">
        {showRecovery ? (
          <Card className="w-[550px]">
            <CardHeader>
              <CardTitle className="text-xl">Data Recovery Tool</CardTitle>
              <CardDescription>Export your locally stored data</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="all">All Data</TabsTrigger>
                  <TabsTrigger value="ideas">Ideas</TabsTrigger>
                  <TabsTrigger value="hypotheses">Hypotheses</TabsTrigger>
                  <TabsTrigger value="experiments">Experiments</TabsTrigger>
                  <TabsTrigger value="departments">Departments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div className="space-y-4">
                    <p className="text-sm">Export all your stored data (Ideas, Hypotheses, Experiments, and Departments) as a single JSON file.</p>
                    <Button 
                      onClick={exportAllData} 
                      className="w-full"
                      size="lg"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export All Data
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="ideas">
                  <div className="space-y-4">
                    <p className="text-sm">Export only your saved Ideas as a JSON file.</p>
                    <Button 
                      onClick={() => exportSpecificData("ideas")} 
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Ideas
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="hypotheses">
                  <div className="space-y-4">
                    <p className="text-sm">Export only your saved Hypotheses as a JSON file.</p>
                    <Button 
                      onClick={() => exportSpecificData("hypotheses")} 
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Hypotheses
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="experiments">
                  <div className="space-y-4">
                    <p className="text-sm">Export only your saved Experiments as a JSON file.</p>
                    <Button 
                      onClick={() => exportSpecificData("experiments")} 
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Experiments
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="departments">
                  <div className="space-y-4">
                    <p className="text-sm">Export only your saved Departments as a JSON file.</p>
                    <Button 
                      onClick={() => exportSpecificData("departments")} 
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Departments
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowRecovery(false)}>Go Back</Button>
              <Button onClick={() => window.location.href = "/"}>Go to Home</Button>
            </CardFooter>
          </Card>
        ) : (
          <>
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
              <div className="pt-4">
                <Button variant="outline" size="sm" onClick={() => setShowRecovery(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Recover Your Data
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotFound;
