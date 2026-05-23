import { YuelingArticle } from '../types';
import { YuelingSyncSettings } from '../settings';
import { buildFrontmatter } from '../utils/frontmatter';
import { htmlToMarkdown } from '../utils/html-to-markdown';

export function articleToMarkdown(
	article: YuelingArticle,
	settings: YuelingSyncSettings,
	syncedAt: number,
): string {
	const frontmatter = buildFrontmatter(article, {
		includeCover: settings.includeCoverInFrontmatter,
		syncedAt,
	});

	let body = htmlToMarkdown(article.content_raw);
	if (!body) {
		body = article.digest || article.summary || '';
	}

	return `${frontmatter}\n\n${body}`.trim() + '\n';
}
