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

    const todoRegex = /(TODO|FIXME):\s*(.*)$/i;
    const nextRegex = /(NEXT|WORK):\s*(.*)$/i;
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
        tMessage = `${match[0]}`;
        tSeverity = vscode.DiagnosticSeverity.Error;
      }
      else if ((match = todoRegex.exec(thisLine)) !== null)
      {
        tCode = "CM02";  
        tMessage = `${match[0]}`;
        tSeverity = vscode.DiagnosticSeverity.Warning;
      }
      if (match !== null) {
        var rangeStart = match.index || 0;
        var rangeLength = match[0].length || 0;
        diagnostics.push({
          range: new vscode.Range(lineCount, rangeStart, lineCount, rangeStart+rangeLength),
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