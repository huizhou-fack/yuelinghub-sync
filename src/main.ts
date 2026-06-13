import { Notice, Plugin } from 'obsidian';
import { registerCommands } from './commands';
import {
	DEFAULT_SETTINGS,
	YuelingSettingTab,
	YuelingSyncSettings,
} from './settings';
import { DEFAULT_SYNC_STATE, SyncState } from './types';
import { SyncEngine } from './sync/engine';

interface PluginData {
	settings: YuelingSyncSettings;
	syncState: SyncState;
}

interface AppWithSetting {
	setting: {
		open: () => void;
		openTabById: (id: string) => void;
	};
}

function getAppSetting(app: unknown): AppWithSetting['setting'] {
	return (app as AppWithSetting).setting;
}

export default class YuelingSyncPlugin extends Plugin {
	settings: YuelingSyncSettings = DEFAULT_SETTINGS;
	syncState: SyncState = { ...DEFAULT_SYNC_STATE };
	syncEngine!: SyncEngine;
	statusBarItem: HTMLElement;
	statusBarText: HTMLElement;
	statusBarSettings: HTMLElement;
	private autoSyncTimer: number | null = null;

	async onload() {
		await this.loadPluginData();

		this.syncEngine = new SyncEngine(
			this.app,
			() => this.settings,
			() => this.syncState,
			(state) => this.saveSyncState(state),
		);

		this.addRibbonIcon('download', '同步阅灵文章', () => {
			void this.runSync();
		});

		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.addClass('yuelinghub-sync-status-bar');
		this.statusBarText = this.statusBarItem.createSpan({ cls: 'yuelinghub-sync-status-text' });
		this.statusBarSettings = this.statusBarItem.createSpan({
			cls: 'yuelinghub-sync-settings-link',
			text: '设置',
		});
		this.statusBarSettings.setAttr('title', 'Open Yueling Sync settings');
		this.statusBarSettings.setAttr('aria-label', 'Open Yueling Sync settings');
		this.registerDomEvent(this.statusBarSettings, 'click', (event: MouseEvent) => {
			event.stopPropagation();
			this.openSettings();
		});
		this.updateStatusBar('就绪');

		registerCommands(this);
		this.addSettingTab(new YuelingSettingTab(this.app, this));
		this.resetAutoSyncInterval();
	}

	onunload() {
		if (this.autoSyncTimer !== null) {
			window.clearInterval(this.autoSyncTimer);
		}
	}

	showNotice(message: string): void {
		new Notice(message);
	}

	updateStatusBar(message: string): void {
		this.statusBarText.setText(`阅灵: ${message}`);
	}

	openSettings(): void {
		const setting = getAppSetting(this.app);
		setting.open();
		setting.openTabById(this.manifest.id);
	}

	async runSync(): Promise<void> {
		if (this.syncEngine.isSyncing()) {
			this.showNotice('同步正在进行中');
			return;
		}

		this.updateStatusBar('同步中…');
		try {
			const result = await this.syncEngine.sync((message) => {
				this.updateStatusBar(message);
			});
			const summary = `新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}，失败 ${result.failed}`;
			this.showNotice(`同步完成：${summary}`);
			this.updateStatusBar(summary);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.showNotice(`同步失败：${message}`);
			this.updateStatusBar('同步失败');
		}
	}

	async resetSyncState(): Promise<void> {
		this.syncState = { ...DEFAULT_SYNC_STATE };
		await this.savePluginData();
	}

	openSyncFolder(): void {
		const folderPath = this.settings.targetFolder;
		const files = this.app.vault.getMarkdownFiles()
			.filter((file) => file.path === folderPath || file.path.startsWith(`${folderPath}/`))
			.sort((a, b) => b.stat.mtime - a.stat.mtime);

		if (files.length === 0) {
			this.showNotice(`目录 ${folderPath} 中暂无文章，请先同步`);
			return;
		}

		const latestFile = files[0];
		if (!latestFile) {
			this.showNotice(`目录 ${folderPath} 中暂无文章，请先同步`);
			return;
		}

		this.showNotice(`最近同步文章：${latestFile.path}`);
	}

	resetAutoSyncInterval(): void {
		if (this.autoSyncTimer !== null) {
			window.clearInterval(this.autoSyncTimer);
			this.autoSyncTimer = null;
		}

		const minutes = this.settings.autoSyncIntervalMin;
		if (minutes <= 0) {
			return;
		}

		this.autoSyncTimer = window.setInterval(() => {
			void this.runSync();
		}, minutes * 60 * 1000);
		this.registerInterval(this.autoSyncTimer);
	}

	async loadSettings(): Promise<void> {
		await this.loadPluginData();
	}

	async saveSettings(): Promise<void> {
		await this.savePluginData();
		this.resetAutoSyncInterval();
	}

	async saveSyncState(state: SyncState): Promise<void> {
		this.syncState = state;
		await this.savePluginData();
	}

	private async loadPluginData(): Promise<void> {
		const data = await this.loadData() as Partial<PluginData> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data?.settings);
		if ((this.settings.syncMode as string) === 'tag') {
			this.settings.syncMode = 'all';
		}
		this.syncState = Object.assign({}, DEFAULT_SYNC_STATE, data?.syncState);
		if (data?.syncState?.syncedPosts) {
			this.syncState.syncedPosts = { ...data.syncState.syncedPosts };
		}
	}

	private async savePluginData(): Promise<void> {
		await this.saveData({
			settings: this.settings,
			syncState: this.syncState,
		});
	}
}
