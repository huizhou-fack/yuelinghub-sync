import { YuelingSyncSettings } from '../settings';

export function validateSyncSettings(settings: YuelingSyncSettings): void {
	if (settings.syncMode === 'group' && settings.groupId <= 0) {
		throw new Error('请先在设置中选择要同步的分组（需先验证 token 加载分组列表）');
	}
}

export function resolveDefaultGroupId(
	settings: YuelingSyncSettings,
	groups: Array<{ id: number }>,
): number {
	if (settings.groupId > 0) {
		return settings.groupId;
	}

	return groups[0]?.id ?? 0;
}
