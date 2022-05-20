const fsp = require('fs/promises');
const path = require('path');

asyncJob();

async function asyncJob(){
  const copy = getPath('files-copy');

  try { await fsp.rm(copy, { recursive: true, force: true }); }
  catch (err) { console.log(err + '\nCan\'t remove dir!'); return null; }

  await fsp.mkdir(copy); 
  
  const files = await getFiles(getPath('files'));
  if(files){
    for (const file of files) {
      await fsp.copyFile(getPath(`files/${file.name}`), getPath(`files-copy/${file.name}`));
    }
  }
}

async function getFiles(dirPath){
  try { return await fsp.readdir(dirPath, {withFileTypes: true}); } 
  catch (err) { return null; }
}

function getPath(dir){
  return path.join(__dirname, dir);
}

