import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Company, Supplier } from '@/api/entities';

export const CompanyBrandingContext = createContext(undefined);

export const useCompanyBranding = () => {
    const context = useContext(CompanyBrandingContext);
    if (context === undefined) {
        throw new Error('useCompanyBranding must be used within a CompanyBrandingProvider');
    }
    return context;
};

export default function CompanyBrandingProvider({ children }) {
  const [brandData, setBrandData] = useState(null);
  const [brandType, setBrandType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!hasLoaded) {
      fetchBrandData();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  const fetchBrandData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();

      // SUPER ADMIN die ook bedrijf heeft
      if (user?.role === 'admin' && user?.email === 'mynysteven@gmail.com') {
        setBrandType('super_admin');
        // Laad wel bedrijfsdata als die er is
        if (user?.company_id) {
          try {
            const companyData = await Company.get(user.company_id);
            setBrandData(companyData);
          } catch (e) {
            console.warn("Super admin's company not found, maybe deleted.", e);
            setBrandData(null);
          }
        } else {
          setBrandData(null);
        }
        return;
      }

      setBrandType(user?.user_type);
      
      if (user?.user_type === 'supplier' && user.supplier_id) {
        const supplierData = await Supplier.get(user.supplier_id);
        setBrandData(supplierData);
      } else if (user?.company_id) {
        const companyData = await Company.get(user.company_id);
        setBrandData(companyData);
      }
    } catch (error) {
       console.warn("Could not fetch branding data:", error);
       setBrandData(null);
       setBrandType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = { brandData, brandType, isLoading };

  return (
    <CompanyBrandingContext.Provider value={value}>
      {children}
    </CompanyBrandingContext.Provider>
  );
}