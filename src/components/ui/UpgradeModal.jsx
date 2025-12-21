import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Check, Users, BarChart3, Building, Warehouse, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/components/utils';

const tierInfo = {
  starter: { 
    name: 'Starter', 
    price: '€29', 
    color: 'from-gray-500 to-gray-600',
    features: ['2 gebruikers', '10 projecten/maand', '50 materialen']
  },
  professional: { 
    name: 'Professional', 
    price: '€79', 
    color: 'from-blue-500 to-emerald-500',
    features: ['5 gebruikers', '30 projecten/maand', '150 materialen', 'Analytics', 'Klantportaal', 'VoorraadBeheer']
  },
  enterprise: { 
    name: 'Enterprise', 
    price: '€199', 
    color: 'from-amber-500 to-orange-500',
    features: ['100 gebruikers', 'Onbeperkt projecten', 'Onbeperkt materialen', 'API toegang', 'Account manager']
  },
};

const featureIcons = {
  'Analytics': BarChart3,
  'Klantportaal': Building,
  'VoorraadBeheer': Warehouse,
  'Facturen': FileText,
  'Verbruik': BarChart3,
};

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  requiredTier = 'professional',
  featureName = 'Deze functie',
  currentTier = 'starter'
}) {
  const navigate = useNavigate();
  const required = tierInfo[requiredTier] || tierInfo.professional;
  const FeatureIcon = featureIcons[featureName] || Sparkles;
  
  const handleUpgrade = () => {
    onClose();
    navigate(createPageUrl('Subscription'));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${required.color} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Upgrade naar {required.name}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            <span className="font-semibold text-gray-900 dark:text-white">{featureName}</span> is beschikbaar vanaf het <span className="font-semibold">{required.name}</span> abonnement.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Feature highlight */}
          <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
              <FeatureIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{featureName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Beschikbaar in {required.name}</p>
            </div>
          </div>
          
          {/* Plan details */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-lg">{required.name}</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{required.price}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/maand</span>
              </div>
            </div>
            <ul className="space-y-2">
              {required.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Later
          </Button>
          <Button 
            onClick={handleUpgrade}
            className={`flex-1 bg-gradient-to-r ${required.color} hover:opacity-90 text-white border-0`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade nu
          </Button>
        </div>
        
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Je kunt op elk moment upgraden of downgraden
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Hook voor makkelijk gebruik
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [modalProps, setModalProps] = React.useState({});
  
  const showUpgradeModal = (featureName, requiredTier = 'professional') => {
    setModalProps({ featureName, requiredTier });
    setIsOpen(true);
  };
  
  const closeUpgradeModal = () => {
    setIsOpen(false);
  };
  
  const UpgradeModalComponent = () => (
    <UpgradeModal
      isOpen={isOpen}
      onClose={closeUpgradeModal}
      {...modalProps}
    />
  );
  
  return {
    showUpgradeModal,
    closeUpgradeModal,
    UpgradeModalComponent,
    isOpen
  };
}


