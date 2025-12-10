import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CreditCard, FileText, BarChart2, Settings, LogOut, ChevronDown, Ticket, FilePlus, UploadCloud, Building, FileSignature, Mail, ScanSearch, Menu, Lock, Key, Package } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import PasswordChangeModal from '@/components/PasswordChangeModal';

const reportSubItems = [
    { to: '/app/reports', icon: <BarChart2 className="h-4 w-4" />, label: 'Reports Dashboard' },
    { to: '/app/reports/passports', icon: <FileText className="h-4 w-4" />, label: 'Passport Reports' },
    { to: '/app/reports/individual-purchase', icon: <FilePlus className="h-4 w-4" />, label: 'Individual Purchase' },
    { to: '/app/reports/corporate-vouchers', icon: <Building className="h-4 w-4" />, label: 'Corporate Vouchers' },
    { to: '/app/reports/revenue-generated', icon: <CreditCard className="h-4 w-4" />, label: 'Revenue Generated' },
    { to: '/app/reports/bulk-passport-uploads', icon: <UploadCloud className="h-4 w-4" />, label: 'Bulk Uploads' },
    { to: '/app/reports/quotations', icon: <FileSignature className="h-4 w-4" />, label: 'Quotations' },
    { to: '/app/reports/refunded', icon: <FileText className="h-4 w-4" />, label: 'Refunded' },
    { to: '/app/reports/cash-reconciliation', icon: <CreditCard className="h-4 w-4" />, label: 'Cash Reconciliation' },
];

