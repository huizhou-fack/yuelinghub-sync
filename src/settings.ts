import { App, PluginSettingTab, Setting } from 'obsidian';
import type YuelingSyncPlugin from './main';
import { MetaGroup, MetaTag, SyncMode } from './types';
import { ApiError, YuelingApiClient } from './api/client';

export interface YuelingSyncSettings {
	apiBaseUrl: string;
	token: string;
	targetFolder: string;
	syncMode: SyncMode;
	groupId: number;
	tagIds: number[];
	folderBySource: boolean;
	autoSyncIntervalMin: number;
	onConflict: 'skip' | 'overwrite';
	includeCoverInFrontmatter: boolean;
}

export const DEFAULT_SETTINGS: YuelingSyncSettings = {
	apiBaseUrl: 'https://yuelinghub.com',
	token: '',
	targetFolder: '阅灵',
	syncMode: 'all',
	groupId: 0,
	tagIds: [],
	folderBySource: true,
	autoSyncIntervalMin: 0,
	onConflict: 'skip',
	includeCoverInFrontmatter: true,
};

export class YuelingSettingTab extends PluginSettingTab {
	plugin: YuelingSyncPlugin;
	private groups: MetaGroup[] = [];
	private tags: MetaTag[] = [];

	constructor(app: App, plugin: YuelingSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('同步设置').setHeading();

		new Setting(containerEl)
			.setName('API 地址')
			.setDesc('阅灵后端 API 根地址')
			.addText((text) => text
				.setPlaceholder('https://yuelinghub.com')
				.setValue(this.plugin.settings.apiBaseUrl)
				.onChange(async (value) => {
					this.plugin.settings.apiBaseUrl = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('用户令牌')
			.setDesc('在小程序或 web 管理端获取的用户 token')
			.addText((text) => text
				.setPlaceholder('输入 token')
				.setValue(this.plugin.settings.token)
				.onChange(async (value) => {
					this.plugin.settings.token = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('验证 token')
			.setDesc('验证 token 并加载分组/标签列表')
			.addButton((button) => button
				.setButtonText('验证并刷新')
				.onClick(async () => {
					await this.loadMeta(button.buttonEl);
				}));

		new Setting(containerEl)
			.setName('目标文件夹')
			.setDesc('文章保存到 vault 中的目录')
			.addText((text) => text
				.setPlaceholder('阅灵')
				.setValue(this.plugin.settings.targetFolder)
				.onChange(async (value) => {
					this.plugin.settings.targetFolder = value.trim() || '阅灵';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('同步模式')
			.setDesc('选择要同步的文章范围')
			.addDropdown((dropdown) => dropdown
				.addOption('all', '全部已关注文章')
				.addOption('collected', '仅收藏')
				.addOption('group', '按分组')
				.addOption('tag', '按标签')
				.setValue(this.plugin.settings.syncMode)
				.onChange(async (value) => {
					this.plugin.settings.syncMode = value as SyncMode;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.syncMode === 'group') {
			const groupSetting = new Setting(containerEl)
				.setName('选择分组')
				.setDesc('同步指定分组下的文章');

			if (this.groups.length === 0) {
				groupSetting.setDesc('请先验证 token 以加载分组列表');
			} else {
				groupSetting.addDropdown((dropdown) => {
					for (const group of this.groups) {
						dropdown.addOption(String(group.id), group.name);
					}
					dropdown.setValue(String(this.plugin.settings.groupId || this.groups[0]?.id || 0));
					dropdown.onChange(async (value) => {
						this.plugin.settings.groupId = Number(value);
						await this.plugin.saveSettings();
					});
				});
			}
		}

		if (this.plugin.settings.syncMode === 'tag') {
			new Setting(containerEl)
				.setName('标签 ID')
				.setDesc('输入要同步的标签 ID，多个用英文逗号分隔')
				.addText((text) => text
					.setPlaceholder('1,2,3')
					.setValue(this.plugin.settings.tagIds.join(','))
					.onChange(async (value) => {
						this.plugin.settings.tagIds = value
							.split(',')
							.map((item) => Number(item.trim()))
							.filter((item) => !Number.isNaN(item) && item > 0);
						await this.plugin.saveSettings();
					}));

			if (this.tags.length > 0) {
				const tagNames = this.tags
					.map((tag) => `${tag.name} (${tag.id})`)
					.join('、');
				containerEl.createEl('p', {
					cls: 'setting-item-description',
					text: `可用标签：${tagNames}`,
				});
			}
		}

		new Setting(containerEl)
			.setName('按来源分子目录')
			.setDesc('在目标文件夹下按公众号名称创建子目录')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.folderBySource)
				.onChange(async (value) => {
					this.plugin.settings.folderBySource = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('冲突策略')
			.setDesc('同一文章已存在时的处理方式')
			.addDropdown((dropdown) => dropdown
				.addOption('skip', '跳过')
				.addOption('overwrite', '覆盖')
				.setValue(this.plugin.settings.onConflict)
				.onChange(async (value) => {
					this.plugin.settings.onConflict = value as 'skip' | 'overwrite';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Frontmatter 包含封面')
			.setDesc('在 YAML 头部写入 cover 字段')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.includeCoverInFrontmatter)
				.onChange(async (value) => {
					this.plugin.settings.includeCoverInFrontmatter = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('自动同步间隔（分钟）')
			.setDesc('0 表示关闭自动同步')
			.addText((text) => text
				.setPlaceholder('0')
				.setValue(String(this.plugin.settings.autoSyncIntervalMin))
				.onChange(async (value) => {
					const parsed = Number(value);
					this.plugin.settings.autoSyncIntervalMin = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
					await this.plugin.saveSettings();
					this.plugin.resetAutoSyncInterval();
				}));

		containerEl.createEl('p', {
			cls: 'setting-item-description',
			text: '本插件会访问阅灵 API 拉取你的订阅文章，token 仅保存在本地 vault 中。',
		});
	}

	private async loadMeta(buttonEl: HTMLButtonElement): Promise<void> {
		const token = this.plugin.settings.token.trim();
		if (!token) {
			this.plugin.showNotice('请先填写 token');
			return;
		}

		buttonEl.disabled = true;
		buttonEl.setText('验证中…');

		try {
			const client = new YuelingApiClient(this.plugin.settings.apiBaseUrl);
			const auth = await client.authorize(token);
			const meta = await client.fetchMeta(token);
			this.groups = meta.groups;
			this.tags = meta.tags;
			this.plugin.showNotice(`验证成功：${auth.nickname || auth.uid}`);
			this.display();
		} catch (error: unknown) {
			const message = error instanceof ApiError ? error.message : String(error);
			this.plugin.showNotice(`验证失败：${message}`);
		} finally {
			buttonEl.disabled = false;
			buttonEl.setText('验证并刷新');
		}
	}
}
