import * as vscode from 'vscode';
import { generatePassword, PasswordOptions } from './generator';

function getOptions(): PasswordOptions {
  const cfg = vscode.workspace.getConfiguration('passwordGenerator');
  return {
    length: cfg.get<number>('length', 16),
    includeUppercase: cfg.get<boolean>('includeUppercase', true),
    includeLowercase: cfg.get<boolean>('includeLowercase', true),
    includeNumbers: cfg.get<boolean>('includeNumbers', true),
    includeSymbols: cfg.get<boolean>('includeSymbols', true),
    excludeAmbiguous: cfg.get<boolean>('excludeAmbiguous', false),
  };
}

async function askOptions(): Promise<PasswordOptions | undefined> {
  const lengthInput = await vscode.window.showInputBox({
    prompt: 'Password length',
    value: String(getOptions().length),
    validateInput: (v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 4 && n <= 128 ? null : 'Enter a number between 4 and 128';
    },
  });

  if (lengthInput === undefined) { return undefined; }

  const charsetItems: vscode.QuickPickItem[] = [
    { label: 'Uppercase (A-Z)',  picked: getOptions().includeUppercase },
    { label: 'Lowercase (a-z)',  picked: getOptions().includeLowercase },
    { label: 'Numbers (0-9)',    picked: getOptions().includeNumbers },
    { label: 'Symbols (!@#...)', picked: getOptions().includeSymbols },
    { label: 'Exclude ambiguous characters (0, O, I, l, 1)', picked: getOptions().excludeAmbiguous },
  ];

  const picked = await vscode.window.showQuickPick(charsetItems, {
    canPickMany: true,
    placeHolder: 'Select character sets',
  });

  if (!picked) { return undefined; }

  const labels = new Set(picked.map((i) => i.label));

  return {
    length: Number(lengthInput),
    includeUppercase: labels.has('Uppercase (A-Z)'),
    includeLowercase: labels.has('Lowercase (a-z)'),
    includeNumbers: labels.has('Numbers (0-9)'),
    includeSymbols: labels.has('Symbols (!@#...)'),
    excludeAmbiguous: labels.has('Exclude ambiguous characters (0, O, I, l, 1)'),
  };
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('password-generator.generate', async () => {
      const options = await askOptions();
      if (!options) { return; }

      let password: string;
      try {
        password = generatePassword(options);
      } catch (e: unknown) {
        vscode.window.showErrorMessage((e as Error).message);
        return;
      }

      const action = await vscode.window.showInformationMessage(
        `Generated: ${password}`,
        'Copy to Clipboard',
        'Insert at Cursor',
      );

      if (action === 'Copy to Clipboard') {
        await vscode.env.clipboard.writeText(password);
        vscode.window.showInformationMessage('Password copied to clipboard.');
      } else if (action === 'Insert at Cursor') {
        await insertAtCursor(password);
      }
    }),

    vscode.commands.registerCommand('password-generator.generateAndInsert', async () => {
      let password: string;
      try {
        password = generatePassword(getOptions());
      } catch (e: unknown) {
        vscode.window.showErrorMessage((e as Error).message);
        return;
      }
      await insertAtCursor(password);
      vscode.window.setStatusBarMessage(`Password inserted: ${password}`, 4000);
    }),

    vscode.commands.registerCommand('password-generator.generateAndCopy', async () => {
      let password: string;
      try {
        password = generatePassword(getOptions());
      } catch (e: unknown) {
        vscode.window.showErrorMessage((e as Error).message);
        return;
      }
      await vscode.env.clipboard.writeText(password);
      vscode.window.showInformationMessage(`Password copied: ${password}`);
    }),
  );
}

async function insertAtCursor(password: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor to insert the password.');
    return;
  }
  await editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      editBuilder.replace(selection, password);
    }
  });
}

export function deactivate() {}
