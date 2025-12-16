import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { PaintBucket } from 'lucide-react';
import { createPageUrl } from '@/components/utils';
import { CompanyBrandingContext } from '@/components/providers/CompanyBrandingProvider';

export default function CompanyLogo({ size = 'default' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const nameTextSizeClasses = {
    sm: 'text-xs',
    default: 'text-lg',
    lg: 'text-xl'
  };

  const subTextSizeClasses = {
    sm: 'text-[8px]',
    default: 'text-xs',
    lg: 'text-sm'
  };

  const brandingContext = useContext(CompanyBrandingContext);

  const FallbackLogo = () => (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
        <PaintBucket className={`${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
      </div>
      <div className="min-w-0">
        <span className={`font-bold text-gray-900 dark:text-slate-100 ${nameTextSizeClasses[size]} leading-tight block whitespace-nowrap`}>
          PaintConnect
        </span>
      </div>
    </div>
  );

  if (!brandingContext) {
    return (
      <Link to={createPageUrl('Dashboard')} className="inline-block">
        <FallbackLogo />
      </Link>
    );
  }

  const { brandData: company, isLoading } = brandingContext;

  const hasCompanyData = !isLoading && company;
  const companyName = hasCompanyData ? company.name : 'PaintConnect';
  const logoUrl = hasCompanyData ? company.logo_url : null;
  const primaryColor = hasCompanyData ? company.primary_color : null;

  const renderContent = () => (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        {logoUrl ? (
          <>
            <img
              src={logoUrl}
              alt={companyName}
              className="w-full h-full rounded-lg object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div
              className="w-full h-full bg-emerald-600 rounded-lg hidden items-center justify-center"
              style={{ backgroundColor: primaryColor || '#059669' }}
            >
              <PaintBucket className={`${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
            </div>
          </>
        ) : (
          <div
            className="w-full h-full bg-emerald-600 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: primaryColor || '#059669' }}
          >
            <PaintBucket className={`${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <span
          className={`font-bold text-gray-900 dark:text-slate-100 ${nameTextSizeClasses[size]} leading-tight block whitespace-nowrap`}
          style={{ color: primaryColor || undefined }}
          title={companyName}
        >
          {companyName}
        </span>
        {hasCompanyData && size !== 'sm' && (
          <p className={`text-gray-500 dark:text-slate-400 ${subTextSizeClasses[size]} leading-tight whitespace-nowrap`}>
            by PaintConnect
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Link to={createPageUrl('Dashboard')} className="inline-block">
      {renderContent()}
    </Link>
  );
}