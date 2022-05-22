const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { Readable } = require('stream');


doAsyncJob();


async function doAsyncJob() {
  const dist = 'project-dist';

  try { await fsp.rm(getPath(dist), { recursive: true, force: true }); }
  catch (err) { console.log(err + '\nCan\'t remove dir!'); return null; }

  await fsp.mkdir(getPath(dist));
  await generateHTML('template.html', dist + '/index.html');
  await generateCSS('styles', dist + '/style.css');
  await recursiveCopyDir('assets', dist + '/assets/');
}

async function generateHTML(from, to) {
  const readTemplate = fs.createReadStream(getPath(from), 'utf8');

  readTemplate.on('data', async (chunk) => {
    let mdata = chunk.toString()
      .replace(/(?<=<!--)[\s\S]*(?=-->)/g, '');  // remove comments <!--  -->
    const tags = mdata.match(/{{.+?}}/g);        // match {{ c }}
    //console.log(tags);
    const items = [];
    for (const tag of tags) {
      const pos = mdata.indexOf(tag);
      items.push(mdata.slice(0, pos));
      items.push(tag);
      mdata = mdata.substring(pos + tag.length);
    }

    for (const item of items) {
      const writeTo = fs.createWriteStream(getPath(to), { 'flags': 'a' });
      const readFrom = (tags.includes(item))
        ? fs.createReadStream(getPath('components/' + item.slice(2, -2).trim() + '.html'))
        : Readable.from(item);

      try { await pumpFile(readFrom, writeTo); }
      catch (err) { console.log('Template for tag ' + item + ' not found!'); }
    }
  });
}

async function pumpFile(readable, writable) {

  return new Promise((resolve, reject) => {
    readable.pipe(writable);
    writable.on('finish', () => { resolve(); });
    readable.on('error', (err) => { reject(err); });
    writable.on('error', (err) => { reject(err); });
  });
}

async function generateCSS(from, to) {

  const getWriteStream = (to) => {
    return fs.createWriteStream(getPath(to), { 'flags': 'a' });
  };

  const files = await getFiles(getPath(from));
  if (files) {
    const cssFiles = files.filter(el => path.extname(el.name).match(/.css/ig));

    for (const file of cssFiles) {
      const filePath = path.join(getPath(from), file.name);
      const readFrom = fs.createReadStream(filePath, 'utf8');
      const newLines = Readable.from('\n\n');

      await pumpFile(readFrom, getWriteStream(to));
      await pumpFile(newLines, getWriteStream(to));
    }
  }
}

async function recursiveCopyDir(dir, subPath) {

  const makeDir = path.join(__dirname, subPath);
  const dirExist = await isDirExist(makeDir);
  if (!dirExist) await fsp.mkdir(makeDir);

  try {
    const items = await fsp.readdir(getPath(dir), { withFileTypes: true });

    for (const item of items) {
      if (item.isFile()) {
        const copy = path.join(__dirname, subPath + item.name);
        const current = path.join(getPath(dir), item.name);
        await fsp.copyFile(current, copy);
      }
      else {
        const next = path.join(dir, item.name);
        await recursiveCopyDir(next, subPath + item.name + '/');
      }
    }

  }
  catch (err) { return null; }
}

async function getFiles(dirPath) {
  try {
    const files = await fsp.readdir(dirPath, { withFileTypes: true });
    return files.filter(el => !el.isDirectory());
  }
  catch (err) { return null; }
}

function getPath(dir) {
  return path.join(__dirname, dir);
}

async function isDirExist(dir) {
  try { await fsp.access(dir); }
  catch (err) { return false; }
  return true;
}




