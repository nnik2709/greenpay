import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Monitor, User, Search, Filter, Download, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import ExportButton from '@/components/ExportButton';

const LoginHistory = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [loginEvents, setLoginEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUserName, setFilteredUserName] = useState('');

  useEffect(() => {
    fetchLoginEvents();
    fetchUsers();
    
    // Check if we came from Users page with a specific user filter
    if (location.state?.userFilter) {
      setUserFilter(location.state.userFilter);
      setFilteredUserName(location.state.userName || '');
    } else {
      setUserFilter('all');
    }
  }, [location.state]);

  useEffect(() => {
    filterEvents();
  }, [loginEvents, searchQuery, userFilter, dateFilter]);

  const fetchLoginEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('login_events')
        .select(`
          *,
          profiles!inner(
            id,
            full_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setLoginEvents(data || []);
    } catch (error) {
      console.error('Error fetching login events:', error);
      toast({
        title: "Error",
        description: "Failed to load login history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filterEvents = () => {
    let filtered = [...loginEvents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.profiles?.full_name?.toLowerCase().includes(query) ||
        event.profiles?.email?.toLowerCase().includes(query) ||
        event.ip_address?.toLowerCase().includes(query)
      );
    }

    // User filter
    if (userFilter && userFilter !== 'all') {
      filtered = filtered.filter(event => event.user_id === userFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.created_at);
        return eventDate >= filterDate && eventDate < nextDay;
      });
    }

    setFilteredEvents(filtered);
  };

  const getLocationFromIP = (ip) => {
    // Simple IP location detection (in production, use a proper geolocation service)
    if (ip === '127.0.0.1' || ip === '::1' || ip?.startsWith('192.168.') || ip?.startsWith('10.')) {
      return 'Local Network';
    }
    return ip || 'Unknown';
  };

  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const exportColumns = [
    { name: 'Date', selector: row => new Date(row.created_at).toLocaleString() },
    { name: 'User', selector: row => row.profiles?.full_name || 'Unknown' },
    { name: 'Email', selector: row => row.profiles?.email || 'Unknown' },
    { name: 'Role', selector: row => row.profiles?.role || 'Unknown' },
    { name: 'IP Address', selector: row => row.ip_address || 'Unknown' },
    { name: 'Location', selector: row => getLocationFromIP(row.ip_address) },
    { name: 'Browser', selector: row => getBrowserInfo(row.user_agent) },
    { name: 'Device', selector: row => getDeviceInfo(row.user_agent) },
  ];

  const stats = {
    total: filteredEvents.length,
    today: filteredEvents.filter(event => {
      const today = new Date();
      const eventDate = new Date(event.created_at);
      return eventDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: filteredEvents.filter(event => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(event.created_at) >= weekAgo;
    }).length,
    uniqueUsers: new Set(filteredEvents.map(event => event.user_id)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/users')}
            className="text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Login History
              {filteredUserName && (
                <span className="text-lg font-normal text-slate-600 ml-2">
                  for {filteredUserName}
                </span>
              )}
            </h1>
            <p className="text-slate-600 mt-1">
              {filteredUserName 
                ? `Login activity for ${filteredUserName}` 
                : 'Monitor user login activity and security events'
              }
            </p>
          </div>
        </div>
        <ExportButton
          data={filteredEvents}
          columns={exportColumns}
          filename={`Login_History_Report${filteredUserName ? `_${filteredUserName}` : ''}`}
          title="Login History Report"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-slate-500">Total Logins</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Today</p>
                <p className="text-2xl font-bold text-slate-800">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-slate-500">This Week</p>
                <p className="text-2xl font-bold text-slate-800">{stats.thisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-slate-500">Unique Users</p>
                <p className="text-2xl font-bold text-slate-800">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or IP..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Login Events ({filteredEvents.length} records)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No login events found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {event.profiles?.full_name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {event.profiles?.email || 'No email'} • {event.profiles?.role || 'No role'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{getLocationFromIP(event.ip_address)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-slate-400" />
                          <span>{getBrowserInfo(event.user_agent)} on {getDeviceInfo(event.user_agent)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginHistory;
