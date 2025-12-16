import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight, Crown, Package, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function MobileNavigation({
  isOpen,
  onClose,
  currentPageName,
  user,
  unreadNotifications,
  handleLogout,
  menuItems,
  inventarisItems,
  calculatiesItems,
  beheerItems,
  systeemItems,
  company,
  paintConnectLogoUrl,
  isAdmin,
  theme,
  setTheme
}) {
  const [isBeheerExpanded, setIsBeheerExpanded] = useState(false);
  const [isInventarisExpanded, setIsInventarisExpanded] = useState(false);
  const [isCalculatiesExpanded, setIsCalculatiesExpanded] = useState(false);

  const formatSubscriptionPlan = (company) => {
    if (!company) return null;
    const tier = company.subscription_tier?.toUpperCase() || 'STARTER';
    const status = company.subscription_status;
    if (status === 'trialing') {
      return `TRIAL (${tier})`;
    }
    return tier;
  };

  const NavLink = ({ item }) => {
    const isActive = currentPageName.toLowerCase() === item.name.toLowerCase().replace(/\s/g, '');
    const IconComponent = item.icon;
    return (
      <Link
        to={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={onClose}
      >
        <IconComponent className={`mr-2.5 h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
        {item.name}
      </Link>
    );
  };

  const ActionButton = ({ item }) => {
    const IconComponent = item.icon;
    return (
      <button
        onClick={() => {
          item.onClick();
          onClose();
        }}
        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <IconComponent className="mr-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
        {item.name}
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-50 lg:hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <img src={paintConnectLogoUrl} alt="PaintConnect" className="h-8" />
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </Button>
            </div>

            {/* User Info */}
            {user && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-base">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Plan Display */}
            {company && isAdmin && (
              <Link
                to="/Subscription"
                onClick={onClose}
                className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight mb-1">
                    {company.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {formatSubscriptionPlan(company)}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3">
              {/* Menu Section */}
              <h3 className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Menu
              </h3>
              <div className="space-y-0.5 mb-4">
                {menuItems.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}

                {/* Inventaris & Logistiek - voor admins uitklapbaar, voor schilders alleen Materialen */}
                {isAdmin && inventarisItems.length > 1 ? (
                  <div>
                    <button
                      onClick={() => setIsInventarisExpanded(!isInventarisExpanded)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <Package className="mr-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span>Inventaris & Logistiek</span>
                      </div>
                      {isInventarisExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {isInventarisExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-3"
                        >
                          {inventarisItems.map((item) => (
                            <NavLink key={item.name} item={item} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  inventarisItems.map((item) => <NavLink key={item.name} item={item} />)
                )}

                {/* Calculaties - voor admins uitklapbaar, voor schilders alleen Verfcalculator */}
                {isAdmin && calculatiesItems.length > 1 ? (
                  <div>
                    <button
                      onClick={() => setIsCalculatiesExpanded(!isCalculatiesExpanded)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <Calculator className="mr-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span>Calculaties</span>
                      </div>
                      {isCalculatiesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {isCalculatiesExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-3"
                        >
                          {calculatiesItems.map((item) => (
                            <NavLink key={item.name} item={item} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  calculatiesItems.map((item) => <NavLink key={item.name} item={item} />)
                )}
              </div>

              {/* Beheer Section - alleen voor admins */}
              {beheerItems.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setIsBeheerExpanded(!isBeheerExpanded)}
                    className="flex items-center justify-between w-full px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5"
                  >
                    <span>Beheer</span>
                    {isBeheerExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  <AnimatePresence>
                    {isBeheerExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-0.5"
                      >
                        {beheerItems.map((item) => (
                          <NavLink key={item.name} item={item} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Systeem Section */}
              <h3 className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Systeem
              </h3>
              <div className="space-y-0.5">
                {systeemItems.map((item) =>
                  item.href ? <NavLink key={item.name} item={item} /> : <ActionButton key={item.name} item={item} />
                )}
              </div>
            </nav>

            {/* Theme Switch */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Thema</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}