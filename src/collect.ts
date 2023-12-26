class Collector {
    private book: Set<string>;
    private texts: string[];
    constructor() {
        this.book = new Set();
        this.texts = [];
    }
    record(text: string) {
        if (!this.book.has(text)) {
            this.texts.push(text);
            this.book.add(text);
        }
    }
    values() {
        return this.texts;
    }
}

export default Collector