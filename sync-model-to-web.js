const fs=require("fs");

let modelDef =fs.readFileSync("./src/db/model.ts").toString(); 

modelDef=modelDef.replace(/ObjectID/g, "string"); 

const begin = modelDef.search(/export.interface/); 
const end=modelDef.search(/export.const.+?Schema/);

modelDef = modelDef.substring(begin,end); 

fs.writeFileSync("../reddit2-web/src/model/index.ts", modelDef); 
fs.writeFileSync("../common/model/index.ts", modelDef); 