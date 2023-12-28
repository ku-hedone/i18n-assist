# i18n-assist

`i18n-assist` 是一个强大的国际化工具，专为 React 应用设计。它使用 AST 技术自动从代码中提取符合 React-i18n 标记规范的文本，并利用 GPT API 进行高效翻译，从而简化多语言支持的实现过程。

## 特性

- **AST技术提取文本**：自动识别和提取代码中的国际化内容。
- **GPT API 翻译**：利用先进的 AI 技术进行文本翻译，确保翻译质量。
- **灵活配置**：通过 `i18n.config.json` 文件灵活配置项目国际化需求。
- **易于集成**：与现有 React 项目无缝集成。

## 安装

```bash
npm install @hedone/i18n-assist
```


## 使用指南

1. 在你的项目中创建一个 `i18n.config.json` 文件。
2. 在 `package.json` 的 `scripts` 部分添加以下脚本：

```json
"scripts": {
"i18n": "i18n-assist --p <你的i18n.config.json的路径>"
}
```
3. 通过运行以下命令来启动 `i18n-assist` 工具：
```bash
npm run i18n

```

## `i18n.config.json` 配置说明

- **root**: 项目根目录的路径。
- **filter**: 要忽略的文件或目录列表。
- **target**: 存放处理后本地化文件的目标目录。
- **backup**: 备份文件的目录。
- **initializersLocale**: 初始化的多语言字符串。
- **languages**: 目标翻译语言列表。
- **full**: 是否进行全量翻译。
- **openai**: OpenAI GPT API 配置。
- **ignoreLanguage**: 不进行翻译的语言。

## 贡献

欢迎所有形式的贡献，无论是代码、文档，还是问题反馈。请查看我们的贡献指南。

## 许可证

`i18n-assist` 根据 MIT 许可证授权。

## 致谢

特别感谢所有对 `i18n-assist` 作出贡献的开发者和社区成员。
