import * as vscode from 'vscode';
import { AiProfileService, DbtProjectService, AiProfileNotConfiguredError, AiProfileUnavailableError } from '../core/types';

export class StatusBarManager implements vscode.Disposable {
  private aiItem: vscode.StatusBarItem;
  private dbtItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly aiProfileService: AiProfileService,
    private readonly dbtProjectService: DbtProjectService
  ) {
    this.aiItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.aiItem.command = 'dbtModelMate.selectAiProfile';
    this.aiItem.tooltip = 'dbt Model Mate: Click to switch AI profile';

    this.dbtItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    this.dbtItem.tooltip = 'dbt Model Mate: Active project';

    this.disposables.push(
      this.aiItem,
      this.dbtItem,
      aiProfileService.onDidChangeActiveProfile(() => this.refreshAiItem())
    );
  }

  async initialize(): Promise<void> {
    await Promise.all([this.refreshAiItem(), this.refreshDbtItem()]);
    this.aiItem.show();
    this.dbtItem.show();
  }

  showProfileUnavailable(profileName: string): void {
    this.aiItem.text = `$(warning) ${profileName} unavailable`;
    this.aiItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }

  private refreshAiItem(): void {
    const profile = this.aiProfileService.getActiveProfile();

    if (!profile) {
      this.aiItem.text = '$(alert) Configure AI';
      this.aiItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      return;
    }

    this.aiItem.text = `$(zap) ${profile.name} · ${profile.model}`;
    this.aiItem.backgroundColor = undefined;
  }

  private async refreshDbtItem(): Promise<void> {
    const info = await this.dbtProjectService.detect();

    if (!info) {
      this.dbtItem.hide();
      return;
    }

    const compat = info.isVersionCompatible ? '' : ' $(warning)';
    this.dbtItem.text = `$(database) ${info.name}${compat}`;
    this.dbtItem.tooltip = info.isVersionCompatible
      ? `dbt project: ${info.name}`
      : `dbt project: ${info.name} — version may not be compatible with dbt Model Mate (requires 1.7+)`;
    this.dbtItem.show();
  }

  handleAiError(err: unknown): void {
    if (err instanceof AiProfileNotConfiguredError) {
      vscode.window.showErrorMessage(err.message, 'Configure AI Profile').then(choice => {
        if (choice) vscode.commands.executeCommand('dbtModelMate.selectAiProfile');
      });
      return;
    }

    if (err instanceof AiProfileUnavailableError) {
      const profile = this.aiProfileService.getActiveProfile();
      if (profile) this.showProfileUnavailable(profile.name);

      vscode.window.showErrorMessage(
        `dbt Model Mate: ${err.message}`,
        'Switch Profile',
        'Retry'
      ).then(choice => {
        if (choice === 'Switch Profile') vscode.commands.executeCommand('dbtModelMate.selectAiProfile');
      });
      return;
    }

    vscode.window.showErrorMessage(`dbt Model Mate: Unexpected error — ${String(err)}`);
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}
