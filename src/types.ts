export type LANGUAGE = 'en-us' | 'zh-cn' | 'id-id' | (string & {});

export type ORIGINAL_TEXT = string;
type TARGET_TEXT = string;

export type TRANSLATE_MAPPING = Record<ORIGINAL_TEXT, TARGET_TEXT>;

export interface Config {
  /**
   * @description
   * 指定项目的根目录，用于开始扫描和处理文件。
   * @example
   * '/path/to/project'
   */
  root: string;

  /**
   * @description
   * 需要过滤（即忽略）的文件或目录列表。
   * 默认从 `root` 目录开始扫描。
   * @example
   * [['node_modules'], ['dist']]
   */
  filter?: string[][];

  /**
   * @description
   * 指定目标目录或文件，通常用于存放生成或处理后的本地化文件。
   * @example
   * ['i18n', 'locales']
   */
  target?: string[];

  /**
   * @description
   * 用于存放备份文件的目录或文件，以防万一。
   * @example
   * ['i18n','backup']
   */
  backup?: string[];

  /**
   * @description
   * 用于初始化一些特定的、多语言的字符串。
   * 这些字符串可能不直接存储在项目中，但最终会被应用所识别和使用。
   * @example
   * {
   *   "en": {
   *     "greeting": "Hello",
   *     "farewell": "Goodbye"
   *   },
   *   "es": {
   *     "greeting": "Hola",
   *     "farewell": "Adiós"
   *   }
   * }
   */
  initializersLocale?: Record<LANGUAGE, TRANSLATE_MAPPING>;
  /**
   * 需要翻译的目标语言
   * @example
   * ["en-use","zh-cn","id-id"]
   */
  languages?: LANGUAGE[];
  /**
   * 是否全量翻译 (不使用已翻译内容的缓存, 对所有待翻译内容重新翻译)
   */
  full?: boolean;
  /**
   * gpt conf
   */
  openai: {
    /**
     * openai gpt api key
     */
    apiKey: string;
    /**
     * proxy
     *
     * @default https://api.openai.com/v1
     *
     * from openai nodejs lib
     */
    base_url?: string;
  };
  /**
   * 只 映射不翻译的语言
   * @default 'zh-cn'
   */
  ignoreLanguage?: string
}
