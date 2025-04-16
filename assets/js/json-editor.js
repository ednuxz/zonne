document.addEventListener('DOMContentLoaded', function() {
    // Cargar tema adicional para mejor visualización
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/eclipse.min.css';
    document.head.appendChild(link);
    
    // Añadir estilo personalizado para fondo gris claro
    var customStyle = document.createElement('style');
    customStyle.textContent = '.CodeMirror { background-color: #f5f5f5 !important; }'; // Gris muy claro
    document.head.appendChild(customStyle);
    
    // Cargar addons adicionales para mejorar la experiencia
    var scripts = [
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/hint/show-hint.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/hint/javascript-hint.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/lint/lint.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/lint/json-lint.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/selection/active-line.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/search/search.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/search/searchcursor.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/search/jump-to-line.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/search/match-highlighter.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/dialog/dialog.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/comment/comment.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jsonlint/1.6.0/jsonlint.min.js'
    ];
    
    // Cargar CSS adicional para los addons
    var styles = [
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/hint/show-hint.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/lint/lint.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/addon/dialog/dialog.min.css'
    ];
    
    // Función para cargar scripts de forma secuencial
    function loadScripts(scripts, index, callback) {
        if (index >= scripts.length) {
            if (callback) callback();
            return;
        }
        
        var script = document.createElement('script');
        script.src = scripts[index];
        script.onload = function() {
            loadScripts(scripts, index + 1, callback);
        };
        document.head.appendChild(script);
    }
    
    // Cargar estilos
    styles.forEach(function(href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    });
    
    // Inicializar CodeMirror con configuración mejorada después de cargar scripts
    loadScripts(scripts, 0, function() {
        var jsonEditor = CodeMirror.fromTextArea(document.querySelector('textarea.form-control'), {
            mode: {
                name: 'javascript',
                json: true,
                statementIndent: 2
            },
            theme: 'eclipse',
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Tab': function(cm) {
                    var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
                    cm.replaceSelection(spaces);
                },
                'Ctrl-F': 'findPersistent',
                'Ctrl-/': function(cm) {
                    // Comentar/descomentar línea
                    cm.toggleComment();
                },
                'Ctrl-J': function(cm) {
                    // Formatear JSON
                    try {
                        var content = cm.getValue();
                        if (content.trim()) {
                            var formatted = JSON.stringify(JSON.parse(content), null, 2);
                            cm.setValue(formatted);
                        }
                    } catch (e) {
                        console.error('Error al formatear JSON:', e);
                    }
                }
            },
            lineWrapping: true,
            indentUnit: 2,
            smartIndent: true,
            indentWithTabs: false,
            lint: true,
            electricChars: true,
            styleActiveLine: true,
            autoCloseTags: true,
            highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true},
            lint: {
                getAnnotations: function(text, updateLinting, options, cm) {
                    if (!cm) return;
                    try {
                        if (!text.trim()) return [];
                        JSON.parse(text);
                        updateLinting([]);
                    } catch (e) {
                        let pos = 0;
                        try {
                            pos = e.at - 1;
                        } catch (posError) {
                            pos = text.length;
                        }
                        updateLinting([{
                            from: cm.posFromIndex(Math.max(0, pos)),
                            to: cm.posFromIndex(Math.min(text.length, pos + 1)),
                            message: e.message,
                            severity: 'error'
                        }]);
                    }
                },
                delay: 300
            }
        });
        
        // Formatear JSON al perder el foco
    jsonEditor.on('blur', function() {
            try {
                var content = jsonEditor.getValue();
                if (content.trim()) {
                    var formatted = JSON.stringify(JSON.parse(content), null, 2);
                    jsonEditor.setValue(formatted);
                }
            } catch (e) {
                console.error('Error al formatear JSON:', e);
                // No mostrar alerta para no interrumpir al usuario
            }
        });

        // Configurar autocompletado personalizado para JSON
        var jsonHint = function(cm, options) {
            var cursor = cm.getCursor();
            var token = cm.getTokenAt(cursor);
            var line = cm.getLine(cursor.line);
            var currentWord = token.string;
            
            // Sugerencias comunes en JSON
       
            
            return {
                from: CodeMirror.Pos(cursor.line, token.start),
                to: CodeMirror.Pos(cursor.line, token.end)
            };
        };
        
        // Registrar el autocompletado personalizado
        CodeMirror.registerHelper('hint', 'json', jsonHint);
        
        // Activar autocompletado al escribir, evitando caracteres especiales
        jsonEditor.on('keyup', function(cm, event) {
            // No mostrar sugerencias para caracteres especiales como comas, dos puntos o comillas
            var specialChars = [',', ':', '"', '{', '}', '[', ']'];
            var char = String.fromCharCode(event.keyCode);
            
            if (!cm.state.completionActive && 
                event.keyCode != 13 && event.keyCode != 27 && 
                event.keyCode != 37 && event.keyCode != 38 && 
                event.keyCode != 39 && event.keyCode != 40 &&
                !specialChars.includes(char) && 
                event.key !== ',' && event.key !== ':' && event.key !== '"' &&
                event.key !== '{' && event.key !== '}' && event.key !== '[' && event.key !== ']') {
                CodeMirror.commands.autocomplete(cm, null, {completeSingle: false});
            }
        });
        
        // Mostrar mensaje de ayuda
        var helpText = document.createElement('div');
        helpText.className = 'text-muted small';
        helpText.style.marginTop = '5px';
        helpText.innerHTML = 'Atajos: <kbd>Ctrl+J</kbd> Formatear | <kbd>Ctrl+F</kbd> Buscar | <kbd>Ctrl+/</kbd> Comentar';
        document.querySelector('textarea.form-control').parentNode.appendChild(helpText);
        
        // Ajustar tamaño del editor para que ocupe el 100% del ancho del contenedor
        jsonEditor.setSize('100%', '30rem');
        
        // Asegurar que el editor se ajuste correctamente al contenedor
        var editorElement = jsonEditor.getWrapperElement();
        editorElement.style.width = '100%';
        editorElement.style.maxWidth = '100%';
        
        // Añadir validación en tiempo real
        jsonEditor.on('change', function(cm) {
            cm.performLint();
            
            // Analizar JSON para filtros cuando el contenido es válido
            try {
                const content = cm.getValue();
                if (content.trim()) {
                    // Verificar si es un array JSON válido
                    const parsedJson = JSON.parse(content);
                    if (Array.isArray(parsedJson) && parsedJson.length > 0) {
                        // Activar el análisis de filtros si existe el FilterManager
                        if (window.filterManager) {
                            window.filterManager.analyzeJson(content);
                        }
                    }
                }
            } catch (e) {
                // No hacer nada si el JSON no es válido
                console.debug('JSON no válido para análisis de filtros:', e);
            }
        });
    });
});