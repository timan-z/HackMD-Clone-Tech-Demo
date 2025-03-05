
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";
/* DEBUG: ^ Not sure why I'm getting the "... Could not find a declaration file..." prefix here,
it does seem to work and if I remove it the emote for the checkbox dissapears. */

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true
}).use(markdownItTaskLists);

// This function below is supposed to take Markdown text and convert it to HTML:
export const parseMarkdown = (markdownText) => {
    console.log("parseMarkdown-DEBUG: [", JSON.stringify(markdownText), "]");
    //let parsedContent = md.render(markdownText.replace(/\n/g, "<br>"));
    let parsedContent = md.render(markdownText);
    console.log("parsedContent-DEBUG: [", parsedContent, "]");
    return parsedContent;
};
