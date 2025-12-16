
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Printer, // New import for print button
  Users // New import for empty state icon
} from "lucide-react";

export default function PainterQRCodes({ painters }) {
  // Defensive guard for painters prop, ensuring it's always an array.
  // This helps prevent 'map is not a function' errors if 'painters' is undefined or null.
  const safePainters = painters || [];

  const generateReferralUrl = (referralCode) => {
    if (!referralCode) return '';
    // This assumes window.location.origin is available.
    // For universal rendering or non-browser environments, consider a configurable base URL.
    return `${window.location.origin}/referral/${referralCode}`;
  };

  // This function is intended to generate a URL to the QR code image.
  // It's named 'generateQRCodeDataURL' as per the outline, but it returns a direct image URL,
  // not a 'data:image/png;base64,...' string, consistent with the original file's external API usage.
  const generateQRCodeDataURL = (text) => {
    if (!text) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="p-4 md:p-6 border-b flex flex-row justify-between items-center print:hidden">
        <div>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600" />
            Persoonlijke QR Codes
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Laat schilders hun unieke QR code scannen om referrals in te dienen.</p>
        </div>
        <Button onClick={handlePrint} className="print:hidden">
          <Printer className="w-4 h-4 mr-2" />
          Print Pagina
        </Button>
      </CardHeader>
      
      {/* Search functionality removed as per outline */}
      {/* The original CardHeader also had the search input, which is now removed. */}
      {/* The outline implies a print-oriented view, not an interactive search/copy/download one. */}

      <CardContent className="p-4 md:p-6">
        {safePainters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base">Geen schilders gevonden</p>
            <p className="text-sm">Voeg schilders toe om hun QR codes te genereren.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:block print:grid-cols-none print:columns-2 md:print:columns-3 lg:print:columns-4">
            {safePainters.map((painter) => {
              // Skip painters if they are invalid or don't have a referral code.
              // This is a critical check to prevent errors as per the outline.
              if (!painter || !painter.referral_code) return null;

              const referralUrl = generateReferralUrl(painter.referral_code);
              const qrCodeDataUrl = generateQRCodeDataURL(referralUrl);
              
              return (
                <div 
                  key={painter.id} 
                  className="p-4 border rounded-lg text-center bg-gray-50 space-y-3 break-inside-avoid print:break-inside-avoid-page print:border print:shadow-none print:mb-4"
                >
                  <h3 className="text-lg font-semibold text-gray-800 print:text-base">
                    {painter.full_name || painter.email || "Onbekende Schilder"}
                  </h3>
                  <div className="w-48 h-48 mx-auto p-2 border bg-white rounded-md shadow-sm print:w-32 print:h-32 print:p-1 print:border-gray-200">
                    {/* The ternary operator is kept as per outline, though qrCodeDataUrl should always be non-empty if referralUrl is valid */}
                    {qrCodeDataUrl ? 
                      <img src={qrCodeDataUrl} alt={`QR Code voor ${painter.full_name || painter.email}`} className="w-full h-full object-contain" /> 
                      : 
                      <p className="text-sm text-gray-400">Laden...</p>
                    }
                  </div>
                  <p className="text-xs text-gray-500 break-all print:hidden">
                    URL: <a href={referralUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{referralUrl}</a>
                  </p>
                  {/* Referral code display and action buttons are removed as per the outline's simpler print-focused design */}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
