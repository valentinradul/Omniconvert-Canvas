import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { formatCurrencyEUR, formatNumber } from '../types';

interface ExportButtonProps {
  calculations: any;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ calculations }) => {
  const exportToCSV = () => {
    const data = [
      ['Metric', 'Value'],
      ['Total Contacts', formatNumber(calculations.totalContacts)],
      ['Total Emails', formatNumber(calculations.totalEmails)],
      ['Email Addresses Needed', calculations.emailAddressesNeeded],
      ['Domains Needed', calculations.domainsNeeded],
      ['LinkedIn Accounts Needed', calculations.linkedinAccountsNeeded],
      ['LinkedIn Invites', formatNumber(calculations.linkedinInvitesNeeded)],
      [''],
      ['Cost Breakdown', ''],
      ['Email Costs', formatCurrencyEUR(calculations.emailCost)],
      ['Domain Costs', formatCurrencyEUR(calculations.domainCost)],
      ['LinkedIn Costs', formatCurrencyEUR(calculations.linkedinCost)],
      ['AI Generation Costs', formatCurrencyEUR(calculations.aiGenerationCost)],
      ['Scraping Costs', formatCurrencyEUR(calculations.scrapingCost)],
      ['Total Cost', formatCurrencyEUR(calculations.totalCost)],
      [''],
      ['Funnel Results', ''],
      ['Meetings Generated', formatNumber(calculations.meetings, 1)],
      ['Opportunities Created', formatNumber(calculations.opportunities, 1)],
      ['Customers Acquired', formatNumber(calculations.customers, 1)],
      ['Total Revenue', formatCurrencyEUR(calculations.revenue)],
      ['ROI (%)', formatNumber(calculations.roi, 1) + '%'],
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'gtm-outreach-results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GTM Outreach Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section h3 { border-bottom: 2px solid hsl(222, 47%, 11%); padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; }
          .highlight { background-color: #e3f2fd; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GTM Outreach Results</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h3>Campaign Overview</h3>
          <table>
            <tr><td>Total Contacts</td><td>${formatNumber(calculations.totalContacts)}</td></tr>
            <tr><td>Total Emails</td><td>${formatNumber(calculations.totalEmails)}</td></tr>
            <tr><td>Email Addresses Needed</td><td>${calculations.emailAddressesNeeded}</td></tr>
            <tr><td>Domains Needed</td><td>${calculations.domainsNeeded}</td></tr>
            <tr><td>LinkedIn Accounts Needed</td><td>${calculations.linkedinAccountsNeeded}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Cost Breakdown (EUR)</h3>
          <table>
            <tr><td>Email Costs</td><td>${formatCurrencyEUR(calculations.emailCost)}</td></tr>
            <tr><td>Domain Costs</td><td>${formatCurrencyEUR(calculations.domainCost)}</td></tr>
            <tr><td>LinkedIn Costs</td><td>${formatCurrencyEUR(calculations.linkedinCost)}</td></tr>
            <tr><td>AI Generation Costs</td><td>${formatCurrencyEUR(calculations.aiGenerationCost)}</td></tr>
            <tr><td>Scraping Costs</td><td>${formatCurrencyEUR(calculations.scrapingCost)}</td></tr>
            <tr class="highlight"><td>Total Cost</td><td>${formatCurrencyEUR(calculations.totalCost)}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Funnel Results</h3>
          <table>
            <tr><td>Meetings Generated</td><td>${formatNumber(calculations.meetings, 1)}</td></tr>
            <tr><td>Opportunities Created</td><td>${formatNumber(calculations.opportunities, 1)}</td></tr>
            <tr><td>Customers Acquired</td><td>${formatNumber(calculations.customers, 1)}</td></tr>
            <tr class="highlight"><td>Total Revenue</td><td>${formatCurrencyEUR(calculations.revenue)}</td></tr>
            <tr class="highlight"><td>ROI</td><td>${formatNumber(calculations.roi, 1)}%</td></tr>
          </table>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-2">
      <Button onClick={exportToCSV} className="w-full" variant="outline">
        <FileDown className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      <Button onClick={exportToPDF} className="w-full" variant="outline">
        <FileDown className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
};
