import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBackend } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, Users, Mail, Target } from 'lucide-react';

export function ReportsPage() {
  const [period, setPeriod] = useState('week');
  const backend = useBackend();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', 'weekly', period],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      
      if (period === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (period === 'quarter') {
        startDate.setMonth(endDate.getMonth() - 3);
      }

      return backend.reports.generateWeeklyReport({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    },
  });

  const handleExport = () => {
    if (reportData) {
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `axentra-report-${period}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const stats = reportData ? [
    {
      title: 'Leads Created',
      value: reportData.metrics.leadsCreated,
      icon: Users,
      description: `In the last ${period}`,
    },
    {
      title: 'Follow-ups Sent',
      value: reportData.metrics.followupsSent,
      icon: Mail,
      description: 'Automated messages',
    },
    {
      title: 'Average Score',
      value: reportData.metrics.averageScore,
      icon: Target,
      description: 'Lead engagement',
    },
    {
      title: 'Conversion Rate',
      value: `${reportData.metrics.conversionRate}%`,
      icon: TrendingUp,
      description: 'Leads to customers',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analyze your CRM performance and metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={!reportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reportData ? (
        <>
          {/* Period Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">Report Period</h2>
                <p className="text-gray-600">
                  {new Date(reportData.period.start).toLocaleDateString()} - {new Date(reportData.period.end).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts and Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Source */}
            <Card>
              <CardHeader>
                <CardTitle>Leads by Source</CardTitle>
                <CardDescription>Where your leads are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.leadsBySource.length > 0 ? (
                  <div className="space-y-3">
                    {reportData.leadsBySource.map((item) => (
                      <div key={item.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {item.source}
                          </Badge>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Leads by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Leads by Status</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.leadsByStatus.length > 0 ? (
                  <div className="space-y-3">
                    {reportData.leadsByStatus.map((item) => {
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'new': return 'bg-blue-100 text-blue-800';
                          case 'contacted': return 'bg-yellow-100 text-yellow-800';
                          case 'qualified': return 'bg-green-100 text-green-800';
                          case 'proposal': return 'bg-purple-100 text-purple-800';
                          case 'won': return 'bg-emerald-100 text-emerald-800';
                          case 'lost': return 'bg-red-100 text-red-800';
                          default: return 'bg-gray-100 text-gray-800';
                        }
                      };

                      return (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={`capitalize ${getStatusColor(item.status)}`}>
                              {item.status}
                            </Badge>
                          </div>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700">
                  During this {period}, you created <strong>{reportData.metrics.leadsCreated}</strong> new leads
                  and sent <strong>{reportData.metrics.followupsSent}</strong> follow-up messages.
                  Your leads have an average engagement score of <strong>{reportData.metrics.averageScore}</strong>
                  with a conversion rate of <strong>{reportData.metrics.conversionRate}%</strong>.
                </p>
                {reportData.leadsBySource.length > 0 && (
                  <p className="text-gray-700 mt-4">
                    Your top lead source was <strong>{reportData.leadsBySource[0].source}</strong> with{' '}
                    <strong>{reportData.leadsBySource[0].count}</strong> leads.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
              <p className="text-gray-600">Start adding leads to see your reports.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
