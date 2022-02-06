import { MarkdownView, Plugin, TFile, getAllTags, debounce, CachedMetadata, Notice } from 'obsidian';
import { DEFAULT_SETTINGS, AutoNoteMoverSettings, AutoNoteMoverSettingTab, FolderTagPattern } from 'settings/settings';
import { fileMove, isFmDisable } from 'utils/Utils';

export default class AutoNoteMover extends Plugin {
	settings: AutoNoteMoverSettings;
	folderTagPattern: FolderTagPattern[];
	fileName: string;
	fileFullName: string;
	fileCache: CachedMetadata;
	settingsLength: number;
	cacheTag: string[];
	settingFolder: string;
	settingTag: string;
	settingPattern: string;
	regex: RegExp;
	isMatch: boolean;

	async onload() {
		await this.loadSettings();
		this.folderTagPattern = this.settings.folder_tag_pattern;

		const fileCheck = debounce(
			async (file: TFile) => {
				if (!this.settings.enable_auto_note_mover) {
					return;
				}
				this.fileCache = this.app.metadataCache.getFileCache(file);
				// Disable AutoNoteMover when "AutoNoteMover: disable" is present in the frontmatter.
				if (await isFmDisable(this.fileCache)) {
					return;
				}
				this.fileName = file.basename;
				this.fileFullName = file.basename + '.' + file.extension;
				this.settingsLength = this.folderTagPattern.length;
				this.cacheTag = getAllTags(this.fileCache);
				// checker
				for (let i = 0; i < this.settingsLength; i++) {
					this.settingFolder = this.folderTagPattern[i].folder;
					this.settingTag = this.folderTagPattern[i].tag;
					this.settingPattern = this.folderTagPattern[i].pattern;
					// Tag check
					if (!this.settingPattern) {
						if (this.cacheTag.find((e) => e === this.settingTag)) {
							fileMove(this.app, this.settingFolder, this.fileFullName, file);
							break;
						}
						// Title check
					} else if (!this.settingTag) {
						this.regex = new RegExp(this.settingPattern);
						this.isMatch = this.regex.test(this.fileName);
						if (this.isMatch) {
							fileMove(this.app, this.settingFolder, this.fileFullName, file);
							break;
						}
					}
				}
			},
			1000,
			true
		);

		const registerCheck = (file: TFile) => {
			if (this.settings.trigger_auto_manual === 'Automatic') {
				fileCheck(file);
			}
		};

		this.registerEvent(
			this.app.vault.on('create', (file: TFile) => {
				registerCheck(file);
			})
		);
		this.registerEvent(
			this.app.metadataCache.on('changed', (file: TFile) => {
				registerCheck(file);
			})
		);
		this.registerEvent(
			this.app.vault.on('rename', (file: TFile) => {
				registerCheck(file);
			})
		);

		const moveNoteCommand = async (view: MarkdownView) => {
			if (!this.settings.enable_auto_note_mover) {
				new Notice('Auto Note Mover is disabled in the settings.');
				return;
			}
			if (await isFmDisable(this.app.metadataCache.getFileCache(view.file))) {
				new Notice('Auto Note Mover is disabled in the frontmatter.');
				return;
			}
			fileCheck(view.file);
		};

		this.addCommand({
			id: 'Move-the-note',
			name: 'Move the note',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						moveNoteCommand(markdownView);
					}
					return true;
				}
			},
		});

		this.addSettingTab(new AutoNoteMoverSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
