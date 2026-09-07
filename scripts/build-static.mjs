import{copyFileSync}from'node:fs';
import{fileURLToPath}from'node:url';
import{dirname,join}from'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
for(const file of['index.html','styles.css'])copyFileSync(join(root,'src',file),join(root,'dist',file));
console.log('Static interface copied to dist/');
