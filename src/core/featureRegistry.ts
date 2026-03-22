import * as vscode from 'vscode';
import { Feature, ServiceContainer } from './types';

export class FeatureRegistry {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly features: Feature[],
    private readonly services: ServiceContainer
  ) {}

  async activateAll(): Promise<void> {
    for (const feature of this.features) {
      try {
        const contributions = await feature.activate(this.services);
        this.disposables.push(...contributions.map(c => c.disposable));
        console.log(`[dbt Model Mate] Activated: ${feature.displayName}`);
      } catch (err) {
        console.error(`[dbt Model Mate] Failed to activate ${feature.displayName}:`, err);
        vscode.window.showErrorMessage(
          `dbt Model Mate: Failed to activate "${feature.displayName}". Check the developer console for details.`
        );
      }
    }
  }

  disposeAll(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
