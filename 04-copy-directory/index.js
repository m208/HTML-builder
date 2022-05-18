const fsp = require('fs/promises');
const path = require('path');

asyncJob();

async function asyncJob(){
  const copy = getPath('files-copy');
  let dirExist = await isDirExist(copy); 
  //console.log('dirExist ', dirExist);

  if(dirExist) {
    await fsp.rmdir(copy, {recursive:true});
    await fsp.mkdir(copy);
  }
  else await fsp.mkdir(copy); 

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

async function isDirExist(dir){
  try { await fsp.access(dir); } 
  catch (err) { return false; }
  return true;
}
