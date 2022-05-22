const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { Readable } = require('stream');

asyncJob();

async function asyncJob() {
  const bundle = getPath('project-dist/bundle.css');
  await fsp.writeFile(bundle, '');  // clear file

  const getWriteStream = (to) => {
    return fs.createWriteStream(to, { 'flags': 'a' });
  };

  const files = await getFiles(getPath('styles'));
  if (files) {
    const cssFiles = files.filter(el => path.extname(el.name).match(/.css/ig));
    for (const file of cssFiles) {
      const readFrom = fs.createReadStream(getPath(`styles/${file.name}`), 'utf8');
      const newLines = Readable.from('\n');

      await pumpFile(readFrom, getWriteStream(bundle));
      await pumpFile(newLines, getWriteStream(bundle));
    }
  }
}

async function pumpFile(readable, writable) {

  return new Promise((resolve, reject) => {
    readable.pipe(writable);
    writable.on('finish', () => { resolve(); });
    readable.on('error', (err) => { reject(err); });
    writable.on('error', (err) => { reject(err); });
  });
}

function getPath(dir) {
  return path.join(__dirname, dir);
}
async function getFiles(dirPath) {
  try {
    const files = await fsp.readdir(dirPath, { withFileTypes: true });
    return files.filter(el => !el.isDirectory());
  }
  catch (err) { return null; }
}