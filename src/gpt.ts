import OpenAI from 'openai';
import logger from './logs';
import type { ClientOptions } from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from 'openai/resources/chat/completions';

type TranslateText = { role: 'user'; content: string };

class Translator {
  private _opts: ClientOptions;
  private _reqOpts?: Omit<
    ChatCompletionCreateParamsNonStreaming,
    'max_tokens' | 'messages' | 'temperature'
  >;
  private client: OpenAI;
  private MAX_INPUT_SIZE: number;
  private MAX_INPUT_CONTENT_SIZE: number;
  private requestCount = 0;
  constructor(
    opts: ClientOptions & {
      chatCompletion?: Omit<
        ChatCompletionCreateParamsNonStreaming,
        'max_tokens' | 'messages' | 'temperature'
      >;
      contextSize?: number;
    },
  ) {
    const { chatCompletion, contextSize = 10_000, ..._opts } = opts;
    this._opts = _opts;
    this._reqOpts = chatCompletion;
    this.MAX_INPUT_SIZE = contextSize;
    this.MAX_INPUT_CONTENT_SIZE = contextSize - 165;
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
        messages.push([message]);
        totalTokens = tokenSize;
      }
    }
    logger.log(`token stack size: ${messages.length};`);
    return messages;
  };

  private retries = async (diff: string[], system: string) => {
    logger.group('retries');
    // logger.log(`messages: ${messages.map((i) => i.content).join(' | ')}, size: ${messages.length}`);
    // logger.log(`currentKeys: ${currentKeys.join(' | ')}, size: ${currentKeys.length}`);
    const looseMessages = diff.map((text) => this.genMessages(text));
    logger.log(`loose keys: ${diff.join(' | ')}, size: ${looseMessages.length}`);
    const looseContext = await this.execTranslate(looseMessages, system, 'retries');
    logger.log(`tries get loose keys: ${Object.keys(looseContext).join(' | ')}`);
    logger.groupEnd();
    return looseContext;
  };

  private execTranslate = async (
    messages: TranslateText[],
    system: string,
    from?: 'retries',
  ) => {
    if (this.requestCount <= 59) {
      const start = performance.now();
      const response = await this.client.chat.completions
        .create({
          // model: 'gpt-3.5-turbo-1106',
          model: 'gpt-3.5-turbo',
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
          ...this._reqOpts,
        })
        .asResponse();
      const end = performance.now();
      this.requestCount++;
      logger.group(`No.${this.requestCount} request cost time ${end - start}ms`);
      const content = (await response.json()) as ChatCompletion;
      const book = new Set<string>(messages.map((i) => i.content));
      const context: Record<string, string> = {};
      const res: Record<string, string>[] = [];
      content.choices.forEach((choice, index) => {
        if (choice.message.content) {
          console.log('choice.message.content', choice.message.content);
          const content = JSON.parse(choice.message.content) as Record<string, string>;
          const keys = Object.keys(content);
          // case: gpt 存在合并 输入内容的情况 ， 需要严格对比 返回的 key， 如果返回的 key 不存在 与 texts 需要删除
          // 非 | 删 | 开启
          // ->
          // 非删 | 开启
          logger.log(`No.${index} content size: ${keys.length}`);
          // todo: upgrade prompt or gpt api version ?
          keys.forEach((key) => {
            if (!book.has(key)) {
              delete content[key];
            } else {
              book.delete(key);
            }
          });
          res.push(content);
        }
      });
      // 增加处理 loose text 的逻辑
      if (book.size > 0) {
        const loose = await this.retries([...book], system);
        res.push(loose);
      }
      Object.assign(context, ...res);
      logger.log(`token usage ${JSON.stringify(content.usage)}`);
      logger.groupEnd();
      return context;
    }
    logger.log('executed too mach times');
    return {};
  };

  public translation = async (TARGET_LANGUAGE: string, texts: string[]) => {
    const prompt = `Forget all content before the current conversation. You are a helpful translator. When you receive a 'start' command from the user, begin memorizing the text for translation. Stop memorizing when you receive an 'end' command. After receiving the 'end' command, translate all memorized text from Chinese to ${TARGET_LANGUAGE}, ensuring that the translations align with common terminology used in software, computer programming, databases, and management systems. This includes using concise and widely-recognized terms for technical concepts and entities. Format the translations as a JSON object, where each key is the original Chinese text and its value is the translated text in ${TARGET_LANGUAGE}. Ensure that the JSON object strictly follows the format: { 'original text': 'translated text' }. Only return the JSON object, without any additional formatting or metadata.`;
    const messages = this.estimateTokenSize(texts);
    const contexts: Record<string, string> = {};
    const res: Record<string, string>[] = [];
    for await (const msgs of messages) {
      const context = await this.execTranslate(msgs, prompt);
      res.push(context);
    }
    Object.assign(contexts, ...res);
    logger.log(`current translate size ${res.length}`);
    return contexts;
  };
}

export default Translator;