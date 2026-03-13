const XLSX = require('xlsx');
const path = require('path');

// Lire le fichier Excel
const filePath = path.join(__dirname, '..', 'SportEasy_co-la-riviere.xlsx');
const workbook = XLSX.readFile(filePath);

// Afficher les noms des feuilles
console.log('=== Feuilles disponibles ===');
console.log(workbook.SheetNames);

// Lire chaque feuille
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== Feuille: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Afficher les 5 premières lignes
  console.log('Premières lignes:');
  data.slice(0, 10).forEach((row, i) => {
    console.log(`${i}: ${JSON.stringify(row)}`);
  });
  console.log(`... Total: ${data.length} lignes`);
});
