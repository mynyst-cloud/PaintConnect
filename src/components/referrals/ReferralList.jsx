import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  User,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Check,
  X
} from "lucide-react";
import { motion } from "framer-motion";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  quote_sent: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

const statusLabels = {
  pending: "In afwachting",
  contacted: "Gecontacteerd",
  quote_sent: "Offerte verstuurd",
  approved: "Goedgekeurd",
  rejected: "Afgewezen"
};

const statusIcons = {
  pending: Clock,
  contacted: Phone,
  quote_sent: Mail,
  approved: CheckCircle,
  rejected: XCircle
};

export default function ReferralList({ referrals, painters, onRefresh, onStatusChange, isAdmin }) {
  const [filters, setFilters] = useState({ status: 'all', painter: 'all' });
  const [editingReferral, setEditingReferral] = useState(null);

  const safeReferrals = referrals || [];
  const safePainters = painters || [];

  const filteredReferrals = useMemo(() => {
    return safeReferrals.filter(referral => {
      if (!referral) return false;
      const statusMatch = filters.status === 'all' || referral.status === filters.status;
      const painterMatch = filters.painter === 'all' || referral.painter_id === filters.painter;
      return statusMatch && painterMatch;
    });
  }, [safeReferrals, filters]);

  const getPainterName = (painterId) => {
    const painter = safePainters.find(p => p.id === painterId);
    return painter?.full_name || painter?.email || 'Onbekende schilder';
  };

  const handleApprove = async (referralId) => {
    if (onStatusChange) {
      await onStatusChange(referralId, 'approved');
    }
  };

  const handleReject = async (referralId) => {
    if (onStatusChange) {
      await onStatusChange(referralId, 'rejected');
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="p-4 md:p-6 border-b">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-600" />
          Alle Referrals ({safeReferrals.length})
        </CardTitle>

        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Alle statussen</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filters.painter}
            onChange={(e) => setFilters(prev => ({ ...prev, painter: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Alle schilders</option>
            {safePainters.map(painter => (
              <option key={painter.id} value={painter.id}>
                {painter.full_name || painter.email}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredReferrals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base">
              {filters.status !== "all" || filters.painter !== "all"
                ? "Geen referrals gevonden die voldoen aan de filters"
                : "Nog geen referrals ontvangen"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReferrals.map((referral, index) => {
              const StatusIcon = statusIcons[referral.status];
              return (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 md:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {referral.client_name}
                        </h3>
                        <Badge className={`${statusColors[referral.status]} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusLabels[referral.status]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{referral.client_email}</span>
                        </div>
                        {referral.client_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{referral.client_phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Via: {getPainterName(referral.painter_id)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(referral.created_date).toLocaleDateString('nl-NL')}
                        </div>
                      </div>

                      {referral.message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {referral.message}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2">
                      {isAdmin && referral.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(referral.id)}
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Goedkeuren
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(referral.id)}
                            className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Afwijzen
                          </Button>
                        </>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingReferral(referral)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}