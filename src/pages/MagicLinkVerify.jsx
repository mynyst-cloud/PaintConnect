import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MagicLinkVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  React.useEffect(() => {
    // Handle magic link verification
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token) {
      // Redirect to appropriate page after verification
      setTimeout(() => {
        navigate('/Dashboard');
      }, 2000);
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Verifiëren van link...</p>
      </div>
    </div>
  );
}
