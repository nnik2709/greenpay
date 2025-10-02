
import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Printer, Mail, Download, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Vouchers = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    navigate('/scan');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecting to Scan & Validate page...</p>
    </div>
  );
};

export default Vouchers;
