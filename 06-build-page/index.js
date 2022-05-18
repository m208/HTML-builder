const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { Transform } = require('stream');


doAsyncJob();


async function doAsyncJob(){

  const dir = getPath('project-dist');
  const dirExist = await isDirExist(dir); 
  let errors = false;
    
  if(dirExist) { 
    try { await fsp.rmdir(dir, {recursive:true}); }
    catch (err) { console.log(err + '\nCan\'t remove dir!');  errors = true;}
  }
  if(errors) return; 
  
  await fsp.mkdir(dir); 

  await copyCss(getPath('styles'), getPath('project-dist/style.css'));

  const components = await getFiles(getPath('components'));
  const templates = new Map();

  for (const comp of components){
    const shortCut = `{{${comp.name.slice(0,-5)}}}`;
    try{
      const content = await fsp.readFile(getPath(`components/${comp.name}`), 'utf-8');
      templates.set(shortCut, content);
    }
    catch (err) { console.log(err); }
  }

  const readFile = fs.createReadStream(getPath('template.html'), 'utf8');
  const writeFile = fs.createWriteStream(getPath('project-dist/index.html'), 'utf8');

  const insertion = new Transform({
    transform(chunk, encoding, callback) {
      let data = chunk.toString();

      templates.forEach((content, shortCut)=>{
        if (data.includes(shortCut)){
          data = data.replace(shortCut, content);
        }
      });

      callback(null, data);
    },
  });

  readFile.pipe(insertion).pipe(writeFile);

  copyDirectory();
}

async function copyCss(from, to){
  const writeTo = fs.createWriteStream(to, 'utf8');
  
  const files = await getFiles(from);
  if(files){
    const cssFiles = files.filter(el => path.extname(el.name).match(/.css/ig));
    for (const file of cssFiles) {
      const filePath = path.join(from, file.name);
      const readFrom = fs.createReadStream(filePath, 'utf8');
      readFrom.pipe(writeTo);
    }
  }
}
async function getFiles(dirPath){
  try {
    const files = await fsp.readdir(dirPath, {withFileTypes: true});
    return files.filter(el=>!el.isDirectory());
  } 
  catch (err) { return null; }
}
  
function getPath(dir){
  return path.join(__dirname, dir);
}
  
async function isDirExist(dir){
  try { await fsp.access(dir); } 
  catch (err) { return false; }
  return true;
}
 
async function copyDirectory(){
  const copy = getPath('project-dist/assets');
  const dirExist = await isDirExist(copy); 
  let errors = false;
    
  if(dirExist) { 
    try { await fsp.rmdir(copy, {recursive:true}); }
    catch (err) { console.log(err + '\nCan\'t remove dir!');  errors = true;}
  }
  if(errors) return;
  await fsp.mkdir(copy); 

  await recDir(path.join(__dirname, 'assets'), 'assets/');
}


async function recDir(dirPath, subPath){

  const makeDir = path.join(__dirname, 'project-dist/' + subPath); 
  const dirExist = await isDirExist(makeDir); 
  if(!dirExist) await fsp.mkdir(makeDir); 

  try {
    const items = await fsp.readdir(dirPath, {withFileTypes: true});

    for (const item of items){
      if (item.isFile()) {
        const copy = path.join(__dirname, 'project-dist/' + subPath + item.name); 
        const current = path.join(dirPath, item.name);  
        await fsp.copyFile(current, copy);
      }
      else {
        const next = path.join(dirPath, item.name); 
        await recDir(next, subPath + item.name + '/');
      }
    }

  } 
  catch (err) { return null; }
}