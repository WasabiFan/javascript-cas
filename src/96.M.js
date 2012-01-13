function M(a, b){
    var ne = Expression(a, b || M.Global);
	return ne;
}

M.toString=function(){
	//Yes, this is necessary
	return "function M() {\n    [awesome code]\n}";
};

//Allow extensions
M.fn = Expression.prototype;

//Allow creation of new Context externally
M.Context = Context;

//Allow modification of global context
M.Global = Global;

if(window.exports !== undefined){
	//Node.js
	window.exports = M;
}else{
	//In browser
	window.M = M;
}