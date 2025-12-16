// Data integrity validation
export async function validateMaterialRequest(request) {
  const errors = [];
  
  if (!request.project_id) {
    errors.push('Missing project_id');
  }
  
  if (!request.material_name || request.material_name.trim() === '') {
    errors.push('Material name is required');
  }
  
  if (!request.quantity || request.quantity <= 0) {
    errors.push('Invalid quantity');
  }
  
  if (!['liter', 'kg', 'meter', 'stuks', 'rol', 'doos', 'm²', 'pak'].includes(request.unit)) {
    errors.push('Invalid unit');
  }
  
  return errors;
}

export async function validateProject(project) {
  const errors = [];
  
  if (!project.company_id) {
    errors.push('Missing company_id');
  }
  
  if (!project.project_name || project.project_name.trim() === '') {
    errors.push('Project name is required');
  }
  
  if (!project.client_name || project.client_name.trim() === '') {
    errors.push('Client name is required');
  }
  
  if (!project.address || project.address.trim() === '') {
    errors.push('Address is required');
  }
  
  return errors;
}

export async function cleanupOrphanedRecords(entityName, foreignKey, parentEntity) {
  // Implementation to clean up orphaned records
  // This would be used in a maintenance job
}