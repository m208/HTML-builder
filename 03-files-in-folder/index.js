const fs = require('fs');
const path = require('path');

const dir = 'secret-folder';
const dirPath = path.join(__dirname, dir);

fs.readdir(dirPath, (err, files) => {
  if (err) throw err;

  console.log(`\n/${dir}/`);
  files.forEach(file => {
    fs.stat(path.join(dirPath, file), (err, stats)=>{
      if (err) throw err;
      
      if (!stats.isDirectory()) {
        const extname = path.extname(file).slice(1);
        const name = file.replace(`.${extname}`, '');
        const output = `  ${name} - ${extname} - ${stats.size} bytes`;
        console.log(output);
      }
    });
  });
});




