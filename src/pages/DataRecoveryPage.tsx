
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

interface StoredData {
  ideas?: any[];
  hypotheses?: any[];
  experiments?: any[];
}

const DataRecoveryPage: React.FC = () => {
  const [localData, setLocalData] = useState<StoredData>({});
  const [supabaseData, setSupabaseData] = useState<StoredData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('local');

  useEffect(() => {
    // Get data from localStorage
    const getLocalData = () => {
      try {
        const ideas = localStorage.getItem('ideas') ? JSON.parse(localStorage.getItem('ideas') || '[]') : [];
        const hypotheses = localStorage.getItem('hypotheses') ? JSON.parse(localStorage.getItem('hypotheses') || '[]') : [];
        const experiments = localStorage.getItem('experiments') ? JSON.parse(localStorage.getItem('experiments') || '[]') : [];
        
        setLocalData({ ideas, hypotheses, experiments });
        console.log('Local data loaded:', { ideas, hypotheses, experiments });
      } catch (err) {
        console.error('Error loading local data:', err);
        setError('Failed to load data from localStorage');
      }
    };

    // Get data from Supabase (bypassing RLS for recovery purposes)
    const getSupabaseData = async () => {
      try {
        // Try to get ideas from Supabase
        const { data: ideas, error: ideasError } = await supabase
          .from('ideas')
          .select('*');
        
        if (ideasError) throw ideasError;

        // Try to get hypotheses from Supabase
        const { data: hypotheses, error: hypothesesError } = await supabase
          .from('hypotheses')
          .select('*');
        
        if (hypothesesError) throw hypothesesError;

        // Try to get experiments from Supabase
        const { data: experiments, error: experimentsError } = await supabase
          .from('experiments')
          .select('*');
        
        if (experimentsError) throw experimentsError;

        setSupabaseData({ ideas, hypotheses, experiments });
        console.log('Supabase data loaded:', { ideas, hypotheses, experiments });
      } catch (err: any) {
        console.error('Error loading Supabase data:', err);
        setError(`Failed to load data from Supabase: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    getLocalData();
    getSupabaseData();
  }, []);

  const downloadData = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderDataTable = (data: any[], title: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-500">No {title.toLowerCase()} found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-medium">{title} ({data.length})</h3>
          <Button 
            variant="outline" 
            onClick={() => downloadData(data, `${title.toLowerCase()}.json`)}
            size="sm"
          >
            Export {title}
          </Button>
        </div>
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left text-sm">ID</th>
              {title === 'Ideas' && <th className="px-4 py-2 text-left text-sm">Title</th>}
              {title === 'Hypotheses' && <th className="px-4 py-2 text-left text-sm">Metric</th>}
              {title === 'Experiments' && <th className="px-4 py-2 text-left text-sm">Status</th>}
              <th className="px-4 py-2 text-left text-sm">User</th>
              <th className="px-4 py-2 text-left text-sm">Company ID</th>
              <th className="px-4 py-2 text-left text-sm">Created At</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2 text-sm">{item.id}</td>
                {title === 'Ideas' && <td className="px-4 py-2 text-sm">{item.title}</td>}
                {title === 'Hypotheses' && <td className="px-4 py-2 text-sm">{item.metric}</td>}
                {title === 'Experiments' && <td className="px-4 py-2 text-sm">{item.status}</td>}
                <td className="px-4 py-2 text-sm">{item.userName || item.userId || 'Unknown'}</td>
                <td className="px-4 py-2 text-sm">{item.companyId || 'None'}</td>
                <td className="px-4 py-2 text-sm">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDataSource = (data: StoredData, source: string) => {
    return (
      <div className="space-y-8">
        <div>
          <Button 
            onClick={() => downloadData(data, `all_${source}_data.json`)}
            className="mb-4"
          >
            Export All {source.charAt(0).toUpperCase() + source.slice(1)} Data
          </Button>
          
          {renderDataTable(data.ideas || [], 'Ideas')}
        </div>
        <div>
          {renderDataTable(data.hypotheses || [], 'Hypotheses')}
        </div>
        <div>
          {renderDataTable(data.experiments || [], 'Experiments')}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Data Recovery Tool</CardTitle>
          <CardDescription>
            This tool attempts to recover your ideas, hypotheses, and experiments from both localStorage and Supabase.
            Download the data as JSON to preserve it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center">
              <p>Loading data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
              <p className="text-sm mt-2">
                Note: You might need to be logged in to access Supabase data.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="local" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="local">Local Storage Data</TabsTrigger>
                <TabsTrigger value="supabase">Supabase Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="local">
                {renderDataSource(localData, 'local')}
              </TabsContent>
              
              <TabsContent value="supabase">
                {renderDataSource(supabaseData, 'supabase')}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataRecoveryPage;
