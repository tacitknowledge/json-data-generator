const fs = require('fs');
const faker = require('faker');
const argv = require('minimist')(process.argv.slice(2));

// const args = process.argv.slice(2);
 const template = argv._[0];
  const collectionSize = argv.c;
 const outputFile = argv.o;

class EvalNode {
  constructor (parent, nodeKey, expr) {
    this.parent = parent;
    this.nodeKey = nodeKey;
    this.expr = expr;
  }
}

class Generator {
  constructor (temp) {
    this.nodesToEvaluate = [];
    this.$root = JSON.parse(fs.readFileSync(temp, 'utf8'));
  }

  static alphaNumeric (min, max) {
    let count = faker.random.number({max: max, min: min});
    let returnVal = "";
    for (var i = 0; i < count; i++) {
      returnVal += faker.random.alphaNumeric();
    }
    return returnVal.toUpperCase();
  }

  traverse (jsonObj, path, parent) {
    if (typeof jsonObj == "object") {
      Object.keys(jsonObj).forEach((key) => {
        let realKey = key;
        if (Array.isArray(jsonObj[key])) {
          realKey = key.split("__")[0];
          let repeat = key.split("__").pop().split("_");
          if (repeat.length === 3 && repeat[0] === "$repeat") {
            const min = parseInt(repeat[1]);
            const max = parseInt(repeat[2]);
            let count = faker.random.number({max: max, min: min});
            jsonObj[realKey] = [];
            while (count > 0) {
              jsonObj[realKey].push(Object.assign({}, jsonObj[key][0]));
              count--;
            }
            delete jsonObj[key];
          }
        }
        path.push(realKey);
        this.traverse(jsonObj[realKey], path, jsonObj);
      })
    }
    else {
      let value = jsonObj;
      if (typeof value === "string" && value.trim().match(/\${.+}/)) {
        value = value.trim();
        const match = value.match(/\${(.+)}/);
        let result = null;
        let expr = null;
        if (match.length > 1) {
          expr = match[1]
        }
        result = eval(expr);
        const key = path[path.length - 1];
        if ((typeof result === "string") && result.match(/\${.+}/)) {
          this.nodesToEvaluate.push(new EvalNode(parent, key, expr))
        }
        else {
          parent[path[path.length - 1]] = result
        }
      }
    }
  }

  evaluateAllValues () {
    while (this.nodesToEvaluate.length > 0) {
      this.nodesToEvaluate = this.nodesToEvaluate.filter((evalNode)=> {
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

  generate () {
    this.traverse(this.$root, ['$root'], null);
    this.evaluateAllValues(this.$root, this.nodesToEvaluate);
    return this.$root;
    //this.writeOutput(this.outFile)
  }
}

function writeOutput (jsonObj, outputFile) {
  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(jsonObj, null, 2));
  }
  else {
    console.log(jsonObj);
  }
}

if(Number.isInteger(collectionSize)){
  const count = parseInt(collectionSize);
  let collection = [];
  for (let i=0; i<count; i++) {
    let generator = new Generator(template);
    collection.push(generator.generate())
  }
  writeOutput(collection, outputFile)
}
else {
  let generator = new Generator(template);
  writeOutput(generator.generate(), outputFile)
}

