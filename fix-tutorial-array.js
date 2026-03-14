const fs = require('fs');

let file = fs.readFileSync('src/lib/battle/tutorial.ts', 'utf-8');

file = file.replace(/\\s*\\},[\s\S]*?\\},/g, '\n  },');
// That might be wrong. Let's just extract the array and replace it entirely.
