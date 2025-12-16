import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowLeft, ArrowRight, Users, Briefcase, CheckCircle, PaintBucket } from 'lucide-react';
import { Company } from '@/api/entities';
import InviteUserForm from '@/components/admin/InviteUserForm';

const paintConnectLogoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

export default function OnboardingGuide({ 
  companyName, 
  onStartInviteTeam, 
  onStartProject, 
  onComplete, 
  onSkip,
  companyId 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    try {
      await Company.update(companyId, { onboarding_status: 'skipped' });
    } catch (error) {
      // Ignore permission errors - user may not have update rights
      console.warn('Could not update onboarding status:', error.message);
    }
    onSkip();
  };

  const handleComplete = async () => {
    try {
      await Company.update(companyId, { onboarding_status: 'completed' });
    } catch (error) {
      // Ignore permission errors - user may not have update rights
      console.warn('Could not update onboarding status:', error.message);
    }
    onComplete();
  };

  const handleStartInviteTeam = () => {
    setShowInviteForm(true);
  };

  const handleInviteSuccess = () => {
    setShowInviteForm(false);
    // Optionally move to next step automatically
    handleNext();
  };

  const handleInviteCancel = () => {
    setShowInviteForm(false);
  };

  const handleStartProject = () => {
    setShowProjectForm(false);
    onStartProject(); // This will open the project form modal outside onboarding
    // After project creation, the onboarding should continue or complete
  };

  // NIEUW: Handle step skip - als het stap 3 is en er geen team/projecten zijn, sluit dan gewoon
  const handleStepSkip = async () => {
    if (currentStep === 3) {
      // Check if user has added team members or projects
      // If not, just close the onboarding without showing success
      try {
        await Company.update(companyId, { onboarding_status: 'skipped' });
      } catch (error) {
        // Ignore permission errors
        console.warn('Could not update onboarding status:', error.message);
      }
      onSkip();
    } else {
      // For other steps, just go to next step
      handleNext();
    }
  };

  const steps = [
    {
      title: `Welkom bij PaintConnect, ${companyName}! 🎉`,
      subtitle: "We helpen je in 2 stappen op weg: team uitnodigen & project starten.",
      content: (
        <div className="text-center space-y-6">
          {/* GEFIXED: Groot PaintConnect logo in plaats van icoon */}
          <div className="flex justify-center">
            <img 
                src={paintConnectLogoUrl} 
                alt="PaintConnect Logo" 
                className="h-16 w-auto"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
            Binnen een paar minuten heb je jouw team uitgenodigd en je eerste project aangemaakt. 
            Laten we beginnen!
          </p>
        </div>
      ),
      primaryButton: { text: "Start gids", action: handleNext },
      showSkip: true
    },
    {
      title: "Teamleden uitnodigen",
      subtitle: "Nodig jouw schilders uit zodat ze direct aan de slag kunnen.",
      content: (
        <div className="space-y-6">
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">Vul naam en e-mailadres van je schilder in</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">Zij ontvangen automatisch een uitnodigingsmail</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">Ze kunnen direct inloggen en projecten bekijken</p>
            </div>
          </div>
        </div>
      ),
      primaryButton: { text: "Team uitnodigen", action: handleStartInviteTeam },
      secondaryButton: { text: "Terug", action: handlePrev },
      showSkip: true
    },
    {
      title: "Eerste project aanmaken",
      subtitle: "Maak je eerste schilderproject aan en beheer alles op één plek.",
      content: (
        <div className="space-y-6">
          <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">Vul projectnaam, klant en adres in</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">Kies start- en einddatum voor de planning</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">Wijs schilders toe aan het project</p>
            </div>
          </div>
        </div>
      ),
      primaryButton: { text: "Nieuw project starten", action: handleStartProject },
      secondaryButton: { text: "Terug", action: handlePrev },
      showSkip: true
    },
    {
      title: "Goed bezig! 🎨",
      subtitle: "Je team en eerste project zijn aangemaakt. Je kunt nu alles beheren via je dashboard.",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Jouw PaintConnect omgeving is nu klaar voor gebruik!
            </p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
              <p className="text-emerald-800 dark:text-emerald-200 text-sm font-medium">
                💡 Tip: Bekijk de Planning-pagina om je projecten in een kalenderweergave te zien
              </p>
            </div>
          </div>
        </div>
      ),
      primaryButton: { text: "Ga naar Dashboard", action: handleComplete },
      secondaryButton: { text: "Terug", action: handlePrev },
      showSkip: false
    }
  ];

  const currentStepData = steps[currentStep - 1];

  // Show invite form within the onboarding modal
  if (showInviteForm) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[1000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800">
              <div className="relative p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src={paintConnectLogoUrl} 
                      alt="PaintConnect" 
                      className="h-8 w-auto"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Team Uitnodigen
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Stap 2 van 4 - Onboarding
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleInviteCancel}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Terug naar gids
                  </Button>
                </div>

                <InviteUserForm
                  companyId={companyId}
                  onInviteSuccess={handleInviteSuccess}
                  onCancel={handleInviteCancel}
                />
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[1000]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <Card className="shadow-2xl border-0 bg-white dark:bg-gray-800">
            {/* Header with logo and close */}
            <div className="relative p-6 pb-0">
              <div className="flex justify-between items-start mb-6">
                {/* GEFIXED: Logo teruggeplaatst */}
                <img 
                  src={paintConnectLogoUrl} 
                  alt="PaintConnect" 
                  className="h-8 w-auto"
                />
                {currentStepData.showSkip && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Gids overslaan
                  </Button>
                )}
              </div>

              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Stap {currentStep} van {totalSteps}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {Math.round((currentStep / totalSteps) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(currentStep / totalSteps) * 100} 
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                />
              </div>
            </div>

            <CardContent className="px-6 pb-6">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Step content */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {currentStepData.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentStepData.subtitle}
                  </p>
                </div>

                <div className="py-6">
                  {currentStepData.content}
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    {currentStepData.secondaryButton && (
                      <Button
                        variant="outline"
                        onClick={currentStepData.secondaryButton.action}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {currentStepData.secondaryButton.text}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {/* AANGEPAST: Knop 'Stap overslaan' met speciale logica voor stap 3 */}
                    {(currentStep === 2 || currentStep === 3) && (
                      <Button
                        variant="link"
                        onClick={handleStepSkip}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Stap overslaan
                      </Button>
                    )}
                    <Button
                      onClick={currentStepData.primaryButton.action}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                    >
                      {currentStepData.primaryButton.text}
                      {currentStep < totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}