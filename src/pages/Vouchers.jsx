
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Vouchers = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    navigate('/app/scan');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecting to Scan & Validate page...</p>
    </div>
  );
};

export default Vouchers;
