import { InlineSpinner } from '@/components/ui/LoadingSpinner';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Send, CheckCircle } from 'lucide-react';
import { manageClientReview } from '@/api/functions';

export default function ClientReviewForm({ projectId, clientEmail, projectName, companyName }) {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleStarClick = (starRating) => {
        setRating(starRating);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            setError('Gelieve een beoordeling te geven');
            return;
        }
        
        if (!reviewText.trim()) {
            setError('Gelieve uw ervaring te beschrijven');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await manageClientReview({
                action: 'submit_review',
                project_id: projectId,
                client_email: clientEmail,
                rating: rating,
                review_text: reviewText.trim()
            });

            if (response.data.success) {
                setSubmitted(true);
            } else {
                throw new Error(response.data.error || 'Review indienen mislukt');
            }
        } catch (err) {
            setError(err.message || 'Er ging iets mis bij het indienen van uw review');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                        Bedankt voor uw review!
                    </h3>
                    <p className="text-green-700 mb-4">
                        Uw review is ingediend en wordt beoordeeld door {companyName}.
                        Na goedkeuring wordt deze zichtbaar op hun openbare profiel.
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    className={`w-5 h-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-gray-700">"{reviewText}"</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Schrijf een review
                </CardTitle>
                <p className="text-sm text-gray-600">
                    Deel uw ervaring met {companyName} voor het project "{projectName}"
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <Label className="text-base font-medium mb-3 block">
                            Hoe tevreden bent u met het uitgevoerde werk?
                        </Label>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleStarClick(i + 1)}
                                    className={`p-1 transition-colors ${
                                        i < rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                                    }`}
                                >
                                    <Star 
                                        className={`w-8 h-8 ${i < rating ? 'fill-current' : ''}`}
                                    />
                                </button>
                            ))}
                            {rating > 0 && (
                                <span className="ml-3 text-sm text-gray-600">
                                    {rating} van 5 sterren
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="review_text" className="text-base font-medium">
                            Beschrijf uw ervaring
                        </Label>
                        <Textarea
                            id="review_text"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Vertel over de kwaliteit van het werk, professionaliteit, tijdigheid, communicatie..."
                            rows={5}
                            className="mt-2"
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Let op:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Uw review wordt eerst beoordeeld door {companyName}</li>
                            <li>• Na goedkeuring wordt deze zichtbaar op hun openbare profiel</li>
                            <li>• Wees eerlijk en constructief in uw feedback</li>
                        </ul>
                    </div>

                    <div className="flex justify-end">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || rating === 0 || !reviewText.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <InlineSpinner className="mr-2" />
                                    Review indienen...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Review indienen
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}