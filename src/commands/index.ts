import { Notice } from 'obsidian';
import type YuelingSyncPlugin from '../main';

export function registerCommands(plugin: YuelingSyncPlugin): void {
	plugin.addCommand({
		id: 'sync-now',
		name: '立即同步文章',
		callback: () => plugin.runSync(),
	});

	plugin.addCommand({
		id: 'reset-sync-state',
		name: '重置同步状态',
		callback: async () => {
			await plugin.resetSyncState();
			new Notice('同步状态已重置，下次将重新拉取');
		},
	});

	plugin.addCommand({
		id: 'open-sync-folder',
		name: '打开同步目录',
		callback: () => plugin.openSyncFolder(),
	});

	plugin.addCommand({
		id: 'open-settings',
		name: '打开同步设置',
		callback: () => plugin.openSettings(),
	});
}
