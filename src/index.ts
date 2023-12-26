import { existsSync } from 'fs';
import { access, readFile, readdir, stat, writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import Collector from './collect';
import parser from './core';
import { collectFilesOnly, getTimeStamp } from './helper';
import {
  ALLOWED_EXTENSIONS,
  BATCH_SIZE,
  DEFAULT_BACKUP_DIR,
  DEFAULT_ENCODING,
  DEFAULT_LANGUAGE,
  DEFAULT_LOCALES_DIR,
  INNER_LANGUAGE,
  INNER_LANGUAGE_MAPPING,
} from './constant';
import logger from './logs';
import Content from './content';
import Translator from './gpt';
import type { Config, LANGUAGE, ORIGINAL_TEXT, TRANSLATE_MAPPING } from './types';

const execTranslateAction = (openai: Config['openai']) => {
  const translator = new Translator(openai);
  return async (
    names: LANGUAGE[],
    texts: string[],
    record: Map<LANGUAGE, TRANSLATE_MAPPING>,
  ) => {
    logger.log('current content translate start...');
    logger.log(`content:"""\n${texts.join('\n')}"""\n\r`);
    const translations = await Promise.allSettled(
      names.map((i) =>
        translator.translation(INNER_LANGUAGE_MAPPING[i as INNER_LANGUAGE], texts),
      ),
    );

    const canRecord = translations.every((i) => i.status === 'fulfilled');

    if (canRecord) {
      names.forEach((name, index) => {
        const trans = translations[index];
        const json = record.get(name);
        if (trans.status === 'fulfilled') {
          if (json) {
            Object.assign(json, trans.value);
          } else {
            record.set(name, trans.value);
          }
        }
      });
    }
    logger.log('current content translate end');
  };
};

const recursive = async (path: string, filters: Set<string>, collector: Collector) => {
  logger.log(`current path: ${path}`);
  try {
    const stats = await stat(path);
    if (stats.isDirectory()) {
      // 如果是目录并且没有被过滤掉，则继续递归
      if (!filters.has(path)) {
        const dirs = await readdir(path);
        await Promise.all(
          dirs.map((dir) => recursive(join(path, dir), filters, collector)),
        );
      } else {
        logger.warn(`current path: ${path} will be ignored`);
      }
    } else if (stats.isFile()) {
      const ext = extname(path).substring(1);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        await parser(path, collector);
      }
    }
  } catch (error) {
    logger.warn(`recursive error: ${error}`);
  }
};

