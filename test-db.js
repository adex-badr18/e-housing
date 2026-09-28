const { mockDB } = require('./src/lib/mock-api/db');
console.log(mockDB.housingApplications.find(a => a.id === 'app-12'));
console.log(mockDB.allocations.find(a => a.applicationId === 'app-12'));
