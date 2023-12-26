// 建立类型映射，用于优化类型判断
export const excludedTypes: Record<string, boolean> = {
  ImportDeclaration: true,
  NamespaceExportDeclaration: true,
  /**
   * 当直接导出 匿名组件时 会出现这个类型
   */
  // ExportAssignment: true,
  ImportEqualsDeclaration: true,
  DebuggerStatement: true,
  EmptyStatement: true,
  LabeledStatement: true,
  BreakStatement: true,
  ContinueStatement: true,
  ClassDeclaration: true,
  ModuleDeclaration: true,
  TypeAliasDeclaration: true,
  InterfaceDeclaration: true,
  EnumDeclaration: true,
  NonNullExpression: true,
  SatisfiesExpression: true,
  MetaProperty: true,
  ClassExpression: true
};

/**
 * default locales directory
 * 默认的国际化文件夹
 * @type {[string,string]}
 */
export const DEFAULT_LOCALES_DIR = ["i18n", "locales"] as const;
/**
 * default backup directory
 * 默认的备份文件夹
 * @type {[string,string]}
 */
export const DEFAULT_BACKUP_DIR = ['i18n', 'backup'] as const;
/**
 * extension of target files
 * 需要解析的文件后缀
 */
export const ALLOWED_EXTENSIONS = ['ts', 'tsx'];

/**
 * batch size
 * gpt翻译时内容的数量
 */
export const BATCH_SIZE = 70;
/**
 * default language
 * 默认的语言
 */
export const DEFAULT_LANGUAGE = 'zh-cn';

/**
 * default encoding
 * 默认的编码
 */
export const DEFAULT_ENCODING = 'utf-8' as const;


export enum INNER_LANGUAGE {
  ZH_CN = 'zh-cn',
  EN_US = 'en-us',
  ID_ID = 'id-id',
}

export const INNER_LANGUAGE_MAPPING = {
  [INNER_LANGUAGE.ZH_CN]: 'Chinese',
  [INNER_LANGUAGE.EN_US]: 'English',
  [INNER_LANGUAGE.ID_ID]: 'Indonesia',
};