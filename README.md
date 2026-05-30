# Yueling Sync

Sync articles from [YuelingHub](https://yuelinghub.com) (WeChat article reader) into your vault as Markdown notes.

## Features

- Pull articles from the YuelingHub API and save them as Markdown files
- Sync scopes: all followed sources, collected only, or by group
- Incremental sync based on `post_time`
- Full article body (HTML to Markdown) with YAML frontmatter metadata
- Manual sync, scheduled sync, and conflict handling (skip or overwrite)
- Status bar shortcut to open plugin settings

## Privacy and network

This plugin connects to your configured YuelingHub API (default: `https://yuelinghub.com`) to download your subscribed articles.

- Your token is stored locally in the plugin data for this vault only
- No vault content is collected or uploaded elsewhere
- Images in article bodies remain as remote URLs (not downloaded locally)

## Installation

### From GitHub Releases

1. Download `main.js`, `manifest.json`, and `styles.css` from [Releases](https://github.com/huizhou-fack/yuelinghub-sync/releases)
2. Copy them to `<Vault>/.obsidian/plugins/yuelinghub-sync/`
3. Enable **Settings → Community plugins → Yueling Sync**

### Manual build

```bash
npm install
npm run dev    # watch mode
npm run build  # production build
```

## Configuration

1. Obtain a user token from the YuelingHub mini program or web admin (`POST /api/wx/get_token`)
2. Open **Settings → Community plugins → Yueling Sync**
3. Enter the API base URL and token
4. Click **Verify and refresh** to load groups
5. Choose sync mode and target folder
6. Run **Sync articles now** from the command palette, or click the download icon in the ribbon

## Output format

```
Yueling/{source name}/{YYYY-MM-DD} {title}.md
```

Frontmatter fields include `yueling_id`, `title`, `source`, `url`, `published`, `summary`, `groups`, and `tags`.

## Commands

| Command | Description |
|---------|-------------|
| Sync articles now | Trigger a manual sync |
| Reset sync state | Clear incremental state and re-fetch on next run |
| Open sync folder | Open the most recently synced note |
| Open sync settings | Open the plugin settings tab |

The status bar shows sync progress. Click **Settings** to open the plugin settings quickly (desktop).

## Backend API

This plugin uses dedicated endpoints on the YuelingHub backend:

- `POST /api/plugin/obsidian/authorize`
- `POST /api/plugin/obsidian/meta`
- `POST /api/plugin/obsidian/articles`

## Updating the plugin

Download the latest release assets and replace the files in:

```
<Vault>/.obsidian/plugins/yuelinghub-sync/
```

Disable and re-enable the plugin in **Settings → Community plugins**, or restart the app.

## Development

See the [plugin development workflow](https://docs.obsidian.md/Plugins/Getting+started/Development+workflow).

After editing source code, run `npm run dev` and reload the plugin, or use [Hot-Reload](https://github.com/pjeby/hot-reload).

## Releasing (maintainers)

This project uses [GitHub Actions](https://docs.github.com/en/actions) to build and create releases. See the [Obsidian release guide](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions).

### Prerequisites

1. Set **Settings → Actions → General → Workflow permissions** to **Read and write permissions**
2. Configure GitHub authentication locally (SSH or personal access token)

### Steps

```bash
npm version patch
git push origin master
git push origin 1.0.3
```

Pushing a tag triggers the workflow to build and upload `main.js`, `manifest.json`, and `styles.css` as a draft release. Edit the release notes and publish when ready.

Tag names must match `manifest.json` version exactly (no `v` prefix).

## Changelog

### 1.0.2

- Rename plugin display name to **Yueling Sync**
- Fix group sync fetching all followed sources
- Fix YAML frontmatter broken by multiline or special characters in `summary`
- Re-sync deleted local notes automatically
- Add `groups` field to frontmatter
- Remove tag-based sync mode
- Add status bar settings shortcut and **Open sync settings** command

### 1.0.1

- Initial release
- Sync all followed, collected, or grouped articles
- HTML to Markdown conversion with frontmatter summary
- Incremental sync, scheduled sync, skip/overwrite conflict policy
