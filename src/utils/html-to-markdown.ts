import TurndownService from 'turndown';

let turndownService: TurndownService | null = null;

function getTurndownService(): TurndownService {
	if (!turndownService) {
		turndownService = new TurndownService({
			headingStyle: 'atx',
			codeBlockStyle: 'fenced',
			emDelimiter: '*',
		});
		turndownService.addRule('wechatImages', {
			filter: 'img',
			replacement: (_content: string, node: HTMLElement) => {
				const src = node.getAttribute('data-src')
					|| node.getAttribute('src')
					|| '';
				const alt = node.getAttribute('alt') || '';
				if (!src) {
					return '';
				}
				return `![${alt}](${src})`;
			},
		});
	}
	return turndownService;
}

export function htmlToMarkdown(html: string): string {
	if (!html.trim()) {
		return '';
	}

	const normalized = html
		.replace(/data-src=/g, 'src=')
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?<\/style>/gi, '');

	return getTurndownService().turndown(normalized).trim();
}
