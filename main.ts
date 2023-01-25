import { App, MarkdownView, Notice, Plugin, TAbstractFile, TFile, debounce, getAllTags, normalizePath } from 'obsidian';
import { AutoNoteMoverSettingTab, AutoNoteMoverSettings, DEFAULT_SETTINGS } from 'settings/settings';
import { fileMove, findTFile, getTriggerIndicator, isFmDisable } from 'utils/Utils';

export default class AutoNoteMover extends Plugin {
	settings: AutoNoteMoverSettings;

	async onload() {
		await this.loadSettings();
		const folderTagPattern = this.settings.folder_tag_pattern;
		const excludedFolder = this.settings.excluded_folder;

		const fileCheck = (file: TAbstractFile, oldPath?: string, caller?: string) => {
			if (this.settings.trigger_auto_manual !== 'Automatic' && caller !== 'cmd') {
				return;
			}
			if (!(file instanceof TFile)) return;

			// The rename event with no basename change will be terminated.
			if (oldPath && oldPath.split('/').pop() === file.basename + '.' + file.extension) {
				return;
			}

			// Excluded Folder check
			const excludedFolderLength = excludedFolder.length;
			for (let i = 0; i < excludedFolderLength; i++) {
				if (
					!this.settings.use_regex_to_check_for_excluded_folder &&
					excludedFolder[i].folder &&
					file.parent.path === normalizePath(excludedFolder[i].folder)
				) {
					return;
				} else if (this.settings.use_regex_to_check_for_excluded_folder && excludedFolder[i].folder) {
					const regex = new RegExp(excludedFolder[i].folder);
					if (regex.test(file.parent.path)) {
						return;
					}
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
				const template = findTFile(folderTagPattern[i].template_file, this.app);
				// Tag check
				if (!settingPattern) {
					if (this.settings.use_regex_to_check_for_tags) {
						const regex = new RegExp(settingTag);
						const matches = cacheTag.find((e) => regex.test(e));
						if (matches) {
							const match = regex.exec(matches);
							if (match) {
								const newSettingFolder = settingFolder.replace(/\$(\d)/g, (_, i) => match[i]);
								fileMove(this, newSettingFolder, fileFullName, file, template);
								break;
							}
						}
					}
					else {
						if (cacheTag.find((e) => e === settingTag)) {
							fileMove(this, settingFolder, fileFullName, file, template);
							break;
						}
					}  
					// Title check
				} else if (!settingTag) {
					const regex = new RegExp(settingPattern);
					const isMatch = regex.test(fileName);
					if (isMatch) {
						fileMove(this, settingFolder, fileFullName, file, template);
						break;
					}
				}
			}
		};

		// Show trigger indicator on status bar
		let triggerIndicator: HTMLElement;
		const setIndicator = () => {
			if (!this.settings.statusBar_trigger_indicator) return;
			triggerIndicator.setText(getTriggerIndicator(this.settings.trigger_auto_manual));
		};
		if (this.settings.statusBar_trigger_indicator) {
			triggerIndicator = this.addStatusBarItem();
			setIndicator();
			// TODO: Is there a better way?
			this.registerDomEvent(window, 'change', setIndicator);
		}

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(this.app.vault.on('create', (file) => debounce(fileCheck, 100)(file)));
			this.registerEvent(this.app.metadataCache.on('changed', (file) => debounce(fileCheck, 100)(file)));
			this.registerEvent(this.app.vault.on('rename', (file, oldPath) => debounce(fileCheck, 100)(file, oldPath)));
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
				setIndicator();
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
