const { src, dest, series, parallel, watch, task } = require('gulp')
const browsersync = require('browser-sync').create()
const fs = require('fs')
const fileinclude = require('gulp-file-include')
const del = require('del')
const sass = require('gulp-sass')(require('sass'))
const autoprefixer = require('gulp-autoprefixer')
const group_media = require('gulp-group-css-media-queries')
const clean_css = require('gulp-clean-css')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify-es').default
const imagemin = require('gulp-imagemin')
const ttf2woff = require('gulp-ttf2woff')
const ttf2woff2 = require('gulp-ttf2woff2')
const webp = require('gulp-webp')
const project_folder = 'dist'
const source_folder = '#src'

const path = {
	build: {
		html: `${project_folder}/`,
		css: `${project_folder}/css/`,
		js: `${project_folder}/js/`,
		img: `${project_folder}/img/`,
		fonts: `${project_folder}/fonts/`,
	},
	src: {
		html: [`${source_folder}/*.html`, `!${source_folder}/_*.html`],
		css: `${source_folder}/sass/style.sass`,
		js: `${source_folder}/js/script.js`,
		img: `${source_folder}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
		fonts: `${source_folder}/fonts/*.ttf`,
	},
	watch: {
		html: `${source_folder}/**/*.html`,
		css: `${source_folder}/sass/**/*.sass`,
		js: `${source_folder}/js/**/*.js`,
		img: `${source_folder}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
		fonts: `${source_folder}/fonts/*.ttf`,
	},
	clean: `./${project_folder}/`,
}

function createDistFolder(done) {
	fs.mkdirSync(project_folder, { recursive: true })
	done()
}
function fontsStyle(params) {
	let file_content = fs.readFileSync(source_folder + '/sass/fonts.sass')
	if (file_content == '') {
		fs.writeFile(source_folder + '/sass/fonts.sass', '', cb)
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.')
					fontname = fontname[0]
					if (c_fontname != fontname) {
						fs.appendFile(
							source_folder + '/sass/fonts.sass',
							'@include font("' +
								fontname +
								'", "' +
								fontname +
								'", "400", "normal")\r\n',
							cb
						)
					}
					c_fontname = fontname
				}
			}
		})
	}
}
function cb() {}
function browserSyncTask(params) {
	browsersync.init({
		server: {
			baseDir: `./${project_folder}/`,
		},
		port: 3000,
		notify: false,
	})
}

function html() {
	return src(path.src.html)
		.pipe(fileinclude())
		.pipe(dest(path.build.html))
		.pipe(browsersync.stream())
}

function css() {
	return src(path.src.css)
		.pipe(
			sass({
				outputStyle: 'expanded',
			})
		)
		.pipe(group_media())
		.pipe(
			autoprefixer({
				overrideBrowserslist: ['last 5 versions'],
				cascade: true,
			})
		)
		.pipe(dest(path.build.css))
		.pipe(clean_css())
		.pipe(
			rename({
				extname: '.min.css',
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream())
}

function js() {
	return src(path.src.js)
		.pipe(fileinclude())
		.pipe(dest(path.build.js))
		.pipe(uglify())
		.pipe(
			rename({
				extname: '.min.js',
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream())
}

function fonts(params) {
	src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts))
	return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts))
}

function img() {
	return src(path.src.img)
		.pipe(
			webp({
				quality: 70,
			})
		)
		.pipe(dest(path.build.img))
		.pipe(src(path.src.img))
		.pipe(
			imagemin({
				progressive: true,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3,
			})
		)
		.pipe(dest(path.build.img))
		.pipe(browsersync.stream())
}

function watchFiles(params) {
	watch([path.watch.html], html)
	watch([path.watch.css], css)
	watch([path.watch.js], js)
	watch([path.watch.img], img)
}

function clean(params) {
	return del(path.clean)
}

const build = series(
	clean,
	createDistFolder,
	parallel(js, css, html, img, fonts),
	fontsStyle
)
const watchTask = parallel(build, watchFiles, browserSyncTask)

exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.img = img
exports.js = js
exports.css = css
exports.html = html
exports.build = build
exports.watchTask = watchTask
exports.default = watchTask
