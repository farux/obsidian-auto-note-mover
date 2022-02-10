import { MarkdownView, Plugin, TFile, getAllTags, Notice, TAbstractFile } from 'obsidian';
import { DEFAULT_SETTINGS, AutoNoteMoverSettings, AutoNoteMoverSettingTab } from 'settings/settings';
import { fileMove, isFmDisable } from 'utils/Utils';

export default class AutoNoteMover extends Plugin {
	settings: AutoNoteMoverSettings;

	async onload() {
		await this.loadSettings();
		const folderTagPattern = this.settings.folder_tag_pattern;

		const fileCheck = (file: TAbstractFile, oldPath?: string, caller?: string) => {
			if (this.settings.trigger_auto_manual !== 'Automatic' && caller !== 'cmd') {
				return;
			}
			if (!(file instanceof TFile)) return;

			const fileSet: Set<TFile> = new Set();
			fileSet.add(file);
			for (let item of fileSet) {
				// The rename event with no basename change will be terminated.
				if (oldPath && oldPath.split('/').pop() === item.basename + '.' + item.extension) {
					return;
				}
			}

			const fileCache = this.app.metadataCache.getFileCache(file);
			// Disable AutoNoteMover when "AutoNoteMover: disable" is present in the frontmatter.
			if (isFmDisable(fileCache)) {
				return;
			}
			const fileName = file.basename;
			const fileFullName = file.basename + '.' + file.extension;
			const settingsLength = folderTagPattern.length;
			const cacheTag = getAllTags(fileCache);
			// checker
			for (let i = 0; i < settingsLength; i++) {
				const settingFolder = folderTagPattern[i].folder;
				const settingTag = folderTagPattern[i].tag;
				const settingPattern = folderTagPattern[i].pattern;
				// Tag check
				if (!settingPattern) {
					if (cacheTag.find((e) => e === settingTag)) {
						fileMove(this.app, settingFolder, fileFullName, file);
						break;
					}
					// Title check
				} else if (!settingTag) {
					const regex = new RegExp(settingPattern);
					const isMatch = regex.test(fileName);
					if (isMatch) {
						fileMove(this.app, settingFolder, fileFullName, file);
						break;
					}
				}
			}
		};

		/* How to get the Setting change event?
		Show trigger indicator on status bar
		const triggerIndicator = this.addStatusBarItem();
		const setIndicator = () => {
			triggerIndicator.setText(getTriggerIndicator(this.settings.trigger_auto_manual));
		};
		setIndicator(); */

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(this.app.vault.on('create', (file) => fileCheck(file)));
			this.registerEvent(this.app.metadataCache.on('changed', (file) => fileCheck(file)));
			this.registerEvent(this.app.vault.on('rename', (file, oldPath) => fileCheck(file, oldPath)));
		});

		const moveNoteCommand = (view: MarkdownView) => {
			if (isFmDisable(this.app.metadataCache.getFileCache(view.file))) {
				new Notice('Auto Note Mover is disabled in the frontmatter.');
				return;
			}
			fileCheck(view.file, undefined, 'cmd');
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

		this.addCommand({
			id: 'Toggle-Auto-Manual',
			name: 'Toggle Auto-Manual',
			callback: () => {
				if (this.settings.trigger_auto_manual === 'Automatic') {
					this.settings.trigger_auto_manual = 'Manual';
					this.saveData(this.settings);
					new Notice('[Auto Note Mover]\nTrigger is Manual.');
				} else if (this.settings.trigger_auto_manual === 'Manual') {
					this.settings.trigger_auto_manual = 'Automatic';
					this.saveData(this.settings);
					new Notice('[Auto Note Mover]\nTrigger is Automatic.');
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
