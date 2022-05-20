const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { Transform } = require('stream');


doAsyncJob();


async function doAsyncJob() {
  const dist = 'project-dist';
  const dirExist = await isDirExist(getPath(dist));

  if (dirExist) {
    try { await fsp.rmdir(getPath(dist), { recursive: true }); }
    catch (err) { console.log(err + '\nCan\'t remove dir!'); return null; }
  }

  await fsp.mkdir(getPath(dist));
  await generateHTML('template.html', dist + '/index.html');
  await generateCSS('styles', dist + '/style.css');
  await recursiveCopyDir('assets', dist + '/assets/');
}

async function generateHTML(from, to) {

  const tags = await getTemplateTags(from);

  const readFile = fs.createReadStream(getPath(from), 'utf8');
  const writeFile = fs.createWriteStream(getPath(to), 'utf8');

  const tagInsert = new Transform({
    async transform(chunk, encoding, callback) {
      let data = chunk.toString();

      for (const tag of tags) {
        if (data.includes(tag)) {
          const tagName = tag.replace(/{/g, '').replace(/}/g, '').trim();
          const tagPath = (getPath('components/' + tagName + '.html'));
          const tagContent = await fsp.readFile(tagPath, 'utf-8');
          data = data.replace(tag, tagContent);
        }
      }
      callback(null, data);
    },
  });

  readFile.pipe(tagInsert).pipe(writeFile);
}

async function getTemplateTags(from) {
  return new Promise(function (resolve) {

    const readFile = fs.createReadStream(getPath(from), 'utf8');
    const tags = [];

    readFile.on('data', (data) => {
      const mdata = data.split('\n')
        .filter(el => el.includes('{{') && el.includes('}}'));

      mdata.forEach(el => { tags.push(el.trim()); });

      resolve(tags);
    });
  });
}

async function generateCSS(from, to) {
  const writeTo = fs.createWriteStream(getPath(to), 'utf8');

  const addLines = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString() + '\n\n');
    },
  });

  const files = await getFiles(getPath(from));
  if (files) {
    const cssFiles = files.filter(el => path.extname(el.name).match(/.css/ig));

    for (const file of cssFiles) {
      const filePath = path.join(getPath(from), file.name);
      const readFrom = fs.createReadStream(filePath, 'utf8');
      readFrom.pipe(addLines);
      readFrom.on('end', () => { addLines.pipe(writeTo); });
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




