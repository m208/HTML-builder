const readline = require('readline');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'text.txt');

fs.writeFile(filePath, '', (err) => { if (err) throw err; });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  if (line.toLocaleLowerCase().trim() === 'exit') rl.close();
  else fs.appendFile(filePath, line + '\n', (err) => { if (err) throw err; });
});

rl.on('close', () => {
  console.log('\nSee you later.\n');
});

console.log('\nHello. Input some text: ');