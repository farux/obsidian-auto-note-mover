export interface Rule {
  pathSpec: string;
  tagMatch?: string; // todo: settings.use_regex_to_check_for_tags
  titleMatchRegex?: RegExp;
}

export interface FileMetadata {
  frontmatter: Record<string, unknown>;
  title: string;
  tags: string[];
}

export class RuleProcessor {
  constructor(private rules: Rule[]) {}

  processFileMetadata(fileMetadata: FileMetadata): string | false {
    for (const rule of this.rules) {
      if (this.ruleMatches(rule, fileMetadata)) {
        const path = this.processPathSpec(rule.pathSpec, fileMetadata.frontmatter);
        if (path !== false) {
          return path;
        }
      }
    }
    return false;
  }

  private ruleMatches(rule: Rule, fileMetadata: FileMetadata): boolean {
    if (!rule.tagMatch && !rule.titleMatchRegex) {
      return true;
    }
    if (rule.tagMatch && rule.titleMatchRegex) {
      return fileMetadata.tags.includes(rule.tagMatch) && rule.titleMatchRegex.test(fileMetadata.title);
    }
    if (rule.tagMatch) {
      return fileMetadata.tags.includes(rule.tagMatch);
    }
    if (rule.titleMatchRegex) {
      return rule.titleMatchRegex.test(fileMetadata.title);
    }
    return false;
  }

  private processPathSpec(pathSpec: string, frontmatter: Record<string, unknown>): string | false {
    const pattern = /<([^>]+)>/g;
    let path = pathSpec;
    let match;
    while ((match = pattern.exec(pathSpec)) !== null) {
      const token = match[1];
      const propVal = frontmatter[token];
      if (propVal !== undefined) {
        const firstValue = Array.isArray(propVal) ? propVal[0] : propVal;
        if (firstValue) {
          path = path.replace(`<${token}>`, String(firstValue));
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    return path;
  }
}