import { App, TFile } from 'obsidian';
import { YuelingSyncSettings } from '../settings';
import { SyncState, SyncResult, YuelingArticle } from '../types';
import { ApiError, YuelingApiClient } from '../api/client';
import { articleToMarkdown } from './mapper';
import { buildArticlePath } from '../utils/filename';
import { validateSyncSettings } from './validation';

export class SyncEngine {
	private syncing = false;

	constructor(
		private app: App,
		private getSettings: () => YuelingSyncSettings,
		private getSyncState: () => SyncState,
		private saveSyncState: (state: SyncState) => Promise<void>,
	) {}

	isSyncing(): boolean {
		return this.syncing;
	}

	async sync(onProgress?: (message: string) => void): Promise<SyncResult> {
		if (this.syncing) {
			throw new Error('同步正在进行中');
		}

		const settings = this.getSettings();
		if (!settings.token.trim()) {
			throw new Error('请先在设置中填写 token');
		}
		validateSyncSettings(settings);

		this.syncing = true;
		const result: SyncResult = {
			created: 0,
			updated: 0,
			skipped: 0,
			failed: 0,
			errors: [],
		};

		const syncState = { ...this.getSyncState(), syncedPosts: { ...this.getSyncState().syncedPosts } };
		const client = new YuelingApiClient(settings.apiBaseUrl);
		let cursor = 0;
		let hasMore = true;
		let maxPostTime = syncState.lastSyncTime;
		const missingCount = this.pruneMissingFiles(syncState);
		const since = missingCount > 0 ? 0 : syncState.lastSyncTime;

		try {
			await client.authorize(settings.token);
			if (missingCount > 0) {
				onProgress?.(`检测到 ${missingCount} 篇本地笔记已删除，正在重新拉取…`);
			} else {
				onProgress?.('开始同步文章…');
			}

			while (hasMore) {
				const response = await client.fetchArticles({
					token: settings.token,
					mode: settings.syncMode,
					groupId: settings.groupId,
					since,
					cursor,
				});

				for (const article of response.articles) {
					try {
						const writeResult = await this.writeArticle(article, settings, syncState);
						if (writeResult === 'created') {
							result.created++;
						} else if (writeResult === 'updated') {
							result.updated++;
						} else {
							result.skipped++;
						}

						if (article.post_time > maxPostTime) {
							maxPostTime = article.post_time;
						}
					} catch (error) {
						result.failed++;
						const message = error instanceof Error ? error.message : String(error);
						result.errors.push(`${article.title}: ${message}`);
					}
				}

				hasMore = response.has_more;
				cursor = response.next_cursor;
				onProgress?.(`已处理 ${result.created + result.updated + result.skipped + result.failed} 篇…`);
			}

			syncState.lastSyncTime = maxPostTime;
			await this.saveSyncState(syncState);
			onProgress?.('同步完成');
			return result;
		} catch (error) {
			if (error instanceof ApiError) {
				throw new Error(error.message);
			}
			throw error;
		} finally {
			this.syncing = false;
		}
	}

	private async writeArticle(
		article: YuelingArticle,
		settings: YuelingSyncSettings,
		syncState: SyncState,
	): Promise<'created' | 'updated' | 'skipped'> {
		const articleKey = String(article.id);
		let pathToUse = syncState.syncedPosts[articleKey] || buildArticlePath(
			settings.targetFolder,
			article.source_name,
			article.title,
			article.post_time,
			settings.folderBySource,
		);

		let file = this.app.vault.getAbstractFileByPath(pathToUse);
		if (!file && syncState.syncedPosts[articleKey]) {
			delete syncState.syncedPosts[articleKey];
			pathToUse = buildArticlePath(
				settings.targetFolder,
				article.source_name,
				article.title,
				article.post_time,
				settings.folderBySource,
			);
			file = this.app.vault.getAbstractFileByPath(pathToUse);
		}

		if (file instanceof TFile && settings.onConflict === 'skip') {
			syncState.syncedPosts[articleKey] = file.path;
			return 'skipped';
		}

		const content = articleToMarkdown(article, settings, Date.now());
		const normalizedFolder = pathToUse.substring(0, pathToUse.lastIndexOf('/'));

		if (normalizedFolder) {
			await this.ensureFolder(normalizedFolder);
		}

		if (file instanceof TFile) {
			await this.app.vault.modify(file, content);
			syncState.syncedPosts[articleKey] = file.path;
			return 'updated';
		}

		const created = await this.app.vault.create(pathToUse, content);
		syncState.syncedPosts[articleKey] = created.path;
		return 'created';
	}

	private pruneMissingFiles(syncState: SyncState): number {
		let removed = 0;

		for (const [articleId, filePath] of Object.entries(syncState.syncedPosts)) {
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (!file) {
				delete syncState.syncedPosts[articleId];
				removed++;
			}
		}

		return removed;
	}

	private async ensureFolder(folderPath: string): Promise<void> {
		const parts = folderPath.split('/').filter(Boolean);
		let current = '';

		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			const existing = this.app.vault.getAbstractFileByPath(current);
			if (!existing) {
				await this.app.vault.adapter.mkdir(current);
			}
		}
	}
}
