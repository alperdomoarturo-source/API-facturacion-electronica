const fs = require('fs');
const path = require('path');

const layoutsDir = path.join(__dirname, 'src/app');
const layoutFiles = [
  'accounts-receivable/layout.tsx',
  'cash/layout.tsx',
  'customers/layout.tsx',
  'expenses/layout.tsx',
  'inventory/layout.tsx',
  'invoicing/layout.tsx',
  'menu/layout.tsx',
  'pos/layout.tsx',
  'purchases/layout.tsx',
  'recipes/layout.tsx',
  'suppliers/layout.tsx'
];

layoutFiles.forEach(file => {
  const filePath = path.join(layoutsDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.startsWith('use client\n')) {
      content = "'use client'\n" + content.slice(12);
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${file}`);
    }
  }
});
