# json-data-generator

random JSON data generator from a template JSON file. 

Uses Faker.js (https://github.com/Marak/faker.js) to generate mock data.

## Usage
1. Install Node and NPM
2. run `node generate.js sample.json.template [-o outputfile] [-c collectionSize ]`

## Template Syntax
1. Anything wrapped in `${ ... }` will be evaluated.  Works with any javascript syntax
2. To use Faker API, use `${ faker. ...}`. See http://marak.github.io/faker.js/index.html for available faker documentation
3. You can specify random number of elements in an array by using the following syntax as the property name: `<property name>__$repeat_<min>_<max>`. See `sample.json.template`
4. If -c is specified, it will create a collection of the template objects
