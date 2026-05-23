import { YuelingArticle } from '../types';

function normalizeText(value: string): string {
	return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function escapeYamlInlineString(value: string): string {
	const normalized = normalizeText(value);
	const needsQuote = /[:#[\]{}&*!|>'"%@`\n\t]|^\s|\s$|^[-?]|,\s/.test(normalized);

	if (!needsQuote) {
		return normalized;
	}

	return `"${normalized
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t')}"`;
}

function formatYamlScalar(value: string): string {
	const normalized = normalizeText(value).trim();
	if (!normalized) {
		return '""';
	}

	if (normalized.includes('\n')) {
		const block = normalized
			.split('\n')
			.map((line) => `  ${line}`)
			.join('\n');
		return `|\n${block}`;
	}

	return escapeYamlInlineString(normalized);
}

function formatYamlArray(values: string[]): string {
	const items = values.map((value) => escapeYamlInlineString(value));
	return `[${items.join(', ')}]`;
}

function formatIsoTimestamp(timestamp: number): string {
	return new Date(timestamp * 1000).toISOString();
}

function getSummaryText(article: YuelingArticle): string {
	// content_sim is markdown and may contain headings/lists that break YAML properties.
	return (article.summary || article.digest || '').trim();
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
	lines.push(`title: ${formatYamlScalar(article.title)}`);
	lines.push(`source: ${formatYamlScalar(article.source_name || 'unknown')}`);
	lines.push(`url: ${formatYamlScalar(article.url)}`);
	lines.push(`published: ${formatIsoTimestamp(article.post_time)}`);
	lines.push(`synced: ${new Date(options.syncedAt).toISOString()}`);

	const summary = getSummaryText(article);
	if (summary) {
		lines.push(`summary: ${formatYamlScalar(summary)}`);
	}

	if (article.tags.length > 0) {
		lines.push(`tags: ${formatYamlArray(article.tags)}`);
	}

	if (article.groups.length > 0) {
		lines.push(`groups: ${formatYamlArray(article.groups)}`);
	}

	if (options.includeCover && article.cover_url) {
		lines.push(`cover: ${formatYamlScalar(article.cover_url)}`);
	}

	if (article.word_num) {
		lines.push(`word_count: ${article.word_num}`);
	}

	lines.push('---');
	return lines.join('\n');
}
