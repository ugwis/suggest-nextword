var google = require('google');
var http = require('http');
var url = require('url');
var request = require('request');
var kuromoji = require('kuromoji');
var fs = require('fs');

var path = 'memo.txt';
var memo = JSON.parse(fs.readFileSync(path));
console.log(memo);

google.resultsPerPage = 600;

var tokenizer;

console.log("dictionary building");
kuromoji.builder({ dicPath: "kuromoji.js/dist/dict/" }).build(function (err, t) {
	console.log("build");
	if(err)console.log(err);
	tokenizer = t;
});

function nextword(str,word){
	if(str === undefined || word === undefined) return [];
	var path = tokenizer.tokenize(str);
	var cs = "";
	var res = [];
	for(var key in path){
		if(cs.length == word.length){
			if("()[]{}:\"\'\n\r 「」『』【】（）〔〕／　".indexOf(path[key].surface_form) != -1) continue;
			res.push(path[key].surface_form);
			cs = "";
		}

		if(word.indexOf(path[key].surface_form) != -1) cs+=path[key].surface_form;
		else if(cs.length != 0) cs = "";
	}
	return res;
} 


function fetch_sentence(url,word,callback){
	console.log("crawling:" + url);
	request(url,function(error,response,body){
		if(error || response.statusCode != 200){
			callback([]);
			return;
		}
		var result = [];
		var sen = body.split(/[.,; 。、　<>]/g);
		for(var key in sen){
			if(sen[key].indexOf(word) == -1) continue;
			result.push(sen[key]);
		}
		callback(result);
	});
}

http.createServer(function(req,res){
	var arg = url.parse(req.url,true);
	var word = arg.query.q;
	if(word === undefined || word === null){
		res.writeHead(400,{'Content-Type':'text/plain'});
		res.end("Invaild parameter");
		return;
	}
	console.log("reqest:" + word);
	if(word in memo){
		res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
		res.end(JSON.stringify(memo[word]));
		return;
	}
	var nextCounter = 0;
	var obj = [];
	google(word,function(err,next,links){
		console.log(err);
		console.log(links);
		if(err){
			console.log(err);
			res.writeHead(500,{'Content-Type':'text/plain'});
			res.end(err);
		} else {
			for(var i = 0;i < links.length; i++){
				console.log(links[i].link);
				if(links[i].link === null) continue;
				obj = obj.concat(nextword(links[i].description,word));
				/*fetch_sentence(links[i].link,word,function(strs){
					for(var key in strs){
						nextword(strs[key],word,function(str){
							obj.push(str);
						});
					}
					resCounter++;
					if(linkCounter == resCounter){
						//すべての処理が終了
						res.writeHead(200,{'Content-Type':'application/json'});
						console.log(obj);
						res.end(JSON.stringify(obj));
					}
				});*/
			}
			/*if (nextCounter < 0) {
				nextCounter += 1;
				if (next) setTimeout(next,500);
			} else {*/
			setTimeout(function finish(){
				//すべての処理が終了
				res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
				console.log(obj);
				var dict = {};
				for(var key in obj){
					var w = obj[key];
					if(!(w in dict)){
						dict[w] = 0;
					}
					dict[w]++;
				}
				res.end(JSON.stringify(dict));
				console.log(dict);
				memo[word] = dict;
				fs.writeFile(path,JSON.stringify(memo));
			},2000);
	}
	});
}).listen(1337,'192.168.1.6');

