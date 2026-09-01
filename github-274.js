// In the relevant component file (likely a selection or preview management component)
// Assuming the issue is in a component that manages selections and previews

// Before fix (problematic code):
// const clearSelection = () => { /* implementation */ };
// const clearSelection = () => { /* duplicate implementation */ }; // ❌ duplicated
// replacePreviews(newPreviews); // ❌ replacePreviews is undefined

// After fix:
const clearSelection = () => {
  setSelectedIds([]);
  setSelectionState('idle');
};

// Remove duplicate clearSelection function definition

// Ensure replacePreviews is properly defined or imported
const replacePreviews = (newPreviews) => {
  setPreviews(newPreviews);
};

// Use the functions correctly
// clearSelection(); // ✅ single definition
// replacePreviews(newPreviews); // ✅ function is defined