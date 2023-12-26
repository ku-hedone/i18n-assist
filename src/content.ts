class Content {
    content: string[];
    constructor() {
        this.content = [];
    }
    clear() {
        this.content = [];
    }

    get size() {
        return this.content.length;
    }

    push(text: string) {
        this.content.push(text);
    }

    getContent() {
        return this.content;
    }
}

export default Content;