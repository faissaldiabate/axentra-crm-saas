import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBackend } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Mail, Target } from 'lucide-react';

export function DashboardPage() {
  const backend = useBackend();

  const { data: leadsData } = useQuery({
    queryKey: ['leads', 'dashboard'],
    queryFn: () => backend.leads.list({ limit: 5 }),
  });

  const { data: reportData } = useQuery({
    queryKey: ['reports', 'weekly'],
    queryFn: () => backend.reports.generateWeeklyReport({}),
  });

  const stats = [
    {
      title: 'Total Leads',
      value: leadsData?.total || 0,
      icon: Users,
      description: 'Active leads in your pipeline',
    },
    {
      title: 'Average Score',
      value: reportData?.metrics.averageScore || 0,
      icon: Target,
      description: 'Lead engagement score',
    },
    {
      title: 'Follow-ups Sent',
      value: reportData?.metrics.followupsSent || 0,
      icon: Mail,
      description: 'This week',
    },
    {
      title: 'Conversion Rate',
      value: `${reportData?.metrics.conversionRate || 0}%`,
      icon: TrendingUp,
      description: 'Leads to customers',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your leads.</p>
      </div>

      {/* Stats Grid */}
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

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>Your latest leads and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {leadsData?.leads.length ? (
            <div className="space-y-4">
              {leadsData.leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{lead.name}</h3>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                    {lead.company && (
                      <p className="text-sm text-gray-500">{lead.company}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      lead.status === 'won' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Score: {lead.score}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
              <p className="text-gray-600">Start by adding your first lead to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
