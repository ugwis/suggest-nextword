var timer;

var tokenizer;

kuromoji.builder({ dicPath: "kuromoji.js/dist/dict/" }).build(function (err, t) {
	if(err) console.log(err);
	$("#text").val("").removeAttr("disabled")
	tokenizer = t;
});

function analyze(word){
	$("#results").empty();
	$.getJSON("http://192.168.1.6:1337/",{q: word},function(json){
		var dict = [];
		for(var key in json){
			dict.push({
				word: key,
				count: json[key]
			});
		}
		dict.sort(function(a,b){
		    if(a.count<b.count) return 1;
		    if(a.count>b.count) return -1;
		    return 0;
		});
		for(var key in dict){
			$("#results").append(
				$("<dt>").html(dict[key].word),
				$("<dd>").html(dict[key].count)
			)
		}
	});
}

$(document).ready(function(){
	var target;
	$("#text").val("Building Dictionary...");
	$("#text").keyup(function(e){
		var text = $("#text").val();
		if(text == "") return;
		var sen = text.split(/[. 。　\n\r]/g);
		for(var i = sen.length-1; i>=0; i--){
			if(sen[i] == "" || sen[i] == null || sen[i] == undefined) sen.splice(i,1);
		}
		target = sen[sen.length-1];
		clearTimeout(timer);
		timer = setTimeout(function(){
			var path = tokenizer.tokenize(target);
			var search_text = "";
			var prev_noun = false;
			for(var i = path.length-1;i>=0;i--){
				search_text = path[i].surface_form + search_text;
				if(path[i].pos == "名詞"){
					prev_noun = true;
				} else {
					if(prev_noun){
						break;
					}
				}
			}
			$("#search_word").html("「"+search_text+"」に続く単語");
			analyze(search_text);
		},2000);
	});
});