const travesAll = async (config: string) => {
  try {
    await access(config);
  } catch (e) {
    console.log('i18n assist config not exist, will be exist');
    process.exit();
  }
  try {
    const res = await readFile(config, DEFAULT_ENCODING);
    const configJson = JSON.parse(res) as Config;

    logger.group('i18n assist current config info');
    logger.log(`current config's root: ${configJson.root}`);
    const collector = new Collector();
    const filters = new Set<string>();
    if (
      configJson.filter &&
      Array.isArray(configJson.filter) &&
      configJson.filter.length > 0
    ) {
      configJson.filter.forEach((path) => filters.add(join(configJson.root, ...path)));
      logger.log(`current config's filter: ${filters}`);
    }
    await recursive(configJson.root, filters, collector);
    logger.log(`Number of all texts to be translated: ${collector.values().length}`);
    /**
     * destination directory
     */
    const destDir = join(configJson.root, ...(configJson.target || DEFAULT_LOCALES_DIR));
    const translateStat = existsSync(destDir);
    // 判断 translateStat 是否存在 && 是否是文件夹
    if (!translateStat) {
      logger.log('translate folder not exist, will be created');
      await mkdir(destDir, {
        recursive: true,
      });
    }
    const filter = new Set<string>();
    /**
     * i18n locale files
     */
    const files = await collectFilesOnly(destDir);
    logger.log(`Number of all locale files: ${files.toString()}`);
    /**
     * backup directory
     */
    const bakDir = join(configJson.root, ...(configJson.backup || DEFAULT_BACKUP_DIR));
    const bakStat = existsSync(bakDir);
    // 判断 translateStat 是否存在 && 是否是文件夹
    if (!bakStat) {
      logger.log('backup folder not exist, will be created');
      await mkdir(bakDir);
    }
    /**
     * final translation record
     */
    const record = new Map<LANGUAGE, TRANSLATE_MAPPING>();
    /**
     * latest translation cache
     */
    const cache = new Map<LANGUAGE, TRANSLATE_MAPPING>();
    const date = getTimeStamp();
    const names: LANGUAGE[] = [];
    await Promise.all(
      files.map(async (file) => {
        const name = file.replace('.json', '') as LANGUAGE;
        const data = await readFile(join(destDir, file), DEFAULT_ENCODING);
        const oldJson = JSON.parse(data) as TRANSLATE_MAPPING;
        // 增加 ignore cache flag
        // 满足用户希望全量不走缓存的翻译的需求
        if (!configJson.full) {
          (Object.keys(oldJson) as ORIGINAL_TEXT[]).forEach((key) => {
            filter.add(oldJson[key]);
          });
          cache.set(name, oldJson);
        }
        record.set(name, {});
        if (!names.includes(name)) {
          names.push(name);
        }
      }),
    );
    if (names.length === 0) {
      const initializeLanguage =
        Array.isArray(configJson.languages) && configJson.languages.length
          ? configJson.languages
          : [INNER_LANGUAGE.ZH_CN, INNER_LANGUAGE.EN_US, INNER_LANGUAGE.ID_ID];

      initializeLanguage.forEach((name) => {
        record.set(name, {});
        cache.set(name, {});
        names.push(name);
      });
    }
    // 开始翻译 并记录至 record
    /**
     * The main purpose of this code block is to initialize or update multilingual string mappings.
     * 本代码段的主要目的是初始化或更新多语言的字符串映射。
     *
     * It uses the content from the `initializersLocale` field of the config object to overwrite or extend the existing `record` Map.
     * 使用来自配置对象的 `initializersLocale` 字段的内容来覆盖或扩展已存在的 `record` Map。
     */
    // Destructure `initializersLocale` from the configJson object
    // 从配置对象 configJson 中解构出 `initializersLocale`
    const { initializersLocale } = configJson;
    // Check if `initializersLocale` exists and has content
    // 检查 `initializersLocale` 是否存在并且是否有内容
    if (initializersLocale && Object.keys(initializersLocale).length > 0) {
      // Loop through all language codes in `initializersLocale` (e.g., "en", "es", etc.)
      // 遍历 `initializersLocale` 中的所有语言代码（如 "en", "es" 等）
      Object.keys(initializersLocale).forEach((name) => {
        // Get the string mapping corresponding to the current language code (e.g., {"greeting": "Hello"})
        // 获取当前语言代码对应的字符串映射（如 {"greeting": "Hello"}）
        const json = initializersLocale[name];
        // Get the string mapping for the current language code from the existing `record` Map
        // 从已存在的 `record` Map 中获取当前语言代码的字符串映射
        const ref = record.get(name) as TRANSLATE_MAPPING;
        // Use the data in `initializersLocale` to update or initialize the string mapping in `record`
        // 使用 `initializersLocale` 的数据更新或初始化 `record` 中的字符串映射
        // If there are duplicate keys, the values in `initializersLocale` will overwrite those in `record`
        // 如果有重复的键，`initializersLocale` 中的值将覆盖 `record` 中的值
        record.set(name, {
          ...json,
          ...ref,
        });
      });
    }

    const content = new Content();
    let changed = false;
    const translator = execTranslateAction(configJson.openai);
    try {
      for await (const text of collector.values()) {
        for (const name of names) {
          const ref = record.get(name) as TRANSLATE_MAPPING;
          const cacheRef = cache.get(name) as TRANSLATE_MAPPING;
          // zh-cn will record all texts
          if (name.toLocaleLowerCase() === DEFAULT_LANGUAGE) {
            ref[text] = text;
          } else {
            if (!configJson.full) {
              // other locale will record last translation
              // the other translation will be generated by chat gpt
              const last = cacheRef[text];
              if (last) {
                ref[text] = last;
              }
            }
          }
        }
        if (!filter.has(text)) {
          changed = true;
          content.push(text);
          if (content.size === BATCH_SIZE) {
            await translator(names, content.getContent(), record);
            content.clear();
          }
        }
      }
      // Process the last unprocessed content
      if (content.size > 0) {
        await translator(names, content.getContent(), record);
        content.clear();
      }
      
      await Promise.all(
        [...record.entries()].map(async ([name, json]) => {
          const file = `${name}.json`;
          // 当存在变动时 && 文件存在时 才需要备份
          const target_file_path = join(destDir, file);
          if (changed && existsSync(target_file_path)) {
            const data = await readFile(target_file_path, DEFAULT_ENCODING);
            await writeFile(join(bakDir, `${name}.${date}.json`), data);
          }
          await writeFile(target_file_path, JSON.stringify(json, null, 2));
        }),
      );
    } catch (error) {
      logger.error(`exception from write mapping json: ${error}`);
      process.exit();
    }
  } catch (e) {
    logger.error(`gen files error: ${e}`);
    process.exit();
  } finally {
    logger.groupEnd();
  }
};

export default travesAll;