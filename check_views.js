
const fs = require('fs');
const glob = require('glob');

const crudDir = 'src/crud';
const viewsDir = 'src/views';

let methodNames = [];
fs.readdirSync(crudDir).forEach(f => {
    if (f.endsWith('.ts')) {
        let content = fs.readFileSync(crudDir + '/' + f, 'utf8');
        let regex = /async\s+([a-zA-Z0-9_]+)\s*\(/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            methodNames.push({method: match[1], file: f});
        }
    }
});

let unused = [];
methodNames.forEach(m => {
    let isUsed = false;
    let q = 'grep_search_mock';
});

