import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Palette, Info, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// Verfdata gebaseerd op echte verfspecificaties
const paintTypes = {
  'latex_mat': {
    name: 'Latex Mat (Muurverf)',
    coverage: 12, // m²/liter
    brands: ['Sigma S2U', 'Flexa Pure', 'Sikkens Alpha'],
    description: 'Standaard muurverf voor binnen'
  },
  'latex_zijdeglans': {
    name: 'Latex Zijdeglans',
    coverage: 11,
    brands: ['Sigma S2U Gloss', 'Flexa Pure Gloss'],
    description: 'Wasbare wandverf, ideaal voor keukens en badkamers'
  },
  'acryl_hoogglans': {
    name: 'Acryl Hoogglans',
    coverage: 10,
    brands: ['Sikkens Rubbol BL', 'Sigma S2U Satin'],
    description: 'Voor houtwerk en metaalwerk binnen'
  },
  'primer_grondverf': {
    name: 'Primer/Grondverf',
    coverage: 8,
    brands: ['Sigma Primer', 'Sikkens Rubbol Primer'],
    description: 'Hechtprimer voor moeilijke ondergronden'
  },
  'buitenverf_gevel': {
    name: 'Buitenverf Gevel',
    coverage: 9,
    brands: ['Sigma Facade', 'Sikkens Alphacryl'],
    description: 'Weerbestendige gevelverf'
  },
  'plafondverf': {
    name: 'Plafondverf',
    coverage: 13,
    brands: ['Sigma Plafond', 'Flexa Plafond'],
    description: 'Spatvrije plafondverf'
  }
};

const surfaceFactors = {
  'smooth': { name: 'Glad (nieuw gipswerk)', factor: 1.0 },
  'textured': { name: 'Licht gestructureerd', factor: 1.15 },
  'rough': { name: 'Ruw (spuitpleister)', factor: 1.3 },
  'brick': { name: 'Baksteen/metselwerk', factor: 1.4 }
};

