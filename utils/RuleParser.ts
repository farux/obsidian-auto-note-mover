import { App, CachedMetadata, FrontMatterCache, TFile } from "obsidian";


class FrontmatterDirectoryMapper {
  tokens: string[];
  constructor(private app: App, private frontmatter: FrontMatterCache, private pathSpec: string) {
    this.tokens = this.extractValues(pathSpec)
  }

  buildPath() {
    let result = this.pathSpec;
    this.tokens.forEach(t => {
      const fmv = this.getFirstOrOnlyValue(this.frontmatter[t]);
      if(fmv) { 
        result = result.replace(`<${t}>`, fmv);
      }
    });
    return result;
  }

  private extractValues(input: string): string[] {
    const regex = /<([^>]+)>/g;
    let match;
    const matches = [];
    while ((match = regex.exec(input)) !== null) {
        matches.push(match[1]);
    }
    return matches;
  }

  private getFirstOrOnlyValue(propVal: any) {
    return Array.isArray(propVal) ? propVal[0] : propVal;
  }
}

export default class RuleParser {
  frontMatterDirectorMapper: FrontmatterDirectoryMapper;

  fileCache: CachedMetadata;
  _frontmatter: object;

  get frontmatter(): object {
    if(!this._frontmatter) {
      this._frontmatter = this.fileCache.frontmatter ?? { };
    }
    return this._frontmatter;
  }

  constructor(private app: App, file: TFile,  private rules: any[]) {
    this.fileCache = this.app.metadataCache.getFileCache(file);
  }

  isExcludedByFrontmatter(): boolean {
    return false;
  }

  private ruleThing = {
    
    titleRegex: (): string => { return ""; },
    hasTag: (): string => { return ""; },
    frontmatter: (folderSpec: string): string => {
      return "";
    },
  }
  
  
  check(file: any): string | null {
    
    return null;
  }

}