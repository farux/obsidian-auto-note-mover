import AutoNoteMover from 'main';
import { App, Notice, PluginSettingTab, Setting, ButtonComponent } from 'obsidian';

import { FolderSuggest } from 'suggests/file-suggest';
import { TagSuggest } from 'suggests/tag-suggest';
import { arrayMove } from 'utils/Utils';

export interface FolderTagPattern {
	folder: string;
	tag: string;
	pattern: string;
}

export interface AutoNoteMoverSettings {
	trigger_auto_manual: string;
	enable_auto_note_mover: boolean;
	folder_tag_pattern: Array<FolderTagPattern>;
}

export const DEFAULT_SETTINGS: AutoNoteMoverSettings = {
	trigger_auto_manual: 'Automatic',
	enable_auto_note_mover: true,
	folder_tag_pattern: [{ folder: '', tag: '', pattern: '' }],
};

export class AutoNoteMoverSettingTab extends PluginSettingTab {
	plugin: AutoNoteMover;

	constructor(app: App, plugin: AutoNoteMover) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		this.containerEl.empty();
		this.add_auto_note_mover_setting();
	}

	add_auto_note_mover_setting(): void {
		this.containerEl.createEl('h2', { text: 'Auto Note Mover' });

		const descEl = document.createDocumentFragment();

		new Setting(this.containerEl).setDesc(
			'Auto Note Mover will automatically move the active notes to their respective folders according to the rules.'
		);

		new Setting(this.containerEl)
			.setName('Auto Note Mover')
			.setDesc('Enable or disable the Auto Note Mover.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enable_auto_note_mover)
					.onChange(async (use_new_auto_note_mover) => {
						this.plugin.settings.enable_auto_note_mover = use_new_auto_note_mover;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		if (!this.plugin.settings.enable_auto_note_mover) {
			return;
		}

		const triggerDesc = document.createDocumentFragment();
		triggerDesc.append(
			'Choose how the trigger will be activated.',
			descEl.createEl('br'),
			descEl.createEl('strong', { text: 'Automatic ' }),
			'is triggered when you create, edit, or rename a note, and moves the note if it matches the rules.',
			descEl.createEl('br'),
			'You can also activate the trigger with a command.',
			descEl.createEl('br'),
			descEl.createEl('strong', { text: 'Manual ' }),
			'will not automatically move notes.',
			descEl.createEl('br'),
			'You can trigger by command.'
		);
		new Setting(this.containerEl)
			.setName('Trigger')
			.setDesc(triggerDesc)
			.addDropdown((dropDown) =>
				dropDown
					.addOption('Automatic', 'Automatic')
					.addOption('Manual', 'Manual')
					.setValue(this.plugin.settings.trigger_auto_manual)
					.onChange((value: string) => {
						this.plugin.settings.trigger_auto_manual = value;
						this.plugin.saveData(this.plugin.settings);
						this.display();
					})
			);

		const ruleDesc = document.createDocumentFragment();
		ruleDesc.append(
			'1. Set the destination folder.',
			descEl.createEl('br'),
			'2. Set a tag or title that matches the note you want to move. ',
			descEl.createEl('strong', { text: 'You can set either the tag or the title. ' }),
			descEl.createEl('br'),
			'3. The rules are checked in order from the top. The notes will be moved to the folder with the ',
			descEl.createEl('strong', { text: 'first matching rule.' }),
			descEl.createEl('br'),
			'Tag: Be sure to add a',
			descEl.createEl('strong', { text: ' # ' }),
			'at the beginning.',
			descEl.createEl('br'),
			'Title: Tested by JavaScript regular expressions.',
			descEl.createEl('br'),
			descEl.createEl('br'),
			'Notice:',
			descEl.createEl('br'),
			'1. Attached files will not be moved, but they will still appear in the note.',
			descEl.createEl('br'),
			'2. Auto Note Mover will not move notes that have "',
			descEl.createEl('strong', { text: 'AutoNoteMover: disable' }),
			'" in the frontmatter.'
		);
		new Setting(this.containerEl)

			.setName('Add new rule')
			.setDesc(ruleDesc)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add new rule')
					.setButtonText('+')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.folder_tag_pattern.push({
							folder: '',
							tag: '',
							pattern: '',
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.folder_tag_pattern.forEach((folder_tag_pattern, index) => {
			const settings = this.plugin.settings.folder_tag_pattern;
			const settingTag = settings.map((e) => e['tag']);
			const settingPattern = settings.map((e) => e['pattern']);
			const checkArr = (arr: string[], val: string) => {
				return arr.some((arrVal) => val === arrVal);
			};

			const s = new Setting(this.containerEl)
				.addSearch((cb) => {
					new FolderSuggest(this.app, cb.inputEl);
					cb.setPlaceholder('Folder')
						.setValue(folder_tag_pattern.folder)
						.onChange(async (newFolder) => {
							this.plugin.settings.folder_tag_pattern[index].folder = newFolder;
							await this.plugin.saveSettings();
						});
				})

				.addSearch((cb) => {
					new TagSuggest(this.app, cb.inputEl);
					cb.setPlaceholder('Tag')
						.setValue(folder_tag_pattern.tag)
						.onChange(async (newTag) => {
							if (this.plugin.settings.folder_tag_pattern[index].pattern) {
								this.display();
								return new Notice(`You can set either the tag or the title.`);
							}
							if (newTag && checkArr(settingTag, newTag)) {
								new Notice('This tag is already used.');
								return;
							}

							this.plugin.settings.folder_tag_pattern[index].tag = newTag;
							await this.plugin.saveSettings();
						});
				})

				.addSearch((cb) => {
					cb.setPlaceholder('Title by regex')
						.setValue(folder_tag_pattern.pattern)
						.onChange(async (newPattern) => {
							if (this.plugin.settings.folder_tag_pattern[index].tag) {
								this.display();
								return new Notice(`You can set either the tag or the title.`);
							}

							if (newPattern && checkArr(settingPattern, newPattern)) {
								new Notice('This pattern is already used.');
								return;
							}

							this.plugin.settings.folder_tag_pattern[index].pattern = newPattern;
							await this.plugin.saveSettings();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('up-chevron-glyph')
						.setTooltip('Move up')
						.onClick(async () => {
							arrayMove(this.plugin.settings.folder_tag_pattern, index, index - 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('down-chevron-glyph')
						.setTooltip('Move down')
						.onClick(async () => {
							arrayMove(this.plugin.settings.folder_tag_pattern, index, index + 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('cross')
						.setTooltip('Delete')
						.onClick(async () => {
							this.plugin.settings.folder_tag_pattern.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});
			s.infoEl.remove();
		});
	}
}