export default function Verfcalculator() {
  const [calculationType, setCalculationType] = useState('');
  const [paintType, setPaintType] = useState('');
  const [surfaceType, setSurfaceType] = useState('smooth');
  const [layers, setLayers] = useState(2);
  const [result, setResult] = useState(null);
  
  // Measurements
  const [roomLength, setRoomLength] = useState('');
  const [roomWidth, setRoomWidth] = useState('');
  const [roomHeight, setRoomHeight] = useState('');
  const [wallLength, setWallLength] = useState('');
  const [wallHeight, setWallHeight] = useState('');
  const [ceilingLength, setCeilingLength] = useState('');
  const [ceilingWidth, setCeilingWidth] = useState('');
  
  // Deductions
  const [doors, setDoors] = useState(0);
  const [windows, setWindows] = useState(0);

  const calculatePaint = () => {
    if (!paintType || !calculationType) {
      alert('Selecteer eerst het type oppervlak en verf');
      return;
    }

    let totalArea = 0;
    const paint = paintTypes[paintType];
    
    // Calculate area based on type
    if (calculationType === 'room') {
      const length = parseFloat(roomLength) || 0;
      const width = parseFloat(roomWidth) || 0;
      const height = parseFloat(roomHeight) || 0;
      
      if (!length || !width || !height) {
        alert('Voer alle afmetingen in voor de kamer');
        return;
      }
      
      // Walls area: 2 * (length + width) * height
      totalArea = 2 * (length + width) * height;
      
    } else if (calculationType === 'wall') {
      const length = parseFloat(wallLength) || 0;
      const height = parseFloat(wallHeight) || 0;
      
      if (!length || !height) {
        alert('Voer lengte en hoogte van de muur in');
        return;
      }
      
      totalArea = length * height;
      
    } else if (calculationType === 'ceiling') {
      const length = parseFloat(ceilingLength) || 0;
      const width = parseFloat(ceilingWidth) || 0;
      
      if (!length || !width) {
        alert('Voer lengte en breedte van het plafond in');
        return;
      }
      
      totalArea = length * width;
    }

    // Deduct doors and windows
    const doorArea = doors * 2.1 * 0.9; // Standard door 2.1m x 0.9m
    const windowArea = windows * 1.2 * 1.5; // Average window 1.2m x 1.5m
    totalArea = Math.max(0, totalArea - doorArea - windowArea);

    // Apply surface factor
    const surfaceFactor = surfaceFactors[surfaceType].factor;
    const adjustedArea = totalArea * surfaceFactor;

    // Calculate paint needed
    const coverage = paint.coverage;
    const totalPaintNeeded = (adjustedArea * layers) / coverage;
    
    // Add 10% waste factor
    const paintWithWaste = totalPaintNeeded * 1.1;
    
    // Round up to nearest 0.5L for practical purchasing
    const roundedLiters = Math.ceil(paintWithWaste * 2) / 2;

    setResult({
      area: totalArea,
      adjustedArea: adjustedArea,
      paintNeeded: paintWithWaste,
      roundedLiters: roundedLiters,
      paintType: paint,
      surfaceType: surfaceFactors[surfaceType],
      layers: layers,
      deductions: {
        doors: doors,
        windows: windows,
        doorArea: doorArea,
        windowArea: windowArea
      }
    });
  };

  const resetCalculator = () => {
    setCalculationType('');
    setPaintType('');
    setSurfaceType('smooth');
    setLayers(2);
    setResult(null);
    setRoomLength('');
    setRoomWidth('');
    setRoomHeight('');
    setWallLength('');
    setWallHeight('');
    setCeilingLength('');
    setCeilingWidth('');
    setDoors(0);
    setWindows(0);
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-emerald-600" />
            Verfcalculator
          </h1>
          <p className="text-gray-600">Bereken precies hoeveel verf je nodig hebt</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                Bereken Verfbehoefte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Calculation Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">1. Wat ga je schilderen?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'room', label: 'Hele Kamer', icon: '🏠' },
                    { value: 'wall', label: 'Muur(en)', icon: '🧱' },
                    { value: 'ceiling', label: 'Plafond', icon: '⬜' }
                  ].map(type => (
                    <Button
                      key={type.value}
                      variant={calculationType === type.value ? 'default' : 'outline'}
                      onClick={() => setCalculationType(type.value)}
                      className="h-auto p-3 flex flex-col items-center gap-1"
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 2: Measurements */}
              {calculationType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <Label className="text-base font-semibold">2. Afmetingen (in meters)</Label>
                  
                  {calculationType === 'room' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="roomLength">Lengte</Label>
                        <Input
                          id="roomLength"
                          type="number"
                          step="0.1"
                          value={roomLength}
                          onChange={(e) => setRoomLength(e.target.value)}
                          placeholder="5.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="roomWidth">Breedte</Label>
                        <Input
                          id="roomWidth"
                          type="number"
                          step="0.1"
                          value={roomWidth}
                          onChange={(e) => setRoomWidth(e.target.value)}
                          placeholder="4.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="roomHeight">Hoogte</Label>
                        <Input
                          id="roomHeight"
                          type="number"
                          step="0.1"
                          value={roomHeight}
                          onChange={(e) => setRoomHeight(e.target.value)}
                          placeholder="2.7"
                        />
                      </div>
                    </div>
                  )}

                  {calculationType === 'wall' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="wallLength">Lengte</Label>
                        <Input
                          id="wallLength"
                          type="number"
                          step="0.1"
                          value={wallLength}
                          onChange={(e) => setWallLength(e.target.value)}
                          placeholder="5.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="wallHeight">Hoogte</Label>
                        <Input
                          id="wallHeight"
                          type="number"
                          step="0.1"
                          value={wallHeight}
                          onChange={(e) => setWallHeight(e.target.value)}
                          placeholder="2.7"
                        />
                      </div>
                    </div>
                  )}

                  {calculationType === 'ceiling' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="ceilingLength">Lengte</Label>
                        <Input
                          id="ceilingLength"
                          type="number"
                          step="0.1"
                          value={ceilingLength}
                          onChange={(e) => setCeilingLength(e.target.value)}
                          placeholder="5.0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ceilingWidth">Breedte</Label>
                        <Input
                          id="ceilingWidth"
                          type="number"
                          step="0.1"
                          value={ceilingWidth}
                          onChange={(e) => setCeilingWidth(e.target.value)}
                          placeholder="4.0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Deductions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="doors">Aantal Deuren</Label>
                      <Input
                        id="doors"
                        type="number"
                        min="0"
                        value={doors}
                        onChange={(e) => setDoors(parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="windows">Aantal Ramen</Label>
                      <Input
                        id="windows"
                        type="number"
                        min="0"
                        value={windows}
                        onChange={(e) => setWindows(parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Paint Type */}
              {calculationType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <Label className="text-base font-semibold">3. Type Verf</Label>
                  <Select value={paintType} onValueChange={setPaintType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kies het type verf" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paintTypes).map(([key, paint]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{paint.name}</span>
                            <span className="text-xs text-gray-500">{paint.coverage} m²/L</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              {/* Step 4: Surface & Layers */}
              {paintType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">4. Ondergrond</Label>
                    <Select value={surfaceType} onValueChange={setSurfaceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(surfaceFactors).map(([key, surface]) => (
                          <SelectItem key={key} value={key}>
                            {surface.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="layers" className="text-base font-semibold">5. Aantal Lagen</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(num => (
                        <Button
                          key={num}
                          variant={layers === num ? 'default' : 'outline'}
                          onClick={() => setLayers(num)}
                          className="flex-1"
                        >
                          {num} laag{num > 1 ? 'en' : ''}
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Calculate Button */}
              {paintType && (
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={calculatePaint} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Bereken Verfbehoefte
                  </Button>
                  <Button onClick={resetCalculator} variant="outline" size="lg">
                    Reset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <ArrowRight className="w-5 h-5" />
                    Resultaat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main Result */}
                  <div className="text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-4xl font-bold text-emerald-700 mb-2">
                      {result.roundedLiters}L
                    </div>
                    <div className="text-emerald-600 font-medium">
                      {result.paintType.name}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Te schilderen oppervlak:</span>
                      <span className="font-medium">{result.area.toFixed(1)} m²</span>
                    </div>
                    
                    {result.adjustedArea !== result.area && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Na oppervlakcorrectie:</span>
                        <span className="font-medium">{result.adjustedArea.toFixed(1)} m²</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Aantal lagen:</span>
                      <span className="font-medium">{result.layers}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Rendement verf:</span>
                      <span className="font-medium">{result.paintType.coverage} m²/L</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Berekende hoeveelheid:</span>
                      <span className="font-medium">{result.paintNeeded.toFixed(2)}L</span>
                    </div>

                    {(result.deductions.doors > 0 || result.deductions.windows > 0) && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-700 font-medium mb-1">Aftrek voor openingen:</div>
                        {result.deductions.doors > 0 && (
                          <div className="text-xs text-blue-600">
                            {result.deductions.doors} deur(en): -{result.deductions.doorArea.toFixed(1)} m²
                          </div>
                        )}
                        {result.deductions.windows > 0 && (
                          <div className="text-xs text-blue-600">
                            {result.deductions.windows} raam/ramen: -{result.deductions.windowArea.toFixed(1)} m²
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Tips */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-amber-700 mb-1">Praktische Tips:</div>
                        <ul className="text-amber-600 space-y-1 text-xs">
                          <li>• Resultaat bevat 10% extra voor spillage en touch-ups</li>
                          <li>• Koop altijd uit dezelfde batch voor kleurconsistentie</li>
                          <li>• Bewaar restverf voor latere reparaties</li>
                          {result.layers > 1 && <li>• Laat elke laag volledig drogen voor de volgende</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Products */}
                  {result.paintType.brands && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Aanbevolen Merken:</Label>
                      <div className="flex flex-wrap gap-2">
                        {result.paintType.brands.map(brand => (
                          <Badge key={brand} variant="outline" className="text-xs">
                            {brand}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}