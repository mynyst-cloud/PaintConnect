import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function ConceptOfferte({ opmeting, company }) {
  const { metingen = [], btw_percentage = '21' } = opmeting;

  // Calculations
  const subtotaalExclBtw = metingen.reduce(
    (sum, m) => sum + (m.oppervlakte * m.m2_prijs * m.aantal_lagen),
    0
  );

  const btwBedrag = (subtotaalExclBtw * parseFloat(btw_percentage)) / 100;
  const totaalInclBtw = subtotaalExclBtw + btwBedrag;

  // Group by room
  const grouped = metingen.reduce((acc, meting) => {
    const room = meting.ruimte || 'Onbekend';
    if (!acc[room]) acc[room] = [];
    acc[room].push(meting);
    return acc;
  }, {});

  const offerteNummer = opmeting.offerte_nummer || `OFF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const datum = format(new Date(), 'dd MMMM yyyy', { locale: nl });

  return (
    <Card id="concept-offerte-printable">
      <CardHeader>
        <CardTitle>📄 Concept Offerte</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center mb-2">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-gray-400 text-xs text-center">Bedrijfs Logo</span>
                )}
              </div>
              <div className="text-sm space-y-0.5">
                <p className="font-semibold">{company?.name || 'Bedrijfsnaam'}</p>
                {company?.street && <p>{company.street} {company.house_number}</p>}
                {company?.postal_code && <p>{company.postal_code} {company.city}</p>}
                {company?.email && <p>{company.email}</p>}
                {company?.phone_number && <p>{company.phone_number}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-2">OFFERTE</h2>
              <div className="text-sm space-y-1">
                <p><strong>Offertenummer:</strong> {offerteNummer}</p>
                <p><strong>Datum:</strong> {datum}</p>
                {opmeting.status === 'offerte_verzonden' && opmeting.verzonden_datum && (
                  <p><strong>Verzonden:</strong> {format(new Date(opmeting.verzonden_datum), 'dd-MM-yyyy HH:mm')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Klantgegevens</h3>
            <div className="text-sm space-y-1">
              <p><strong>Naam:</strong> {opmeting.voornaam_klant} {opmeting.achternaam_klant}</p>
              {opmeting.straat_huisnummer && <p><strong>Adres:</strong> {opmeting.straat_huisnummer}</p>}
              {opmeting.postcode && <p>{opmeting.postcode} {opmeting.gemeente}</p>}
              <p><strong>E-mail:</strong> {opmeting.email_klant}</p>
              {opmeting.project_naam && <p><strong>Project:</strong> {opmeting.project_naam}</p>}
            </div>
          </div>

          {/* Measurements per Room */}
          <div>
            <h3 className="font-semibold mb-3">Werkzaamheden</h3>
            <div className="space-y-4">
              {Object.entries(grouped).map(([room, roomMetingen]) => (
                <div key={room} className="border-l-4 border-emerald-500 pl-4">
                  <h4 className="font-medium text-emerald-700 dark:text-emerald-400 mb-2">{room}</h4>
                  <div className="space-y-2">
                    {roomMetingen.map((meting, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <span className="capitalize">{meting.type}</span>
                          {meting.breedte && meting.hoogte && (
                            <span className="text-gray-600 ml-2">
                              ({meting.breedte} × {meting.hoogte} m)
                            </span>
                          )}
                          <div className="text-xs text-gray-500">
                            {meting.oppervlakte.toFixed(2)} m² × €{meting.m2_prijs} × {meting.aantal_lagen} {meting.aantal_lagen === 1 ? 'laag' : 'lagen'}
                          </div>
                          {meting.notities && (
                            <div className="text-xs text-gray-500 italic">{meting.notities}</div>
                          )}
                        </div>
                        <div className="text-right font-medium">
                          €{(meting.oppervlakte * meting.m2_prijs * meting.aantal_lagen).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotaal (excl. BTW):</span>
                <span>€{subtotaalExclBtw.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>BTW ({btw_percentage}%):</span>
                <span>€{btwBedrag.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Totaal (incl. BTW):</span>
                <span>€{totaalInclBtw.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Opmerkingen */}
          {opmeting.opmerkingen && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-sm">Opmerkingen</h3>
              <p className="text-sm whitespace-pre-wrap">{opmeting.opmerkingen}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-gray-500 text-center border-t pt-4">
            <p>Deze offerte is geldig tot {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy', { locale: nl })}</p>
            <p className="mt-1">Betaling binnen 14 dagen na factuurdatum</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}