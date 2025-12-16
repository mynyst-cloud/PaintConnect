import React from 'react';
import ProjectInfoPanel from './ProjectInfoPanel';
import DailyUpdatesTab from './DailyUpdatesTab';
import ColorAdviceTab from './ColorAdviceTab';
import MaterialenTab from './MaterialenTab';
import DamagesTab from './DamagesTab';
import PostCalculationTab from './PostCalculationTab';
import ProjectPhotosTab from './ProjectPhotosTab';

export default function ProjectDetailsMainContent({ 
  view, 
  project, 
  relatedData, 
  onDataRefresh, 
  isAdmin, 
  onEditProject 
}) {
  // CRITICAL: Validate project data
  if (!project || !project.id) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Project data wordt geladen...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate view based on the active tab
  switch (view) {
    case 'info':
      return (
        <ProjectInfoPanel
          project={project}
          relatedData={relatedData}
          onDataRefresh={onDataRefresh}
          isAdmin={isAdmin}
        />
      );

    case 'updates':
      return (
        <DailyUpdatesTab
          project={project}
          updates={relatedData?.updates || []}
          onDataRefresh={onDataRefresh}
          isAdmin={isAdmin}
        />
      );

    case 'colorAdvice':
      return (
        <ColorAdviceTab
          project={project}
          colorAdvices={relatedData?.colorAdvices || []}
          onDataRefresh={onDataRefresh}
          isAdmin={isAdmin}
        />
      );

    case 'materials':
      return (
        <MaterialenTab
          project={project}
          materialRequests={relatedData?.materialRequests || []}
          materialUsages={relatedData?.materialUsages || []}
          materialsList={relatedData?.materialsList || []}
          onDataRefresh={onDataRefresh}
          isAdmin={isAdmin}
        />
      );

    case 'damages':
      return (
        <DamagesTab
          project={project}
          damages={relatedData?.damages || []}
          onDataRefresh={onDataRefresh}
          isAdmin={isAdmin}
        />
      );

    case 'post-calculation':
      if (!isAdmin) {
        return (
          <div className="h-full flex items-center justify-center p-8">
            <p className="text-gray-500 dark:text-gray-400">Geen toegang tot deze sectie</p>
          </div>
        );
      }
      return (
        <PostCalculationTab
          project={project}
          materialUsages={relatedData?.materialUsages || []}
          timeEntries={relatedData?.timeEntries || []}
          updates={relatedData?.updates || []}
          extraCosts={relatedData?.extraCosts || []}
          materialsList={relatedData?.materialsList || []}
          costTotals={relatedData?.costTotals || {}}
          assignedPainters={relatedData?.assignedPainters || []}
          teamMembers={relatedData?.teamMembers || []}
          loadProjectData={onDataRefresh}
        />
      );

    case 'photos':
      return (
        <ProjectPhotosTab
          project={project}
          relatedData={relatedData}
          onDataRefresh={onDataRefresh}
          isAdmin={isAdmin}
        />
      );

    default:
      return (
        <div className="h-full flex items-center justify-center p-8">
          <p className="text-gray-500 dark:text-gray-400">Selecteer een tab</p>
        </div>
      );
  }
}