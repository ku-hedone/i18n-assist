import OpenAI from 'openai';
import logger from './logs';
import type { ClientOptions } from 'openai';
import type { ChatCompletion } from 'openai/resources/chat/completions';

type TranslateText = { role: 'user'; content: string };

class Translator {
  private _opts: ClientOptions;
  private client: OpenAI;
  private MAX_INPUT_SIZE = 10_000;
  private MAX_INPUT_CONTENT_SIZE = this.MAX_INPUT_SIZE - 96;
  constructor(opts: ClientOptions) {
    this._opts = opts;
    this.client = new OpenAI(this._opts);
  }

  private genMessages = (text: string): TranslateText => {
    return {
      role: 'user',
      content: text,
    };
  };

  private estimateTokenSize = (texts: string[]) => {
    let totalTokens = 0;
    const messages: TranslateText[][] = [[]];
    for (const text of texts) {
      // todo: 此处的token 计算逻辑后续需替换为 js-tiktoken (https://github.com/dqbd/tiktoken/tree/main)
      /**
       *  将角色和内容都包括在内
       *
       * `'user'` 's token size  & `'content'` 's token size
       */
      let tokenSize = 6;
      // 对于中文字符，每个字符计为一个 token
      const chineseCharacters = text.match(/[\u3400-\u9FBF]/g) || [];
      // 对于非中文字符，每 4 个字符计为一个 token
      const otherCharacters = text.replace(/[\u3400-\u9FBF]/g, '');
      tokenSize += chineseCharacters.length;
      tokenSize += Math.ceil(otherCharacters.length / 4);
      /**
       * @type {role: "user", content: string }
       */
      const message = this.genMessages(text);

      if (tokenSize + totalTokens < this.MAX_INPUT_CONTENT_SIZE) {
        totalTokens += tokenSize;
        messages[messages.length - 1].push(message);
      } else {
        logger.log(
          `token size of index ${messages.length - 1} from messages: ${totalTokens}`,
        );
        messages.push([message]);
        totalTokens = tokenSize;
      }
    }
    logger.log(
      `token size of index ${messages.length - 1} from messages: ${totalTokens}`,
    );
    return messages;
  };

  private retries = async (
    messages: TranslateText[],
    system: string,
    context: Record<string, string>,
  ) => {
    const book = new Set<string>();
    messages.forEach((i) => book.add(i.content));
    const currentKeys = Object.keys(context);
    currentKeys.forEach((text) => {
      if (book.has(text)) {
        book.delete(text);
      }
    });
    const looseMessages = [...book.keys()].map((text) => this.genMessages(text));
    const looseContext = await this.execTranslate(looseMessages, system, 'retries');
    Object.assign(context, looseContext);
  };

  private execTranslate = async (
    messages: TranslateText[],
    system: string,
    from?: 'retries',
  ) => {
    const response = await this.client.chat.completions
      .create({
        model: 'gpt-3.5-turbo-1106',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: 'start' }, // 用户发出开始记忆翻译内容的指令
          ...messages,
          { role: 'user', content: 'end' }, // 用户发出结束记忆的指令
        ],
        temperature: 0,
        response_format: {
          type: 'json_object',
        },
        max_tokens: this.MAX_INPUT_SIZE,
      })
      .asResponse();
    const content = (await response.json()) as ChatCompletion;

    const context: Record<string, string> = {};
    if (from) {
      logger.group('retries');
    }
    content.choices.forEach((choice, index) => {
      logger.log(`current choice index: ${index}`);
      if (choice.message.content) {
        const content = JSON.parse(choice.message.content) as Record<string, string>;
        logger.log(`content: ${choice.message.content}`);
        Object.assign(context, content);
      }
    });
    // 增加处理 loose text 的逻辑
    if (Object.keys(context).length < messages.length) {
      this.retries(messages, system, context);
      if (from) {
        logger.groupEnd();
      }
    }
    logger.log(`token usage ${content.usage}`);
    return context;
  };

  public translation = async (TARGET_LANGUAGE: string, texts: string[]) => {
    const prompt = `You are a helpful translator. Start memorizing the text for translation when you receive a 'start' command from the user and stop when you receive an 'end' command. Translate all memorized text from Chinese to ${TARGET_LANGUAGE} and return the translations in a JSON format like { 'original text': 'translated text' }.`;
    const messages = this.estimateTokenSize(texts);
    const contexts: Record<string, string> = {};
    for await (const msgs of messages) {
      const context = await this.execTranslate(msgs, prompt);
      Object.assign(contexts, context);
    }
    return contexts;
  };
}

export default Translator;