const navItemsByRole = {
  Flex_Admin: [{
    to: '/app/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Dashboard'
  }, {
    to: '/app/users',
    icon: <Users className="h-4 w-4" />,
    label: 'Users'
  }, {
    title: 'Passports',
    icon: <FileText className="h-4 w-4" />,
    base_path: '/app/passports',
    subItems: [{
      to: '/app/passports',
      icon: <FileText className="h-4 w-4" />,
      label: 'All Passports'
    }, {
      to: '/app/passports/create',
      icon: <FilePlus className="h-4 w-4" />,
      label: 'Individual Exit Pass'
    }, {
      to: '/app/passports/bulk-upload',
      icon: <UploadCloud className="h-4 w-4" />,
      label: 'Bulk Upload'
    }, {
      to: '/app/payments/corporate-exit-pass',
      icon: <Building className="h-4 w-4" />,
      label: 'Corporate Exit Pass'
    }, {
      to: '/app/payments/corporate-batch-history',
      icon: <Package className="h-4 w-4" />,
      label: 'Batch History'
    }, {
      to: '/app/vouchers-list',
      icon: <FileText className="h-4 w-4" />,
      label: 'Vouchers List'
    }, {
      to: '/app/scan',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Scan & Validate'
    }]
  }, {
    to: '/app/payments',
    icon: <CreditCard className="h-4 w-4" />,
    label: 'Payments'
  }, {
    title: 'Quotations & Invoices',
    icon: <FileSignature className="h-4 w-4" />,
    base_path: '/app/quotations',
    subItems: [{
      to: '/app/quotations',
      icon: <FileSignature className="h-4 w-4" />,
      label: 'Quotations'
    }, {
      to: '/app/invoices',
      icon: <FileText className="h-4 w-4" />,
      label: 'Tax Invoices'
    }]
  }, {
    title: 'Reports',
    icon: <BarChart2 className="h-4 w-4" />,
    base_path: '/app/reports',
    subItems: reportSubItems
  }, {
    title: 'Admin',
    icon: <Settings className="h-4 w-4" />,
    base_path: '/app/admin',
    subItems: [{
      to: '/app/admin/customers',
      icon: <Building className="h-4 w-4" />,
      label: 'Customers'
    }, {
      to: '/app/admin/settings',
      icon: <Settings className="h-4 w-4" />,
      label: 'System Settings'
    }, {
      to: '/app/admin/payment-modes',
      icon: <CreditCard className="h-4 w-4" />,
      label: 'Payment Modes'
    }, {
      to: '/app/admin/email-templates',
      icon: <Mail className="h-4 w-4" />,
      label: 'Email Templates'
    }]
  }],
  Finance_Manager: [{
    to: '/app/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Dashboard'
  }, {
    title: 'Passports',
    icon: <FileText className="h-4 w-4" />,
    base_path: '/app/passports',
    subItems: [{
      to: '/app/passports',
      icon: <FileText className="h-4 w-4" />,
      label: 'All Passports'
    }, {
      to: '/app/payments/corporate-exit-pass',
      icon: <Building className="h-4 w-4" />,
      label: 'Corporate Exit Pass'
    }, {
      to: '/app/vouchers-list',
      icon: <FileText className="h-4 w-4" />,
      label: 'Vouchers List'
    }, {
      to: '/app/scan',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Scan & Validate'
    }]
  }, {
    title: 'Quotations & Invoices',
    icon: <FileSignature className="h-4 w-4" />,
    base_path: '/app/quotations',
    subItems: [{
      to: '/app/quotations',
      icon: <FileSignature className="h-4 w-4" />,
      label: 'Quotations'
    }, {
      to: '/app/invoices',
      icon: <FileText className="h-4 w-4" />,
      label: 'Tax Invoices'
    }]
  }, {
    title: 'Reports',
    icon: <BarChart2 className="h-4 w-4" />,
    base_path: '/app/reports',
    subItems: reportSubItems
  }],
  Counter_Agent: [{
    to: '/app/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Dashboard'
  }, {
    title: 'Passports',
    icon: <FileText className="h-4 w-4" />,
    base_path: '/app/passports',
    subItems: [{
      to: '/app/passports',
      icon: <FileText className="h-4 w-4" />,
      label: 'All Passports'
    }, {
      to: '/app/passports/create',
      icon: <FilePlus className="h-4 w-4" />,
      label: 'Individual Exit Pass'
    }, {
      to: '/app/passports/bulk-upload',
      icon: <UploadCloud className="h-4 w-4" />,
      label: 'Bulk Upload'
    }, {
      to: '/app/payments/corporate-exit-pass',
      icon: <Building className="h-4 w-4" />,
      label: 'Corporate Exit Pass'
    }, {
      to: '/app/payments/corporate-batch-history',
      icon: <Package className="h-4 w-4" />,
      label: 'Batch History'
    }, {
      to: '/app/vouchers-list',
      icon: <FileText className="h-4 w-4" />,
      label: 'Vouchers List'
    }, {
      to: '/app/scan',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Scan & Validate'
    }]
  }, {
    to: '/app/payments',
    icon: <CreditCard className="h-4 w-4" />,
    label: 'Payments'
  }],
  IT_Support: [{
    to: '/app/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Dashboard'
  }, {
    to: '/app/users',
    icon: <Users className="h-4 w-4" />,
    label: 'Users'
  }, {
    title: 'Passports',
    icon: <FileText className="h-4 w-4" />,
    base_path: '/app/passports',
    subItems: [{
      to: '/app/passports',
      icon: <FileText className="h-4 w-4" />,
      label: 'All Passports'
    }, {
      to: '/app/vouchers-list',
      icon: <FileText className="h-4 w-4" />,
      label: 'Vouchers List'
    }, {
      to: '/app/scan',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Scan Exit Pass'
    }, {
      to: '/app/scanner-test',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Voucher Scanner'
    }]
  }, {
    to: '/app/invoices',
    icon: <FileText className="h-4 w-4" />,
    label: 'Invoices'
  }, {
    title: 'Reports',
    icon: <BarChart2 className="h-4 w-4" />,
    base_path: '/app/reports',
    subItems: reportSubItems
  }, {
    to: '/app/tickets',
    icon: <Ticket className="h-4 w-4" />,
    label: 'Support Tickets'
  }]
};
const NavItem = ({
  to,
  children,
  className,
  testId
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return <NavLink to={to} data-testid={testId} className={cn('transition-colors hover:text-white/90 text-white/70', isActive && 'text-white font-semibold', className)}>
      {children}
    </NavLink>;
};
const NavMenu = ({
  items
}) => {
  return <nav className="hidden md:flex items-center gap-6 text-sm font-medium" data-testid="main-navigation">
      {items.map((item, index) => item.subItems ? <DropdownMenu key={index}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-white/70 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white p-0 h-auto flex items-center gap-1"
                data-testid={`nav-menu-${item.title?.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.title}
                <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-testid={`nav-submenu-${item.title?.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.subItems.map((subItem, subIndex) => <DropdownMenuItem key={subIndex} asChild>
                  <Link to={subItem.to} data-testid={`nav-link-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`}>{subItem.label}</Link>
                </DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu> : <NavItem key={index} to={item.to} testId={`nav-link-${item.label?.toLowerCase().replace(/\s+/g, '-')}`}>
            {item.label}
          </NavItem>)}
    </nav>;
};
const MobileNav = ({
  items
}) => <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="bg-emerald-700 text-white border-none">
      <nav className="grid gap-6 text-lg font-medium mt-10">
        {items.map((item, index) => item.subItems ? <div key={index} className="flex flex-col space-y-2">
              <span className="text-white/70 px-4">{item.title}</span>
              {item.subItems.map((subItem, subIndex) => <NavItem key={subIndex} to={subItem.to} className="flex items-center gap-4 px-4 py-2 text-base">
                  {subItem.icon}
                  {subItem.label}
                </NavItem>)}
            </div> : <NavItem key={index} to={item.to} className="flex items-center gap-4 px-4 py-2 text-base">
              {item.icon}
              {item.label}
            </NavItem>)}
      </nav>
    </SheetContent>
  </Sheet>;
const Header = () => {
  const {
    user,
    logout
  } = useAuth();
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  
  const userNavItems = navItemsByRole[user?.role] || [];
  const isAdmin = user?.role === 'Flex_Admin';

  return (
    <>
      <header className="sticky top-0 z-50 flex h-18 items-center gap-4 border-b border-emerald-700/20 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-6 md:px-8 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 font-bold text-white">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white/20 p-2 rounded-xl shadow-lg backdrop-blur-sm">
            <img src="https://png-data.sprep.org/themes/custom/inform_png/logo.png" alt="Logo" className="h-7 w-7" />
          </motion.div>
          <span className="hidden md:inline-block whitespace-nowrap text-lg tracking-tight">PNG Green Fees</span>
        </div>
        
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
            <NavMenu items={userNavItems} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 transition-all hover:scale-105">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-inner">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setIsPasswordChangeOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <MobileNav items={userNavItems} />
        </div>
      </header>
      
      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={isPasswordChangeOpen} 
        onClose={() => setIsPasswordChangeOpen(false)} 
      />
      
    </>
  );
};
export default Header;