import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CreditCard, FileText, BarChart2, Settings, LogOut, ChevronDown, Ticket, FilePlus, UploadCloud, Building, FileSignature, Mail, ScanSearch, Menu, Lock, Key } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import PasswordChangeModal from '@/components/PasswordChangeModal';
import AdminPasswordResetModal from '@/components/AdminPasswordResetModal';

const reportSubItems = [
    { to: '/reports', icon: <BarChart2 className="h-4 w-4" />, label: 'Reports Dashboard' },
    { to: '/reports/passports', icon: <FileText className="h-4 w-4" />, label: 'Passport Reports' },
    { to: '/reports/individual-purchase', icon: <FilePlus className="h-4 w-4" />, label: 'Individual Purchase' },
    { to: '/reports/corporate-vouchers', icon: <Building className="h-4 w-4" />, label: 'Corporate Vouchers' },
    { to: '/reports/revenue-generated', icon: <CreditCard className="h-4 w-4" />, label: 'Revenue Generated' },
    { to: '/reports/bulk-passport-uploads', icon: <UploadCloud className="h-4 w-4" />, label: 'Bulk Uploads' },
    { to: '/reports/quotations', icon: <FileSignature className="h-4 w-4" />, label: 'Quotations' },
];

const navItemsByRole = {
  Flex_Admin: [{
    to: '/',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Dashboard'
  }, {
    to: '/users',
    icon: <Users className="h-4 w-4" />,
    label: 'Users'
  }, {
    title: 'Passports',
    icon: <FileText className="h-4 w-4" />,
    base_path: '/passports',
    subItems: [{
      to: '/passports',
      icon: <FileText className="h-4 w-4" />,
      label: 'All Passports'
    }, {
      to: '/passports/create',
      icon: <FilePlus className="h-4 w-4" />,
      label: 'Individual Exit Pass'
    }, {
      to: '/passports/bulk-upload',
      icon: <UploadCloud className="h-4 w-4" />,
      label: 'Bulk Upload'
    }, {
      to: '/purchases/corporate-exit-pass',
      icon: <Building className="h-4 w-4" />,
      label: 'Corporate Exit Pass'
    }, {
      to: '/purchases/offline-template',
      icon: <FileSignature className="h-4 w-4" />,
      label: 'Offline Template'
    }, {
      to: '/purchases/offline-upload',
      icon: <UploadCloud className="h-4 w-4" />,
      label: 'Offline Upload'
    }, {
      to: '/scan',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Scan Exit Pass'
    }]
  }, {
    to: '/payments',
    icon: <CreditCard className="h-4 w-4" />,
    label: 'Purchases'
  }, {
    to: '/quotations',
    icon: <FileSignature className="h-4 w-4" />,
    label: 'Quotations'
  }, {
    title: 'Reports',
    icon: <BarChart2 className="h-4 w-4" />,
    base_path: '/reports',
    subItems: reportSubItems
  }, {
    title: 'Admin',
    icon: <Settings className="h-4 w-4" />,
    base_path: '/admin',
    subItems: [{
      to: '/admin/payment-modes',
      icon: <CreditCard className="h-4 w-4" />,
      label: 'Payment Modes'
    }, {
      to: '/admin/email-templates',
      icon: <Mail className="h-4 w-4" />,
      label: 'Email Templates'
    }]
  }],
  Finance_Manager: [{
    to: '/',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Dashboard'
  }, {
    title: 'Passports',
    icon: <FileText className="h-4 w-4" />,
    base_path: '/passports',
    subItems: [{
      to: '/passports',
      icon: <FileText className="h-4 w-4" />,
      label: 'All Passports'
    }, {
      to: '/purchases/corporate-exit-pass',
      icon: <Building className="h-4 w-4" />,
      label: 'Corporate Exit Pass'
    }, {
      to: '/scan',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Scan Exit Pass'
    }]
  }, {
    to: '/quotations',
    icon: <FileSignature className="h-4 w-4" />,
    label: 'Quotations'
  }, {
    title: 'Reports',
    icon: <BarChart2 className="h-4 w-4" />,
    base_path: '/reports',
    subItems: reportSubItems
  }],
  Counter_Agent: [{
    to: '/',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Dashboard'
  }, {
    title: 'Passports',
    icon: <FileText className="h-4 w-4" />,
    base_path: '/passports',
    subItems: [{
      to: '/passports',
      icon: <FileText className="h-4 w-4" />,
      label: 'All Passports'
    }, {
      to: '/passports/create',
      icon: <FilePlus className="h-4 w-4" />,
      label: 'Individual Exit Pass'
    }, {
      to: '/passports/bulk-upload',
      icon: <UploadCloud className="h-4 w-4" />,
      label: 'Bulk Upload'
    }, {
      to: '/purchases/corporate-exit-pass',
      icon: <Building className="h-4 w-4" />,
      label: 'Corporate Exit Pass'
    }, {
      to: '/purchases/offline-template',
      icon: <FileSignature className="h-4 w-4" />,
      label: 'Offline Template'
    }, {
      to: '/purchases/offline-upload',
      icon: <UploadCloud className="h-4 w-4" />,
      label: 'Offline Upload'
    }, {
      to: '/scan',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Scan Exit Pass'
    }]
  }, {
    to: '/payments',
    icon: <CreditCard className="h-4 w-4" />,
    label: 'Purchases'
  }],
  IT_Support: [{
    to: '/',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Dashboard'
  }, {
    to: '/users',
    icon: <Users className="h-4 w-4" />,
    label: 'Users'
  }, {
    title: 'Passports',
    icon: <FileText className="h-4 w-4" />,
    base_path: '/passports',
    subItems: [{
      to: '/passports',
      icon: <FileText className="h-4 w-4" />,
      label: 'All Passports'
    }, {
      to: '/scan',
      icon: <ScanSearch className="h-4 w-4" />,
      label: 'Scan Exit Pass'
    }]
  }, {
    title: 'Reports',
    icon: <BarChart2 className="h-4 w-4" />,
    base_path: '/reports',
    subItems: reportSubItems
  }, {
    to: '/tickets',
    icon: <Ticket className="h-4 w-4" />,
    label: 'Support Tickets'
  }]
};
const NavItem = ({
  to,
  children,
  className
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return <NavLink to={to} className={cn('transition-colors hover:text-white/90 text-white/70', isActive && 'text-white font-semibold', className)}>
      {children}
    </NavLink>;
};
const NavMenu = ({
  items
}) => {
  return <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
      {items.map((item, index) => item.subItems ? <DropdownMenu key={index}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white p-0 h-auto flex items-center gap-1">
                {item.title}
                <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {item.subItems.map((subItem, subIndex) => <DropdownMenuItem key={subIndex} asChild>
                  <Link to={subItem.to}>{subItem.label}</Link>
                </DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu> : <NavItem key={index} to={item.to}>
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
  const [isAdminPasswordResetOpen, setIsAdminPasswordResetOpen] = useState(false);
  
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
                  {user?.email.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPasswordChangeOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => setIsAdminPasswordResetOpen(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    <span>Reset User Password</span>
                  </DropdownMenuItem>
                )}
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
      
      {/* Admin Password Reset Modal */}
      {isAdmin && (
        <AdminPasswordResetModal 
          isOpen={isAdminPasswordResetOpen} 
          onClose={() => setIsAdminPasswordResetOpen(false)} 
        />
      )}
    </>
  );
};
export default Header;