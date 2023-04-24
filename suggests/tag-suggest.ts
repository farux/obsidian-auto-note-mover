import { App, Plugin, TFile, getAllTags, CachedMetadata, PluginManifest } from 'obsidian';

import { TextInputSuggest } from './suggest';

export class GetAllTagsInTheVault extends Plugin {
	fileArray: TFile[];
	fileCache: CachedMetadata[];
	tagArray: string[][];
	tagArrayJoin: string;
	tagArraySplit: string[];
	tagArrayFilter: string[];
	tagList: string[];

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.fileArray = this.app.vault.getMarkdownFiles();
		this.fileCache = this.fileArray.map((value) => this.app.metadataCache.getFileCache(value));
		this.tagArray = this.fileCache.map((value) => getAllTags(value));
		this.tagArrayJoin = this.tagArray.join();
		this.tagArraySplit = this.tagArrayJoin.split(',');
		this.tagArrayFilter = this.tagArraySplit.filter(Boolean);
		this.tagList = [...new Set(this.tagArrayFilter)];
	}

	pull(): string[] {
		return this.tagList;
	}
}

export class TagSuggest extends TextInputSuggest<string> {
	manifest: PluginManifest;

	getSuggestions(inputStr: string): string[] {
		const tagList = new GetAllTagsInTheVault(this.app, this.manifest);
		const tagMatch: string[] = [];
		const previousTags = this.splitTags(inputStr);
		const lowerCaseInputStr = previousTags[previousTags.length - 1]

		tagList.pull().forEach((Tag: string) => {
			if (Tag.toLowerCase().contains(lowerCaseInputStr)) {
				tagMatch.push(Tag);
			}
		});

		return tagMatch;
	}

	private splitTags(inputStr: string): string[] {
		return inputStr.split(',').map(tag => tag.trim().toLowerCase());
	}

	renderSuggestion(Tag: string, el: HTMLElement): void {
		el.setText(Tag);
	}

	selectSuggestion(Tag: string): void {
		const previousTags = this.splitTags(this.inputEl.value).slice(0, -1);
		previousTags.push(Tag)
		this.inputEl.value = previousTags.toString();
		this.inputEl.trigger('input');
		this.close();
	}
}
