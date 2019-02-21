/*
 * Grunt for arkCommon
 * Author: s.narumi
*/

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: '\n\n'
			},
			files: {
                src: [
                    'src/htmlparser.es6',
                    'src/Parser.es6',
                    'src/ParseText.es6',
                    'src/ParseScript.es6',
                    'src/ParseTag.es6',
                    'src/ParseAttr_findName.es6',
                    'src/ParseAttr_findValue.es6',
                    'src/ParseAttr.es6',
                    'src/ParseCData.es6',
                    'src/ParseDoctype.es6',
                    'src/ParseComment.es6',
                    'src/HtmlBuilder.es6',
                    'src/Element.es6',
                    'src/DomUtils.es6'],
				//src: 'src/*.es6',
				dest: 'lib/htmlparser.es6'
			}
		},
		uglify: {
            options: {
                output: {
                    comments: false
                }
            },
            target: {
                files: {
                    'lib/htmlparser.min.js': ['lib/htmlparser.js']
                }
            }
        },
        babel: {
            options: {
              sourceMap: true,
              presets: ['es2015'],
              plugins: ["transform-es2015-modules-umd","add-module-exports"]
            },
            dist: {
              files: {
                'lib/htmlparser.js': 'lib/htmlparser.es6'
              }
            }
          }
	});

	grunt.file.expand('./node_modules/grunt-*/tasks').forEach(grunt.loadTasks);
	grunt.registerTask('default', ['concat','babel', 'uglify']);

};
