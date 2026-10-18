const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelDir = path.join(__dirname, '..', 'excel');
const files = fs.readdirSync(excelDir).filter(f => f.endsWith('.xlsx'));

console.log('Found files:', files);

files.forEach(file => {
  const filePath = path.join(excelDir, file);
  console.log('\n==================================================');
  console.log(`FILE: ${file}`);
  try {
    const workbook = xlsx.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`\n--- Sheet: ${sheetName} ---`);
      console.log(`Total Rows: ${data.length}`);
      if (data.length > 0) {
        console.log('Row 0 (Header):', JSON.stringify(data[0]));
      }
      if (data.length > 1) {
        console.log('Row 1 (Sample):', JSON.stringify(data[1]));
      }
      if (data.length > 2) {
        console.log('Row 2 (Sample):', JSON.stringify(data[2]));
      }
      if (data.length > 3) {
        console.log('Row 3 (Sample):', JSON.stringify(data[3]));
      }
    });
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
