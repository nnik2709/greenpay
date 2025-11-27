import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api/client';

const LoginHistory = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [loginEvents, setLoginEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [filteredUserName, setFilteredUserName] = useState('');

  useEffect(() => {
    fetchLoginEvents();

    // Check if we came from Users page with a specific user filter
    if (location.state?.userName) {
      setFilteredUserName(location.state.userName);
    }
  }, [location.state]);

  useEffect(() => {
    filterEvents();
  }, [loginEvents, searchQuery, statusFilter]);

  const fetchLoginEvents = async () => {
    try {
      setLoading(true);
      const params = location.state?.userFilter
        ? { userId: location.state.userFilter, limit: 100 }
        : { limit: 100 };

      const response = await api.get('/login-events', { params });
      const data = response.loginEvents || response.data || response;

      setLoginEvents(data || []);
    } catch (error) {
      console.error('Error fetching login events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load login history"
      });
      setLoginEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = loginEvents;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.user_email?.toLowerCase().includes(query) ||
        event.user_name?.toLowerCase().includes(query) ||
        event.ip_address?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Login History
          </h1>
          {filteredUserName && (
            <p className="text-slate-600 mt-1">Showing login history for: <span className="font-medium">{filteredUserName}</span></p>
          )}
        </div>
        <div className="flex gap-2">
          {filteredUserName && (
            <Button
              onClick={() => navigate('/users')}
              variant="outline"
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            >
              ← Back to Users
            </Button>
          )}
          <Button
            onClick={fetchLoginEvents}
            variant="outline"
            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Show</span>
            <Select value={entriesPerPage.toString()} onValueChange={(val) => setEntriesPerPage(parseInt(val))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-600">entries</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Search:</span>
              <Input
                placeholder="Email, name, IP..."
                className="w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Date & Time</th>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">IP Address</th>
                <th scope="col" className="px-6 py-3">Device</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    {loginEvents.length === 0 ? 'No login events found.' : 'No events match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, entriesPerPage).map((event) => (
                  <tr key={event.id} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{formatDate(event.login_time)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{event.user_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">{event.user_email || event.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100">
                        {event.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.status === 'success'
                          ? 'text-white bg-green-600'
                          : 'text-white bg-red-600'
                      }`}>
                        {event.status === 'success' ? 'Success' : `Failed${event.failure_reason ? ': ' + event.failure_reason : ''}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono">{event.ip_address || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 truncate max-w-xs" title={event.user_agent}>
                          {event.user_agent ? (
                            event.user_agent.includes('Mobile') ? 'Mobile' :
                            event.user_agent.includes('Chrome') ? 'Chrome' :
                            event.user_agent.includes('Firefox') ? 'Firefox' :
                            event.user_agent.includes('Safari') ? 'Safari' : 'Browser'
                          ) : 'N/A'}
                        </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 text-sm text-slate-600">
          <div>Showing 1 to {Math.min(entriesPerPage, filteredEvents.length)} of {filteredEvents.length} entries</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-emerald-100 text-emerald-700">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginHistory;
