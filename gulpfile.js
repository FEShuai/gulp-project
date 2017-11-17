const gulp        = require('gulp'),
      $           = require('gulp-load-plugins')(),
      browserSync = require('browser-sync').create(),
      reload      = browserSync.reload,
      sass        = require('gulp-ruby-sass'),
      eslint      = require('gulp-eslint'),
      gulpIf      = require('gulp-if'),
      del         = require('del'),
      client      = require('scp2');

const staticPath = './src';
const disPath = './dist';
const templatesPath = './html';

//静态资源输入、输出路径
const path = {
  src: {
    sass: staticPath + '/sass/**/*.scss',
    js: staticPath + '/js/',
    img: staticPath + '/images/**/*.*',
    css: staticPath + '/css'
  },
  dist: {
    css: disPath + '/src/css/',
    js: disPath + '/src/js/',
    img: disPath + '/src/images/'
  }
};

//启动web服务配置
const option = {
  port: 1234,
  scp: {
    host: 'http://192.168.150.6',
    username: 'wangshuai',
    password: 'wangshuai',
    dest: '/usr/local/nginx/html/'
  }
};

//默认启动任务
gulp.task('default', [''], function () {
  // return runSequence(['server','miniJs']);
  console.log('gulp启动成功');
});

//监测sass文件变化，变异sass --> css，刷新浏览器
gulp.task('sassToCss', function () {
  return sass('./src/sass/*.scss', {style: 'expand'})
    .on('error', sass.logError)
    .pipe($.autoprefixer({browsers: ['last 2 versions']}))
    .pipe(gulp.dest(path.src.css))
    .pipe(reload({stream: true}))
    .pipe($.rename({suffix: '.min'}))
    .pipe($.cssnano())
    .pipe(gulp.dest(path.src.css))
    .pipe(gulp.dest('./src/css'))
    .pipe(reload({stream: true}));
});

//压缩CSS
gulp.task('miniCss', function () {
  return sass('./src/sass/*.scss', {style: expand})
    .on('error', sass.logError)
    .pipe($.autoprefixer({browsers: ['last 2 versions']}))
    .pipe(gulp.dest(path.dist.css))
    .pipe(gulp.dest(path.dist.css))
    .pipe($.rename({suffix: '.min'}))
    .pipe($.cssnano())
    // .pipe($.rev())
    .pipe(gulp.dest(path.src.css))
    .pipe(gulp.dest(path.dist.css))
    // .pipe($.rev.manifest({
    //     merge: true
    // }))
    .pipe(gulp.dest('./src/rev/css'));
});

//删除压缩文件
gulp.task('cleanJs', function () {
  return gulp.src('./src/js/*.min.js')
    .pipe($.clean());
});

function isFixed (file) {
  // Has ESLint fixed the file contents?
  return file.eslint != null && file.eslint.fixed;
}

// 刷新压缩Js
function refreshJs (src) {
  if (src.indexOf('.min.js') == -1) {
    gulp.src(['src', '!node_modules/**'])
      .pipe(eslint({fix: true}))
      .pipe(eslint.format())
      .pipe(gulpIf(isFixed, gulp.dest(path.src.js)))
      .pipe(eslint.failAfterError())
      .pipe(gulpIf(isFixed, $.babel()))
      .pipe($.rename({suffix: '.min'}))
      .pipe(gulp.dest(path.src.js))
      .pipe(reload({stream: true}));
  }
}

// 压缩Js
gulp.task('miniJs', ['cleanJs'], function () {
  return gulp.src(['./src/js/*.js', '!node_modules/**'])
    .pipe(eslint({
      fix: true,
      globals: [
        'jQuery',
        '$',
        'BMap',
        'WOW'
      ]
    }))
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, $.babel()))
    .pipe(gulpIf(isFixed, gulp.dest(path.dist.js)))
    .pipe(eslint.failAfterError())
    .pipe($.uglify())
    .pipe($.rename({suffix: '.min'}))
    .pipe(gulp.dest(path.src.js))
    .pipe(gulp.dest(path.dist.js))
    .pipe(reload({stream: true}));
});

//压缩图片
gulp.task('miniImage', function () {
  return gulp.src(path.src.img)
    .pipe($.imagemin())
    // .pipe($.rev())
    .pipe(gulp.dest(path.dist.img));
  // .pipe($.rev.manifest())
  // .pipe(gulp.dest(path.src))
});

//
gulp.task('copy', function () {
  gulp.src(['./*html/**/'])
    .pipe(gulp.dest('./dist/'));
  gulp.src(['./src/*js/**'])
    .pipe(gulp.dest(path.dist.js));
});

//清理CSS文件、发布文件夹
gulp.task('clean', function () {
  return gulp.src([path.src.css, './dist/'])
    .pipe($.clean());
});

//打包
gulp.task('build', ['clean'], function () {
  return gulp.start('copy', 'miniCss', 'miniJs', 'miniImage');
  console.log('打包结束');
});

//启动web服务
gulp.task('server', ['sassToCss'], function () {
  browserSync.init({
    directory: true,
    server: './',
    port: option.port
  });
  console.log('浏览器web服务启动成功，端口：' + option.port);
  gulp.watch(path.src.sass, ['sassToCss']);
  gulp.watch('./src/js/*.js', function (e) {
    console.log(e.path);
    refreshJs(e.path);
  });
  gulp.watch(templatesPath + '**/*.html').on('change', reload);
});

//上传打包文件到服务器
gulp.task('scpServer', ['build'], () => {
  return gulp.src('./*dist/**')
    .pipe(scp(option.scp))
    .on('error', function (err) {
      console.log('上传服务器失败：错误原因如下：');
      console.log(err);
    });
});

//帮助：gulp参数说明
gulp.task('help', function () {
  console.log('	gulp help			gulp参数说明');
  console.log('	gulp server			开发环境web环境');
  console.log('	gulp build			文件打包');
});


