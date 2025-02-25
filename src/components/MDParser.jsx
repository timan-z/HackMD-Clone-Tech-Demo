
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
}).use(markdownItTaskLists);

// This function below is supposed to take Markdown text and convert it to HTML:
export const parseMarkdown = (markdownText) => {
    return md.render(markdownText);
};
