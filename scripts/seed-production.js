// Simple script to seed production data
async function seedProductionData() {
  try {
    console.log('Seeding production data...');
    
    const response = await fetch('https://getsmartflo.com/api/admin/seed-demo-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Production data seeded successfully:', result);
    
  } catch (error) {
    console.error('Error seeding production data:', error);
  }
}

seedProductionData();