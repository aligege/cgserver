'use strict';

import { global } from "../../global";

var  _suffix = ".cshtml"
var  _MATCH_HTML = /[&<>\'"]/g
var  _ENCODE_HTML_RULES = {
    '&': '&amp;'
    , '<': '&lt;'
    , '>': '&gt;'
    , '"': '&#34;'
    , "'": '&#39;'
}

var  encode_char = function (c)
{
    return _ENCODE_HTML_RULES[c] || c;
}

var  utils =
 {
    regExpChars: /[|\\{}()[\]^$+*?.]/g,
    
    escapeRegExpChars : function (string)
    {
        // istanbul ignore if
        if (!string)
        {
            return '';
        }
        return String(string).replace(this.regExpChars, '\\$&');
    },
    
    escapeFuncStr :
 'var  _ENCODE_HTML_RULES = {\n' 
    + '      "&": "&amp;"\n' 
    + '    , "<": "&lt;"\n' 
    + '    , ">": "&gt;"\n' 
    + '    , \'"\': "&#34;"\n' 
    + '    , "\'": "&#39;"\n' 
    + '    }\n' 
    + '  , _MATCH_HTML = /[&<>\'"]/g;\n' 
    + 'function encode_char(c) {\n' 
    + '  return _ENCODE_HTML_RULES[c] || c;\n' 
    + '};\n',
    
    escapeXML : function (markup)
    {
        return markup == undefined
        ? ''
        : String(markup)
            .replace(_MATCH_HTML, encode_char);
    },
    shallowCopy : function (to, from)
    {
        from = from || {};
        for (var  p in from)
        {
            to[p] = from[p];
        }
        return to;
    },
    
    cache : 
    {
        _data: {},
        set: function (key, val)
        {
            this._data[key] = val;
        },
        get: function (key)
        {
            return this._data[key];
        },
        reset: function ()
        {
            this._data = {};
        }
    },
}

utils.escapeXML.toString = function ()
{
    return Function.prototype.toString.call(this) + ';\n' + this.escapeFuncStr
};




var  fs = require('fs')
var  scopeOptionWarned = false
var  _DEFAULT_DELIMITER = '%'
var  _DEFAULT_LOCALS_NAME = 'locals'
var  _REGEX_STRING = '(<%%|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)'
var  _OPTS = ['cache', 'filename', 'delimiter', 'scope', 'context'
            , 'debug', 'compileDebug', 'client', '_with', 'rmWhitespace'
            , 'strict', 'localsName'
]
var  _TRAILING_SEMCOL = /;\s*$/
var  _BOM = /^\uFEFF/

export class RazorJs
{
    protected _request=null
    protected _response=null
    cache=utils.cache
    localsName=_DEFAULT_LOCALS_NAME
    constructor()
    {

    }
    resolveInclude(name, filename)
    {
        var  path = require('path')
        , dirname = path.dirname
        , extname = path.extname
        , resolve = path.resolve
        , includePath = resolve(dirname(filename), name)
        , ext = extname(name);
        if (!ext)
        {
            includePath += _suffix;
        }
        return includePath;
    }
    _handleCache(options, template?)
    {
        var  fn
        var  path = options.filename
        var  hasTemplate = arguments.length > 1;
        
        if (options.cache)
        {
            if (!path)
            {
                throw new Error('cache option requires a filename');
            }
            fn = exports.cache.get(path);
            if (fn)
            {
                return fn;
            }
            if (!hasTemplate)
            {
                template = fs.readFileSync(path).toString().replace(_BOM, '');
            }
        }
        else if (!hasTemplate)
        {
            // istanbul ignore if: should not happen at all
            if (!path)
            {
                throw new Error('Internal Razor error: no file name or template ' 
                            + 'provided');
            }
            template = fs.readFileSync(path).toString().replace(_BOM, '');
        }
        fn = this.compile(template, options);
        if (options.cache)
        {
            this.cache.set(path, fn);
        }
        return fn;
    }
    includeFile(path, options)
    {
        var  opts = utils.shallowCopy({}, options);
        if (!opts.filename)
        {
            throw new Error('`include` requires the \'filename\' option.');
        }
        opts.filename = this.resolveInclude(path, opts.filename);
        return this._handleCache(opts);
    }
    includeSource(path, options)
    {
        var  opts = utils.shallowCopy({}, options)
            , includePath
            , template;
        includePath = path;
        /*
        if (!opts.filename)
        {
            includePath = path;
        }
        else
        {
            includePath = this.resolveInclude(path, opts.filename);
        }
        */
        /*解决view里面使用其他controller的action返回的分部view，，，但是该功能暂时搁置，因为按照现在的写法无法支持异步操作
         * 而nodejs异步操作是特点所以不去扼杀它的优势了
        if (includePath.lastIndexOf(".") <= 0)
        {
            engine.getEngine().getHtmlFromPath(this._request,this._response,includePath)
            return null
        }
         * */
        template = fs.readFileSync(includePath).toString().replace(_BOM, '');
        
        options.filename = includePath;
        opts.filename = includePath;
        var  templ = new Template(this, template, opts);
        templ.generateSource();
        return templ.source;
    }
    _cpOptsInData(data, opts)
    {
        _OPTS.forEach(function (p)
        {
            if (typeof data[p] != 'undefined')
            {
                opts[p] = data[p]
            }
        })
    }
    compile(template, opts)
    {
        var  templ;
        
        // v1 compat
        // 'scope' is 'context'
        // FIXME: Remove this in a future version
        if (opts && opts.scope)
        {
            if (!scopeOptionWarned)
            {
                console.warn('`scope` option is deprecated and will be removed in Razor 3');
                scopeOptionWarned = true;
            }
            if (!opts.context)
            {
                opts.context = opts.scope;
            }
            delete opts.scope;
        }
        templ = new Template(this, template, opts);
        return templ.compile();
    }
    render(req, res, tmpl_path, data, opts)
    {
        this._request = req
        this._response = res
        var cs_path=tmpl_path+".cshtml"
        var  template = fs.readFileSync(cs_path).toString()
        if(!template)
        {
            var h5_path=tmpl_path+".html"
            var html = fs.readFileSync(h5_path).toString()
            if(html)
            {
                return html
            }
            global.gLog.error("no view:"+tmpl_path)
            return "Server Error(No View)"
        }
        data = data || {};
        opts = opts || {};
        var  fn;
        
        // No options object -- if there are optiony names
        // in the data, copy them to options
        if (arguments.length == 2)
        {
            this._cpOptsInData(data, opts)
        }
        
        return this._handleCache(opts, template)(data);
    }
    renderFile()
    {
        var  args = Array.prototype.slice.call(arguments)
        , path = args.shift()
        , cb = args.pop()
        , data = args.shift() || {}
        , opts = args.pop() || {}
        , result;
        
        // Don't pollute passed in opts obj with new vals
        opts = utils.shallowCopy({}, opts);
        
        // No options object -- if there are optiony names
        // in the data, copy them to options
        if (arguments.length == 3)
        {
            // Express 4
            if (data.settings && data.settings['view options'])
            {
                this._cpOptsInData(data.settings['view options'], opts);
            }
        // Express 3 and lower
            else
            {
                this._cpOptsInData(data, opts);
            }
        }
        opts.filename = path;
        
        try
        {
            result = this._handleCache(opts)(data);
        }
        catch (err)
        {
            return cb(err);
        }
        return cb(null, result);
    }
    clearCache ()
    {
        this.cache.reset();
    }
}

var  rethrow = function (err, str, filename, lineno)
{
    var  lines = str.split('\n')
            , start = Math.max(lineno - 3, 0)
            , end = Math.min(lines.length, lineno + 3);
    
    // Error context
    var  context = lines.slice(start, end).map(function (line, i)
    {
        var  curr = i + start + 1;
        return (curr == lineno ? ' >> ' : '    ') 
              + curr 
              + '| ' 
              + line;
    }).join('\n');
    
    // Alter exception message
    err.path = filename;
    err.message = (filename || 'razor') + ':' 
            + lineno + '\n' 
            + context + '\n\n' 
            + err.message;
    
    throw err;
}

class Template
{
    _razorJs=null
    templateText:string=""
    mode=null
    truncate:boolean=false
    currentLine:number=1
    source:string=""
    dependencies=[]
    opts=null
    regex=null
    modes = 
    {
        EVAL: 'eval',
        ESCAPED: 'escaped',
        RAW: 'raw',
        COMMENT: 'comment',
        LITERAL: 'literal'
    }
    constructor(razorjs, text, opts)
    {
        this._razorJs = razorjs;
        opts = opts || {};
        this.templateText = text;
        var  options = 
        {
            client : opts.client || false,
            escapeFunction : opts.escape || utils.escapeXML,
            compileDebug : opts.compileDebug !== false,
            debug : !!opts.debug,
            filename : opts.filename,
            delimiter : opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER,
            strict : opts.strict || false,
            context : opts.context,
            cache : opts.cache || false,
            rmWhitespace : opts.rmWhitespace,
            localsName : opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME,
            _with:false,
        }
        
        if (!options.strict)
        {
            options._with = typeof opts._with != 'undefined' ? opts._with : true;
        }
        
        this.opts = options;
        
        this.regex = this.createRegex();
    }
    createRegex()
    {
        var  str = _REGEX_STRING
      , delim = utils.escapeRegExpChars(this.opts.delimiter);
        str = str.replace(/%/g, delim);
        return new RegExp(str);
    }
    compile()
    {
        var  src
          , fn
          , opts = this.opts
          , prepended = ''
          , appended = ''
          , escape = opts.escapeFunction;
        
        if (opts.rmWhitespace)
        {
            // Have to use two separate replace here as `^` and `$` operators don't
            // work well with `\r`.
            this.templateText =
        this.templateText.replace(/\r/g, '').replace(/^\s+|\s+$/gm, '');
        }
        
        // Slurp spaces and tabs before <%_ and after _%>
        this.templateText =
        this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');
        
        if (!this.source)
        {
            this.generateSource();
            prepended += '  var  __output = [], __append = __output.push.bind(__output);' + '\n';
            if (opts._with !== false)
            {
                prepended += '  with (' + opts.localsName + ' || {}) {' + '\n';
                appended += '  }' + '\n';
            }
            appended += '  return __output.join("");' + '\n';
            this.source = prepended + this.source + appended;
        }
        
        if (opts.compileDebug)
        {
            src = 'var  __line = 1' + '\n' 
          + '  , __lines = ' + JSON.stringify(this.templateText) + '\n' 
          + '  , __filename = ' + (opts.filename ?
                JSON.stringify(opts.filename) : 'undefined') + ';' + '\n' 
          + 'try {' + '\n' 
          + this.source 
          + '} catch (e) {' + '\n' 
          + '  rethrow(e, __lines, __filename, __line);' + '\n' 
          + '}' + '\n';
        }
        else
        {
            src = this.source;
        }
        
        if (opts.debug)
        {
            console.log(src);
        }
        
        if (opts.client)
        {
            src = 'escape = escape || ' + escape.toString() + ';' + '\n' + src;
            if (opts.compileDebug)
            {
                src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
            }
        }
        
        if (opts.strict)
        {
            src = '"use strict";\n' + src;
        }
        
         try
        {
            fn = new Function(opts.localsName + ', escape, include, rethrow', src);
        }
        
        catch (e)
        {
            // istanbul ignore else
            if (e instanceof SyntaxError)
            {
                if (opts.filename)
                {
                    e.message += ' in ' + opts.filename;
                }
                e.message += ' while compiling razor';
            }
            throw e;
        }
        
        if (opts.client)
        {
            fn.dependencies = this.dependencies;
            return fn;
        }
        
        // Return a callable function which will execute the function
        // created by the source-code, with the passed data as locals
        // Adds a local `include` function which allows full recursive include
        var  returnedFn:any = (data)=>
        {
            var  include = (path, includeData)=>
            {
                var  d = utils.shallowCopy({}, data);
                if (includeData)
                {
                    d = utils.shallowCopy(d, includeData);
                }
                return this._razorJs.includeFile(path, opts)(d);
            };
            return fn.apply(opts.context, [data || {}, escape, include, rethrow]);
        };
        returnedFn.dependencies = this.dependencies;
        return returnedFn;
    }
    
    generateSource()
    {
        var  self = this
        var  matches = this.parseTemplateText()
        var  d = this.opts.delimiter
        
        if (matches && matches.length)
        {
            matches.forEach(function (line, index)
            {
                var  opening
                var  closing
                var  include
                var  includeOpts
                var  includeSrc
                // If this is an opening tag, check for closing tags
                // FIXME: May end up with some false positives here
                // Better to store modes as k/v with '<' + delimiter as key
                // Then this can simply check against the map
                if (line.indexOf('<' + d) === 0 // If it is a tag
                    && line.indexOf('<' + d + d) !== 0)
                { // and is not escaped
                    closing = matches[index + 2];
                    if (!(closing == d + '>' || closing == '-' + d + '>' || closing == '_' + d + '>'))
                    {
                        throw new Error('Could not find matching close tag for "' + line + '".');
                    }
                }
                // HACK: backward-compat `include` preprocessor directives
                if ((include = line.match(/^\s*include\s+(\S+)/)))
                {
                    opening = matches[index - 1];
                    // Must be in EVAL or RAW mode
                    if (opening && (opening == '<' + d || opening == '<' + d + '-' || opening == '<' + d + '_'))
                    {
                        includeOpts = utils.shallowCopy({}, self.opts);
                        includeSrc = self._razorJs.includeSource(include[1], includeOpts);
                        includeSrc = '    ; (function(){' + '\n' + includeSrc +
                '    ; })()' + '\n';
                        self.source += includeSrc;
                        self.dependencies.push(self._razorJs.resolveInclude(include[1],
                includeOpts.filename));
                        return;
                    }
                }
                self.scanLine(line);
            });
        }

    }
    parseTemplateText()
    {
        var  str = this.templateText
      , pat = this.regex
      , result = pat.exec(str)
      , arr = []
      , firstPos
      , lastPos;
        
        while (result)
        {
            firstPos = result.index;
            lastPos = pat.lastIndex;
            
            if (firstPos !== 0)
            {
                arr.push(str.substring(0, firstPos));
                str = str.slice(firstPos);
            }
            
            arr.push(result[0]);
            str = str.slice(result[0].length);
            result = pat.exec(str);
        }
        
        if (str)
        {
            arr.push(str);
        }
        
        return arr;
    }
    scanLine(line)
    {
        var  self = this
      , d = this.opts.delimiter
      , newLineCount = 0;
        
        function _addOutput()
        {
            if (self.truncate)
            {
                // Only replace single leading linebreak in the line after
                // -%> tag -- this is the single, trailing linebreak
                // after the tag that the truncation mode replaces
                // Handle Win / Unix / old Mac linebreaks -- do the \r\n
                // combo first in the regex-or
                line = line.replace(/^(?:\r\n|\r|\n)/, '')
                self.truncate = false;
            }
            else if (self.opts.rmWhitespace)
            {
                // Gotta be more careful here.
                // .replace(/^(\s*)\n/, '$1') might be more appropriate here but as
                // rmWhitespace already removes trailing spaces anyway so meh.
                line = line.replace(/^\n/, '');
            }
            if (!line)
            {
                return;
            }
            
            // Preserve literal slashes
            line = line.replace(/\\/g, '\\\\');
            
            // Convert linebreaks
            line = line.replace(/\n/g, '\\n');
            line = line.replace(/\r/g, '\\r');
            
            // Escape double-quotes
            // - this will be the delimiter during execution
            line = line.replace(/"/g, '\\"');
            self.source += '    ; __append("' + line + '")' + '\n';
        }
        
        newLineCount = (line.split('\n').length - 1);
        
        switch (line)
        {
            case '<' + d:
            case '<' + d + '_':
                this.mode = this.modes.EVAL;
                break;
            case '<' + d + '=':
                this.mode = this.modes.ESCAPED;
                break;
            case '<' + d + '-':
                this.mode = this.modes.RAW;
                break;
            case '<' + d + '#':
                this.mode = this.modes.COMMENT;
                break;
            case '<' + d + d:
                this.mode = this.modes.LITERAL;
                this.source += '    ; __append("' + line.replace('<' + d + d, '<' + d) + '")' + '\n';
                break;
            case d + '>':
            case '-' + d + '>':
            case '_' + d + '>':
                if (this.mode == this.modes.LITERAL)
                {
                    _addOutput();
                }
                
                this.mode = null;
                this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
                break;
            default:
                // In script mode, depends on type of tag
                if (this.mode)
                {
                    // If '//' is found without a line break, add a line break.
                    switch (this.mode)
                    {
                        case this.modes.EVAL:
                        case this.modes.ESCAPED:
                        case this.modes.RAW:
                            if (line.lastIndexOf('//') > line.lastIndexOf('\n'))
                            {
                                line += '\n';
                            }
                    }
                    switch (this.mode)
                    {
            // Just executing code
                        case this.modes.EVAL:
                            this.source += '    ; ' + line + '\n';
                            break;
            // Exec, esc, and output
                        case this.modes.ESCAPED:
                            this.source += '    ; __append(escape(' +
                            line.replace(_TRAILING_SEMCOL, '').trim() + '))' + '\n';
                            break;
            // Exec and output
                        case this.modes.RAW:
                            this.source += '    ; __append(' +
                            line.replace(_TRAILING_SEMCOL, '').trim() + ')' + '\n';
                            break;
                        case this.modes.COMMENT:
                            // Do nothing
                            break;
            // Literal <%% mode, append as raw output
                        case this.modes.LITERAL:
                            _addOutput();
                            break;
                    }
                }
        // In string mode, just add the output
                else
                {
                    _addOutput();
                }
        }
        
        if (self.opts.compileDebug && newLineCount)
        {
            this.currentLine += newLineCount;
            this.source += '    ; __line = ' + this.currentLine + '\n';
        }
    }
}
