import { YuelingArticle } from '../types';

function escapeYamlString(value: string): string {
	if (/[:#[\]{}&*!|>'"%@`]|^\s|\s$/.test(value)) {
		return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
	}
	return value;
}

function formatIsoTimestamp(timestamp: number): string {
	return new Date(timestamp * 1000).toISOString();
}

export interface FrontmatterOptions {
	includeCover: boolean;
	syncedAt: number;
}

export function buildFrontmatter(
	article: YuelingArticle,
	options: FrontmatterOptions,
): string {
	const lines: string[] = ['---'];
	lines.push(`yueling_id: ${article.id}`);
	lines.push(`title: ${escapeYamlString(article.title)}`);
	lines.push(`source: ${escapeYamlString(article.source_name || 'unknown')}`);
	lines.push(`url: ${escapeYamlString(article.url)}`);
	lines.push(`published: ${formatIsoTimestamp(article.post_time)}`);
	lines.push(`synced: ${new Date(options.syncedAt).toISOString()}`);

	const summary = article.summary || article.content_sim || article.digest;
	if (summary) {
		lines.push(`summary: ${escapeYamlString(summary)}`);
	}

	if (article.tags.length > 0) {
		const tagList = article.tags.map((tag) => escapeYamlString(tag)).join(', ');
		lines.push(`tags: [${tagList}]`);
	}

	if (options.includeCover && article.cover_url) {
		lines.push(`cover: ${escapeYamlString(article.cover_url)}`);
	}

	if (article.word_num) {
		lines.push(`word_count: ${article.word_num}`);
	}

	lines.push('---');
	return lines.join('\n');
}
