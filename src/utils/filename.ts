const INVALID_CHARS = /[\\/:*?"<>|]/g;

export function sanitizeFilename(name: string, maxLength = 80): string {
	const sanitized = name
		.replace(INVALID_CHARS, '')
		.replace(/\s+/g, ' ')
		.trim();

	if (!sanitized) {
		return 'untitled';
	}

	if (sanitized.length <= maxLength) {
		return sanitized;
	}

	return sanitized.slice(0, maxLength).trim();
}

export function formatDateFromTimestamp(timestamp: number): string {
	const date = new Date(timestamp * 1000);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function buildArticlePath(
	targetFolder: string,
	sourceName: string,
	title: string,
	postTime: number,
	folderBySource: boolean,
): string {
	const datePrefix = formatDateFromTimestamp(postTime);
	const safeTitle = sanitizeFilename(title);
	const safeSource = sanitizeFilename(sourceName || 'unknown');

	if (folderBySource) {
		return `${targetFolder}/${safeSource}/${datePrefix} ${safeTitle}.md`;
	}

	return `${targetFolder}/${datePrefix} ${safeTitle}.md`;
}
