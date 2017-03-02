const fork = require('child_process').fork;
const cpu = require('os').cpus();

let len = cpu.length > 4 ?  cpu.length - 1 : 4;
console.log("开动"+len+" 个线程");
for(let i = 0; i < len; i++){
	fork('./inte.js');
}