import * as vscode from 'vscode';
import { buildServiceContainer } from './core/serviceContainer';
import { FeatureRegistry } from './core/featureRegistry';
import { StatusBarManager } from './ui/statusBar';
import { allFeatures } from './features';

let registry: FeatureRegistry;
let statusBar: StatusBarManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('[dbt Model Mate] Activating…');

  const services = buildServiceContainer(context);

  // Status bar
  statusBar = new StatusBarManager(services.aiProfiles, services.dbtProject);
  await statusBar.initialize();
  context.subscriptions.push(statusBar);

  // Register the profile picker command (UI concern, lives here not in a feature)
  context.subscriptions.push(
    vscode.commands.registerCommand('dbtModelMate.selectAiProfile', () =>
      showProfilePicker(services.aiProfiles)
    )
  );

  // Activate all features
  registry = new FeatureRegistry(allFeatures, services);
  await registry.activateAll();

  context.subscriptions.push({ dispose: () => registry.disposeAll() });

  console.log('[dbt Model Mate] Ready.');
}

export function deactivate(): void {
  // Disposables registered on context.subscriptions are cleaned up automatically.
}

// ─── Profile picker ───────────────────────────────────────────────────────────

async function showProfilePicker(profileService: import('./core/types').AiProfileService): Promise<void> {
  const profiles = profileService.getProfiles();
  const activeProfile = profileService.getActiveProfile();

  if (!profiles.length) {
    const choice = await vscode.window.showInformationMessage(
      'No AI profiles configured. Add one to get started.',
      'Learn More'
    );
    if (choice) {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-org/dbt-model-mate#configuration'));
    }
    return;
  }

  const items: vscode.QuickPickItem[] = profiles.map(p => ({
    label: p.name,
    description: `${p.provider} · ${p.model}`,
    detail: p.id === activeProfile?.id ? '$(check) Active' : '',
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title: 'dbt Model Mate: Select AI Profile',
    placeHolder: 'Choose an AI profile to activate',
  });

  if (!picked) return;

  const selected = profiles.find(p => p.name === picked.label);
  if (selected) {
    await profileService.setActiveProfile(selected.id);
    vscode.window.showInformationMessage(`AI profile switched to "${selected.name}".`);
  }
}
