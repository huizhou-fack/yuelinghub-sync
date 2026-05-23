import { requestUrl, RequestUrlResponse } from 'obsidian';
import {
	ApiResponse,
	ArticlesResponse,
	AuthorizeResponse,
	MetaResponse,
	SyncMode,
} from '../types';

export class ApiError extends Error {
	code: number;

	constructor(code: number, message: string) {
		super(message);
		this.code = code;
	}
}

export class YuelingApiClient {
	constructor(private baseUrl: string) {}

	private normalizeBaseUrl(): string {
		return this.baseUrl.replace(/\/+$/, '');
	}

	private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
		const url = `${this.normalizeBaseUrl()}${path}`;
		let response: RequestUrlResponse;

		try {
			response = await requestUrl({
				url,
				method: 'POST',
				contentType: 'application/json',
				body: JSON.stringify(body),
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new ApiError(0, `网络请求失败: ${message}`);
		}

		let payload: ApiResponse<T>;
		try {
			payload = response.json as ApiResponse<T>;
		} catch {
			throw new ApiError(response.status, `响应解析失败 (HTTP ${response.status})`);
		}

		if (payload.code !== 200) {
			throw new ApiError(payload.code, payload.msg || '请求失败');
		}

		return payload.data;
	}

	async authorize(token: string): Promise<AuthorizeResponse> {
		return this.post<AuthorizeResponse>('/api/plugin/obsidian/authorize', { token });
	}

	async fetchMeta(token: string): Promise<MetaResponse> {
		return this.post<MetaResponse>('/api/plugin/obsidian/meta', { token });
	}

	async fetchArticles(params: {
		token: string;
		mode: SyncMode;
		groupId: number;
		since: number;
		cursor: number;
		limit?: number;
	}): Promise<ArticlesResponse> {
		return this.post<ArticlesResponse>('/api/plugin/obsidian/articles', {
			token: params.token,
			mode: params.mode,
			group_id: params.groupId,
			since: params.since,
			cursor: params.cursor,
			limit: params.limit ?? 30,
		});
	}
}
