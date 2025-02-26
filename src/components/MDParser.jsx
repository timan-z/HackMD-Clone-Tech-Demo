
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks:true
}).use(markdownItTaskLists);

// This function below is supposed to take Markdown text and convert it to HTML:
export const parseMarkdown = (markdownText) => {

    console.log("parseMarkdown-DEBUG: [", JSON.stringify(markdownText), "]");
    let parsedContent = md.render(markdownText.replace(/\n/g, "<br>"));
    console.log("parsedContent-DEBUG: [", parsedContent, "]");
    return parsedContent;

    /*console.log("parseMarkdown-DEBUG: [", JSON.stringify(markdownText), "]");
    let parsedContent = md.render(markdownText);
    console.log("parsedContent-DEBUG: [", parsedContent, "]");
    console.log("parsedContentF-DEBUG: [", parsedContent.replace(/<\/p>\s*<p>/g, "<br>"), "]");
    return parsedContent.replace(/<\/p>\s*<p>/g, "<br>");*/
    // debug: trying to see if this can fix the issue with the preview panel...
    //let normalizedText = markdownText.replace(/\n{2,}/g, "\n");
    //console.log("normalizedText-DEBUG: [", normalizedText, "]");
    /*console.log("parseMarkdown-DEBUG: [", JSON.stringify(markdownText), "]");
    let parsedContent = md.render(markdownText);
    //parsedContent = parsedContent.replace(/\n/g, "<br>");
    console.log("parsedContent.replace-DEBUG: [", parsedContent, "]");
    return parsedContent;*/
    //parsedContent = parsedContent.replace(/\n/g, "<br>");
    //parsedContent = parsedContent.replace(/^<p>/, "").replace(/<\/p>\s*$/, "");
    //console.log("parsedContent-DEBUG: [", parsedContent, "]");
    //parsedContent = parsedContent.replace(/<\/p>\s*<p>/g, "<br>");
    //return parsedContent;
    /*const markdownTextFix = markdownText.replace(/\r\n/g, "\n")  // Normalize line breaks
    .replace(/\n{2,}/g, "\n\n")  // Preserve paragraphs
    .replace(/\n/g, "  \n");  // Convert single `\n` into Markdown `<br>`*/
    //return md.render(markdownTextFix);
    //return md.render(markdownText);
};
