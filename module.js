var path = require('path'),
	fs = require('fs'),
	glob = require('glob'),
	js_t = require('es6-transpiler'),
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
	callback: (res) => {
		return (module.exports.debug ? console.log(JSON.stringify(res, undefined, 4)) : fs.writeFile(res.path, res.compiledCode, () => {}));
	},
	build: (mask='**/*.{js,css,html}') => {
		glob(mask, {
			ignore: module.exports.ignore
		}, (err, files) => {
			console.log(['Compile app start', (new Date().toLocaleString())]);
			return Promise.all(files.map(file => {
				return (new Promise((resolve, reject) => {
					fs.readFile(file, 'utf8', (err, res) => {
						var compile, error;
						try {
							if (file.match('min') || file.match('jquery') || res.match('jQuery'))
								throw new Error('already minified');
							if (path.extname(file) === '.js') {
								if ((js_t.t = js_t.run({
									src: res,
									disallowDuplicated: false,
									disallowUnknownReferences: false
								})).src)
									compile = js_m(js_t.t.src, {
										mangle: !file.match('\/api')
									}).code;
								else
									throw new Error(js_t.t.errors.join(' \n'));
							}else
								compile = ((path.extname(file) === '.css') ? css(res).css : ((path.extname(file) === '.html') ? html(res, {
									collapseWhitespace: true,
									removeComments: true,
									removeRedundantAttributes: true,
									removeScriptTypeAttributes: true,
									removeTagWhitespace: true,
									useShortDoctype: true
								}) : res));
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
				})).then(res => {
					++module.exports._i[0];
					return module.exports.callback(res);
				});
			})).then(() => {
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
