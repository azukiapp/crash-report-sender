var azk_gulp = require('azk-dev/gulp')({
  cwd  : __dirname,
  babel: {}, // disable babel-runtime
});

var gulp = azk_gulp.gulp;

gulp.task("show:args", "Help text", ["before:show"], function() {
  console.log(azk_gulp.yargs.argv);
  return null;
}, { aliases: ["sa", "s"] });
