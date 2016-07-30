const fs = require('fs');
const faker = require('faker');

const args = process.argv.slice(2);
const template = args[0];
const outputFile = args[1];

class EvalNode {
  constructor (parent, nodeKey, expr) {
    this.parent = parent;
    this.nodeKey = nodeKey;
    this.expr = expr;
  }
}

let nodesToEvaluate = [];

let $root = JSON.parse(fs.readFileSync(template, 'utf8'));

function alphaNumeric(min,max){
  let count = faker.random.number({max: max, min: min});
  let returnVal = "";
  for(var i=0; i<count; i++){
    returnVal += faker.random.alphaNumeric();
  }
  return returnVal.toUpperCase();
}

function traverse (jsonObj, path, parent) {
  if (typeof jsonObj == "object") {
    Object.keys(jsonObj).forEach((key) => {
      let realKey = key;
      if(Array.isArray(jsonObj[key])){
        realKey = key.split("__")[0];
        let repeat = key.split("__").pop().split("_");
        if(repeat.length === 3 && repeat[0] === "$repeat"){
          const min = parseInt(repeat[1]);
          const max = parseInt(repeat[2]);
          let count = faker.random.number({max: max, min: min});
          jsonObj[realKey] = [];
          while (count > 0){
            jsonObj[realKey].push(Object.assign({}, jsonObj[key][0]));
            count--;
          }
          delete jsonObj[key];
        }
      }
      path.push(realKey);
      traverse(jsonObj[realKey], path, jsonObj);
    })
  }
  else {
    let value = jsonObj;
    if (typeof value === "string" && value.trim().match(/\${.+}/)) {
      value = value.trim();
      const match = value.match(/\${(.+)}/);
      let result = null;
      let expr = null;
      if(match.length > 1){
        expr = match[1]
      }
      result = eval(expr);
      const key = path[path.length - 1];
      if ((typeof result === "string") && result.match(/\${.+}/)) {
        nodesToEvaluate.push(new EvalNode(parent, key, expr))
      }
      else {
        parent[path[path.length - 1]] = result
      }
    }
  }
}

function evaluateAllVAlues(rootObj, nodesToEvaluate) {
  while (nodesToEvaluate.length > 0) {
    nodesToEvaluate = nodesToEvaluate.filter((evalNode)=>{
      let $root = rootObj;
      const result = eval(evalNode.expr);
      if (!result.match(/\${.+}/)) {
        evalNode.parent[evalNode.nodeKey] = result;
        return false
      }
      else {
        return true
      }
    });
  }
}

function writeOutput(outputFile) {
  if(outputFile){
    fs.writeFileSync(outputFile, JSON.stringify($root, null, 2));
  }
  else {
    console.log($root);
  }
}

traverse($root, ['$root'], null);
evaluateAllVAlues($root, nodesToEvaluate);
writeOutput(outputFile)


