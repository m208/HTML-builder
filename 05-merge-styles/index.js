const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

asyncJob();

async function asyncJob(){
  const bundle = getPath('project-dist/bundle.css');
  await fsp.writeFile(bundle, '');  
  const writeTo = fs.createWriteStream(bundle, 'utf8');

  const files = await getFiles(getPath('styles'));
  if(files){
    const cssFiles = files.filter(el => path.extname(el.name).match(/.css/ig));
    for (const file of cssFiles) {
      const readFrom = fs.createReadStream(getPath(`styles/${file.name}`), 'utf8');
      readFrom.pipe(writeTo);
    }
  }
}

function getPath(dir){
  return path.join(__dirname, dir);
}
async function getFiles(dirPath){
  try {
    const files = await fsp.readdir(dirPath, {withFileTypes: true});
    return files.filter(el=>!el.isDirectory());
  } 
  catch (err) { return null; }
}