// This is a VSCode extension that provides custom diagnostics for markdown files.
// It identifies lines containing specific keywords and marks them with different severity levels.
// 
// To enable this extension, copy it to your VSCode extensions folder
// vscode extension folder is located at:
// - Windows: %USERPROFILE%\.vscode\extensions
// - macOS/Linux: $HOME/.vscode/extensions

const vscode = require('vscode');

function activate(context) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('custom-md');
  context.subscriptions.push(diagnosticCollection);

  // Watch markdown files
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.md');

  const checkDocument = (document) => {
    if (document.languageId !== 'markdown') 
      return;

    const diagnostics = [];
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    const nextRegex = /(\{>>\s*|\(\s*)?\b(NEXT|WORK):\s*(.*)$/i;
    const todoRegex = /(\{>>\s*|\(\s*)?\b(TODO|FIXME|XXX):\s*(.*)$/i;
    const infoRegex = /(\{>>\s*|\(\s*)?\b(PLAN|INFO|DEV|IMPROVE):\s*(.*)$/i;
    var lineCount = 0;
    lines.forEach(thisLine => {
      let match;
      var tCode = "CM00";
      var tMessage = "undefined";
      var tSeverity = vscode.DiagnosticSeverity.Information;
      if ((match = nextRegex.exec(thisLine)) !== null) 
      {
        // fs.appendFileSync("c:\\Data\\AcademicDocs\\.markdownlint\\custom-rules\\debug.log",
        //   `line ${lineCount} (${rangeStart} + ${rangeLength})\n`);
        tCode = "CM01";  
        tSeverity = vscode.DiagnosticSeverity.Error;
      }
      else if ((match = todoRegex.exec(thisLine)) !== null)
      {
        tCode = "CM02";  
        tSeverity = vscode.DiagnosticSeverity.Warning;
      }
      else if ((match = infoRegex.exec(thisLine)) !== null)
      {
        tCode = "CM03";  
        tSeverity = vscode.DiagnosticSeverity.Information;
      }
      if (match !== null) {
        opening = match[1] || "";
        var rangeStart = match.index + opening.length || 0;
        tMessage = `${match[2]}: ${match[3]}`;

        // check for special syntax end
        var endSequence = "";
        if (opening.startsWith('{>>')) { 
          endSequence = '<<}';
        }
        else if (opening.startsWith('(')) {
          endSequence = ')';
        }
        else if (opening.startsWith('[')) {
          endSequence = ']';
        }
        if (endSequence.length > 0) {
          var endIndex = tMessage.indexOf(endSequence);
          if (endIndex >= 0) {
            tMessage = tMessage.substring(0, endIndex).trim();
          }
        }

        diagnostics.push({
          range: new vscode.Range(lineCount, rangeStart, lineCount, rangeStart+tMessage.length),
          message: tMessage,
          severity: tSeverity,
          source: 'custom-md',
          code: tCode
        });
      }
      lineCount++;
    });
    diagnosticCollection.set(document.uri, diagnostics);
  };

  // Check active editor
  if (vscode.window.activeTextEditor) {
    checkDocument(vscode.window.activeTextEditor.document);
  }

  // Check on file open/change
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(checkDocument),
    vscode.workspace.onDidChangeTextDocument(e => checkDocument(e.document)),
    vscode.window.onDidChangeActiveTextEditor(e => {
      if (e && e.document) checkDocument(e.document);
    })
  );

  // Check on file save
  watcher.onDidChange(uri => {
    const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
    if (doc) checkDocument(doc);
  });

  context.subscriptions.push(watcher);
}

function deactivate() {}

module.exports = { activate, deactivate };