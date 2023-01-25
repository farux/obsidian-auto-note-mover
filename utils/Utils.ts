import { App, CachedMetadata, Notice, TFile, TFolder, normalizePath, parseFrontMatterEntry } from 'obsidian';

import AutoNoteMover from '../main';

// Disable AutoNoteMover when "AutoNoteMover: disable" is present in the frontmatter.
export const isFmDisable = (fileCache: CachedMetadata) => {
	if(!fileCache) return false;
	const fm = parseFrontMatterEntry(fileCache.frontmatter, 'AutoNoteMover');
	if (fm === 'disable') {
		return true;
	} else {
		return false;
	}
};

const folderOrFile = (app: App, path: string) => {
	const F = app.vault.getAbstractFileByPath(path);
	if (F instanceof TFile) {
		return TFile;
	} else if (F instanceof TFolder) {
		return TFolder;
	}
};

const isTFExists = (app: App, path: string, F: typeof TFile | typeof TFolder) => {
	if (folderOrFile(app, normalizePath(path)) === F) {
		return true;
	} else {
		return false;
	}
};


export function findTFile(name: string, app: App): TFile {
	return app.metadataCache.getFirstLinkpathDest(normalizePath(name), "");
}

export function getTemplater(app: App) {
	return app.plugins.plugins["templater-obsidian"]?.templater;
}

export async function writeTemplate(app: App, template: TFile) {
	const templater = getTemplater(app);
	if (templater?.append_template_to_active_file)
		await templater.append_template_to_active_file(template);
}

export const fileMove = async (plugin: AutoNoteMover, settingFolder: string, fileFullName: string, file: TFile, template: TFile) => {
	const { app, settings } = plugin;
	console.log(`Setting Folder: ${settingFolder}`);
	if (!isTFExists(app, settingFolder, TFolder)) {
		if (settings.create_non_existant_folders) {
			console.log(`[Auto Note Mover] Creating folder: ${settingFolder}`);
			await app.vault.createFolder(normalizePath(settingFolder));
		} else {
			console.error(`[Auto Note Mover] The destination folder "${settingFolder}" does not exist.`);
			new Notice(`[Auto Note Mover]\n"Error: The destination folder\n"${settingFolder}"\ndoes not exist.`);
			return;
		}
	}
	// Does the file with the same name exist in the destination folder?
	const newPath = normalizePath(settingFolder + '/' + fileFullName);
	if (isTFExists(app, newPath, TFile) && newPath !== file.path) {
		console.error(
			`[Auto Note Mover] Error: A file with the same name "${fileFullName}" exists at the destination folder.`
		);
		new Notice(
			`[Auto Note Mover]\nError: A file with the same name\n"${fileFullName}"\nexists at the destination folder.`
		);
		return;
	}
	// Is the destination folder the same path as the current folder?
	if (newPath === file.path) {
		return;
	}
	if (template) await writeTemplate(app, template);
	// Move file
	await app.fileManager.renameFile(file, newPath);
	console.log(`[Auto Note Mover] Moved the note "${fileFullName}" to the "${settingFolder}".`);
	new Notice(`[Auto Note Mover]\nMoved the note "${fileFullName}"\nto the "${settingFolder}".`);
};

export const arrayMove = <T>(array: T[], fromIndex: number, toIndex: number): void => {
	if (toIndex < 0 || toIndex === array.length) {
		return;
	}
	const temp = array[fromIndex];
	array[fromIndex] = array[toIndex];
	array[toIndex] = temp;
};

export const getTriggerIndicator = (trigger: string) => {
	if (trigger === 'Automatic') {
		return `[A]`;
	} else {
		return `[M]`;
	}
};
