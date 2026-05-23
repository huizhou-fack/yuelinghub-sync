export type SyncMode = 'all' | 'collected' | 'group' | 'tag';
export type ConflictStrategy = 'skip' | 'overwrite';

export interface YuelingArticle {
	id: number;
	title: string;
	url: string;
	post_time: number;
	source_id: number;
	source_name: string;
	summary: string;
	digest: string;
	cover_url: string;
	word_num: number;
	type: number;
	tags: string[];
	is_collect: boolean;
	content_raw: string;
	content_sim: string;
}

export interface ArticlesResponse {
	articles: YuelingArticle[];
	has_more: boolean;
	next_cursor: number;
}

export interface AuthorizeResponse {
	user_id: number;
	uid: string;
	nickname: string;
}

export interface MetaGroup {
	id: number;
	name: string;
}

export interface MetaTag {
	id: number;
	name: string;
	source_id: number;
}

export interface MetaResponse {
	groups: MetaGroup[];
	tags: MetaTag[];
}

export interface ApiResponse<T> {
	code: number;
	msg: string;
	data: T;
}

export interface SyncState {
	lastSyncTime: number;
	syncedPosts: Record<string, string>;
}

export interface SyncResult {
	created: number;
	updated: number;
	skipped: number;
	failed: number;
	errors: string[];
}

export const DEFAULT_SYNC_STATE: SyncState = {
	lastSyncTime: 0,
	syncedPosts: {},
};
