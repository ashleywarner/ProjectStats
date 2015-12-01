var SASS_FILES = {
    './website/serve/css/main.css': './website/scss/main.scss'
};

//var JAVASCRIPT_FILES = {
//    './website/serve/js/main.js': ['./website/js-source/**/*.js']
//};

//var CRITICAL_CSS_FILE = './website/assets/css/<%= pkg.name %>/<%= pkg.name %>.critical.min.css';

var WATCH_JAVASCRIPT_FILES = [
    './website/js-source/**/*.js'
];

var WATCH_SASS_FILES = [
    './website/scss/**/*.scss'
];

/*global module:false*/
module.exports = function (grunt) {
    // avoid having to load tasks individually
    require('load-grunt-tasks')(grunt, {
        pattern: ['grunt-*']
    });

    // time the events
    require('time-grunt')(grunt);


    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Task configuration.
        //uglify: {
        //    dist: {
        //        files: JAVASCRIPT_FILES
        //    }
        //},

        requirejs: {
            compile: {
                options: {
                    mainConfigFile: "./website/js-source/require-config.js",
                    baseUrl: "./website/js-source",
                    name: "main",
                    out: "./website/serve/js/main.js"
                }
            }
        },

        sass: {
            dist: {
                options: {
                    style: 'compressed'
                },
                files: SASS_FILES
            }
        },

        //criticalcss: {
        //    custom: {
        //        options: {
        //            url: SITE_URL,
        //            filename: './website/assets/css/<%= pkg.name %>/<%= pkg.name %>.min.css',
        //            outputfile: CRITICAL_CSS_FILE
        //        }
        //    }
        //},

        watch: {
            uglify: {
                files: WATCH_JAVASCRIPT_FILES,
                tasks: ['requirejs']
            },

            sass: {
                loadPath: require('node-bourbon').includePaths, // awesome mixin lib: http://bourbon.io
                files: WATCH_SASS_FILES,
                tasks: ['sass']
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['requirejs', 'sass', 'watch']);
};