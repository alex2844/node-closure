var path = require('path'),
	fs = require('fs'),
	glob = require('glob'),
	js_t = require('babel-core').transform,
	js_m = require('uglify-js').minify,
	css = require('csso').minify,
	html = require('html-minifier').minify;

module.exports = {
	_i: [0, 0, 0],
	ignore: ['**/node_modules/**', '**/upload/**'],
	debug: false,
	size: (data, min) => {
		var type = ['B','KB','MB'];
		if (data == 0)
			return '0 '+type[0];
		if (min)
			module.exports._i[min] += (data = (data ? Buffer.byteLength(data, 'utf8') : 0));
		var i = Math.floor(Math.log(data) / Math.log(1000));
		if (i >= type.length)
			i = type.length-1;
		return (data/Math.pow(1000,i)).toFixed(3).replace('.000', '')+' '+type[i];
	},
	callback: res => {
		return (module.exports.debug ? console.log(JSON.stringify(res, undefined, 4)) : fs.writeFile(res.path, res.compiledCode, () => {}));
	},
	build: (mask='**/*.{js,css,html}') => {
		glob(mask, {
			ignore: module.exports.ignore
		}, (err, files) => {
			console.log(['Compile app start', (new Date().toLocaleString())]);
			return Promise.all(files.map(function(file) {
				return (new Promise(function(resolve, reject) {
					fs.readFile(file, 'utf8', function(err, res) {
						var compile, error;
						try {
							compile = (((path.extname(file) === '.js') && !res.match('require')) ? js_m(js_t(res, {
								/* minified: true,
								comments: false, */
								presets: ['es2015']
							}).code).code : ((path.extname(file) === '.css') ? css(res).css : ((path.extname(file) === '.html') ? html(res, {
								collapseWhitespace: true,
								removeComments: true,
								removeRedundantAttributes: true,
								removeScriptTypeAttributes: true,
								removeTagWhitespace: true,
								useShortDoctype: true
							}) : res)));
						} catch(e) {
							compile = res;
							error = e.message;
						}
						resolve({
							path: file,
							origSize: module.exports.size(res, 1),
							compiledSize: module.exports.size(compile, 2),
							compiledCode: compile,
							error: error
						});
					});
				})).then(function(res) {
					++module.exports._i[0];
					return module.exports.callback(res);
				});
			})).then(function() {
				console.log(JSON.stringify({
					files: module.exports._i[0],
					origSize: module.exports.size(module.exports._i[1]),
					compiledSize: module.exports.size(module.exports._i[2])
				}, undefined, 4));
				console.log(['Compile app finish', (new Date().toLocaleString())]);
			});
		});
	}
}
