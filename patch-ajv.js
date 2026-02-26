const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  'node_modules/fork-ts-checker-webpack-plugin/node_modules/schema-utils/node_modules/ajv-keywords/keywords/_formatLimit.js'
);

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    'var format = formats[name];',
    'var format = (formats || {})[name]; if (!format) return;'
  );
  fs.writeFileSync(filePath, content);
  console.log('✅ ajv-keywords patched successfully');
} else {
  console.log('⚠️ File not found, skipping patch');
}
```

Luego en el build command de Cloudflare ponés:
```
npm install --legacy-peer-deps && node patch-ajv.js && npm run build
