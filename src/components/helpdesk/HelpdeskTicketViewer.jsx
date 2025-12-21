import LoadingSpinner from '@/components/ui/LoadingSpinner';
import React, { useState, useEffect } from "react";
import { HelpdeskTicket, HelpdeskReply } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Clock, User, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const statusColors = {
  open: "bg-red-100 text-red-800 border-red-200",
  in_behandeling: "bg-orange-100 text-orange-800 border-orange-200",
  gesloten: "bg-green-100 text-green-800 border-green-200"
};

const statusLabels = {
  open: "Open",
  in_behandeling: "In behandeling",
  gesloten: "Gesloten"
};

export default function HelpdeskTicketViewer({ onCancel, currentUser }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadReplies(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      // Load tickets for this company
      const allTickets = await HelpdeskTicket.filter({ company_id: currentUser.company_id }, "-created_date");
      setTickets(allTickets || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
      setTickets([]);
    }
    setIsLoading(false);
  };

  const loadReplies = async (ticketId) => {
    try {
      const ticketReplies = await HelpdeskReply.filter({ ticket_id: ticketId }, "timestamp");
      setReplies(ticketReplies || []);
    } catch (error) {
      console.error("Error loading replies:", error);
      setReplies([]);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Nu';
    try {
      const date = new Date(timestamp);
      return format(date, 'dd MMM yyyy HH:mm', { locale: nl });
    } catch (error) {
      return 'Nu';
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            Mijn Helpdesk Tickets
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Tickets List */}
          <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner size="default" />
                <p className="text-gray-500 mt-2">Laden...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Geen tickets gevonden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <Card 
                    key={ticket.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm truncate">{ticket.subject}</h3>
                        <Badge className={statusColors[ticket.status]} variant="outline">
                          {statusLabels[ticket.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {formatTime(ticket.created_date)}
                      </p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {ticket.message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Detail */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedTicket ? (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedTicket.subject}
                    </h3>
                    <Badge className={statusColors[selectedTicket.status]}>
                      {statusLabels[selectedTicket.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Ingediend op {formatTime(selectedTicket.created_date)}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Antwoorden</h4>
                    {replies.map(reply => (
                      <Card key={reply.id} className="bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-blue-900">
                                  {reply.sender_name}
                                </span>
                                <span className="text-xs text-blue-600">
                                  {formatTime(reply.timestamp)}
                                </span>
                              </div>
                              <p className="text-blue-900 whitespace-pre-wrap">
                                {reply.message}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {selectedTicket.status === 'gesloten' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Ticket gesloten</p>
                      <p className="text-sm text-green-700">
                        Dit ticket is opgelost en gesloten door ons team.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Selecteer een ticket
                </h3>
                <p className="text-gray-600">
                  Kies een ticket uit de lijst om de details te bekijken
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}