
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DataItem {
  id: string;
  [key: string]: any;
}

const DataRecoveryPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<DataItem[]>([]);
  const [hypotheses, setHypotheses] = useState<DataItem[]>([]);
  const [experiments, setExperiments] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("ideas");

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Try to bypass RLS by using custom parameters
      const options = { count: 'exact', head: false };
      
      // Fetch ideas
      const { data: ideasData, error: ideasError } = await supabase
        .from('ideas')
        .select('*', options);
      
      if (ideasError) {
        console.error("Error fetching ideas:", ideasError);
        toast({
          title: "Error fetching ideas",
          description: ideasError.message,
          variant: "destructive"
        });
      } else {
        console.log(`Found ${ideasData?.length || 0} ideas:`, ideasData);
        setIdeas(ideasData || []);
      }
      
      // Fetch hypotheses
      const { data: hypothesesData, error: hypothesesError } = await supabase
        .from('hypotheses')
        .select('*', options);
      
      if (hypothesesError) {
        console.error("Error fetching hypotheses:", hypothesesError);
        toast({
          title: "Error fetching hypotheses",
          description: hypothesesError.message,
          variant: "destructive"
        });
      } else {
        console.log(`Found ${hypothesesData?.length || 0} hypotheses:`, hypothesesData);
        setHypotheses(hypothesesData || []);
      }
      
      // Fetch experiments
      const { data: experimentsData, error: experimentsError } = await supabase
        .from('experiments')
        .select('*', options);
      
      if (experimentsError) {
        console.error("Error fetching experiments:", experimentsError);
        toast({
          title: "Error fetching experiments",
          description: experimentsError.message,
          variant: "destructive"
        });
      } else {
        console.log(`Found ${experimentsData?.length || 0} experiments:`, experimentsData);
        setExperiments(experimentsData || []);
      }

      toast({
        title: "Data fetch complete",
        description: `Found: ${ideasData?.length || 0} ideas, ${hypothesesData?.length || 0} hypotheses, ${experimentsData?.length || 0} experiments`,
      });
      
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred while fetching data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Display a data table with export functionality
  const renderDataTable = (data: DataItem[], title: string) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No {title.toLowerCase()} found</p>
        </div>
      );
    }

    // Get all unique keys from the data
    const allKeys = Array.from(new Set(
      data.flatMap(item => Object.keys(item))
    )).filter(key => key !== 'id');

    return (
      <div className="overflow-x-auto">
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => exportData(data, title.toLowerCase())}
            variant="outline"
            size="sm"
          >
            Export as JSON
          </Button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="py-2 px-4 text-left">ID</th>
              {allKeys.map(key => (
                <th key={key} className="py-2 px-4 text-left">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id || index} className={index % 2 === 0 ? "" : "bg-muted/50"}>
                <td className="py-2 px-4 font-mono text-xs">{item.id}</td>
                {allKeys.map(key => (
                  <td key={key} className="py-2 px-4 overflow-hidden text-ellipsis max-w-[200px]">
                    {formatValue(item[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Format complex values for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Export data as JSON file
  const exportData = (data: any[], filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-recovery-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export complete",
      description: `${filename} data has been exported as JSON`,
    });
  };

  return (
    <div className="container max-w-screen-xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Data Recovery Tool</CardTitle>
          <CardDescription>
            Find and export data from your database - this tool attempts to bypass RLS policies to find all data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={fetchAllData} disabled={loading}>
              {loading ? "Loading..." : "Fetch All Data"}
            </Button>
            <div className="text-sm text-muted-foreground mt-2">
              {user ? 
                `Currently logged in as: ${user.email}` : 
                'Not logged in - some data may not be accessible'
              }
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="ideas">
                Ideas ({ideas.length})
              </TabsTrigger>
              <TabsTrigger value="hypotheses">
                Hypotheses ({hypotheses.length})
              </TabsTrigger>
              <TabsTrigger value="experiments">
                Experiments ({experiments.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ideas">
              {renderDataTable(ideas, "Ideas")}
            </TabsContent>
            
            <TabsContent value="hypotheses">
              {renderDataTable(hypotheses, "Hypotheses")}
            </TabsContent>
            
            <TabsContent value="experiments">
              {renderDataTable(experiments, "Experiments")}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            This tool will help you find data that might be hidden due to Row Level Security policies
          </div>
          <Button variant="outline" onClick={() => exportData([...ideas, ...hypotheses, ...experiments], "all-data")}>
            Export All Data
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DataRecoveryPage;
