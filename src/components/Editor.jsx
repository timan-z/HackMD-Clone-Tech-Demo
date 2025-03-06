import React from 'react';

/* NOTE-TO-SELF: It is probably best practice to do all of these Lexical imports below individually
(specifying /react/...) -- wasted too much time figuring out why nothing was appearing
on screen when I tried to group import them all from @lexical/react smh. */

import { LexicalComposer } from '@lexical/react/LexicalComposer'; 
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

// 1. DEBUG: [1/2] Two lines below were added for the line numbering feature...
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useRef } from 'react';

import Toolbar from "./Toolbar.jsx";
import { $getRoot, $getSelection, $isRangeSelection, $isTextNode, $isLineBreakNode, RootNode } from 'lexical';

import { parseMarkdown } from "./MDParser.jsx";

/* NOTE-TO-SELF:
  - LexicalComposer initializes the editor with the [theme], [namespace], and [onError] configs. (Additional plug-ins go within its tags).
  - ContentEditable is the area where the user types.
  - PlainTextPlugin is a plugin for plain-text input (better suited here for a markdown editor as opposed to something like RichTextPlugin).
  - LexicalErrorBoundary, embedded within PlainTextPlugin, will be for catching errors and preventing LexicalComposer from exploding basically.
*/

// NOTE: This is one of the sample themes offered in the Lexical documentation: https://lexical.dev/docs/getting-started/theming
const sampleTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listItem',
    listitemChecked: 'editor-listItemChecked',
    listitemUnchecked: 'editor-listItemUnchecked',
  },
  hashtag: 'editor-hashtag',
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-textBold',
    code: 'editor-textCode',
    italic: 'editor-textItalic',
    strikethrough: 'editor-textStrikethrough',
    subscript: 'editor-textSubscript',
    superscript: 'editor-textSuperscript',
    underline: 'editor-textUnderline',
    underlineStrikethrough: 'editor-textUnderlineStrikethrough',
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
};

const initialConfig = {
  namespace: 'BaseMarkdownEditor',
  sampleTheme,
  onError: (error) => {
    console.error('Lexical Error:', error);
  },
};

// Porting somethings into a child element of the LexicalComposer component...
function EditorContent() {

  const [editor] = useLexicalComposerContext();
  const [lineCount, setLineCount] = useState(1); // 1 line is the default.

  // DEBUG: Below is for the Markdown rendering stuff:
  const [editorContent, setEditorContent] = useState(""); // Stores raw markdown.
  const [parsedContent, setParsedContent] = useState(""); // Stores parsed HTML.
  const [showPreview, setShowPreview] = useState(true); // For the Preview Panel toggling...
  // DEBUG: Above is for the Markdown rendering stuff...

  // DEBUG: Below is for the "draggable space" I've added for the Text Editor and Preview Panel...
  const [editorWidth, setEditorWidth] = useState(50); // debug: Initial width percentage
  const isResizing = useRef(false);
  // DEBUG: Above is for the "draggable space" I've added for the Text Editor and Preview Panel...

  // DEBUG: Below is for the Text Editor and Preview Panel toggle view thing:
  const [viewMode, setViewMode] = useState("split"); // default state.
  // DEBUG: Above is for the Text Editor and Preview Panel toggle view thing...







  // DEBUG: Functions below are for the Text Editor and Preview Panel toggle view thing:
  const handleViewChange = (mode) => {
    setViewMode(mode);

    let textEdSpace = document.getElementById("text-editor-space");
    let prevPanSpace = document.getElementById("preview-panel-space");


    console.log("THING-DEBUG: The value of editorWidth is: ", editorWidth);


    if(mode === "split") {

      setEditorWidth(50); // Needed for resetting the Text Editor and Preview Panel dimensions after potential adjustments with the slider. 

      prevPanSpace.classList.remove("preview-panel-space-full"); // DEBUG: Maybe cast this in a JS try-block or whatever (i get console errors for doesnt exist)
      prevPanSpace.classList.add("preview-panel-space-split");
      textEdSpace.classList.remove("text-editor-space-full");
      textEdSpace.classList.add("text-editor-space-split");
    } else if(mode === "editor-only") {

      setEditorWidth(100); // Needed to make sure the Text Editor takes up the whole thing (by scaling it up to 100%)

      textEdSpace.classList.remove("text-editor-space-split");
      textEdSpace.classList.add("text-editor-space-full");
    } else {

      setEditorWidth(0); // Needed to make sure the Preview Panel takes up the whole thing (by reducing the Text Editor to nothing).

      prevPanSpace.classList.remove("preview-panel-space-split");
      prevPanSpace.classList.add("preview-panel-space-full");
    }

    // if mode === "split"
    // if mode === "editor-only"
    // if mode === "preview-only"

  };
  // DEBUG: Functions above are for the Text Editor and Preview Panel toggle view thing...









  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        // NOTE: The stuff below is for the text editor line counter...
        /* From the Lexical documentation:
        "There is only ever a single RootNode in an EditorState and it is always at the top and it represents the contenteditable itself. 
        This means that the RootNode does not have a parent or siblings. To get the text content of the entire editor, you should use 
        rootNode.getTextContent()." <-- and by "using rootNode", seems like I'd have to invoke "$getRoot()" */
        const textContent = $getRoot().getTextContent();
        const lines = textContent.split("\n").length;
        setLineCount(lines);

        console.log("Current line count in text editor: ", lines);

        // NOTE: The stuff below is for the Markdown renderer... 
        setEditorContent(textContent);
        setParsedContent(parseMarkdown(textContent));

      });
    });

    // Clean up the listener when the component unmounts:
    return () => {
      unregister();
    };
  }, [editor]);


  // DEBUG: The const functions below are for the "draggable" space between the Text Editor and Preview Panel.
  const handleMouseDown = (event) => {
    // "handleMouseDown" as in you begin to click *down* on the "draggable" space and it's now "draggable"

    console.log("DEBUG: Mouse Down...");

    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const handleMouseMove = (event) => {
    if (isResizing.current) {

      console.log("DEBUG: Mouse Moving... ");

      const newWidth = (event.clientX / window.innerWidth) * 100; // debug: Convert px to %
      const clampedWidth = Math.max(30, Math.min(70, newWidth));

      console.log("DEBUG: ", clampedWidth);

      setEditorWidth(clampedWidth); // debug: Clamp width between 30% - 70%
    }
  };
  const handleMouseUp = () => {

    console.log("DEBUG: Mouse up...");

    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };
  // DEBUG: The const functions above are for the "draggable" space between the Text Editor and Preview Panel.

  // Configuring event listeners for certain keys:
  const handleKeyInput = (event) => {
    // Making sure that pressing the "tab" key in the text editor will work as intended (multiple spaces instead of selecting stuff in browser):
    if (event.key === "Tab") {
      event.preventDefault();
      // Code to manually add the tab space:
      editor.update(() => {
        const selection = $getSelection();
        const tabSpace = "\t";

        if($isRangeSelection(selection)) {
          const selectedText = selection.getTextContent();
          const wrappedText = `${selectedText}${tabSpace}`;
          selection.insertText(wrappedText);
        }
      });
    }
    
    /* Special handling needed for "Enter" relating to Quote, Generic List, Numbered List, 
    and Check List formatting (keeping ) */
    /* EDIT:
    Okay this is going to be a little tricky, event.preventdDefault() don't do nothing 
    so I'm going to need to get crafty here and inspect the previous line.
    */
    if (event.key === "Enter") {
      event.preventDefault(); // DEBUG: <-- does not seem to do anything lol 
      editor.update(() => {

        const selection = $getSelection();
        const {anchor} = selection;
        const selectedText = selection.getTextContent();
        const paraNodes = $getRoot().getChildren();
        let wrappedText = null;
        let symbolToPrepend = null;
        let numberToPrepend = null;

        /* GAMEPLAN:
        So I know that when the cursor is on an empty-line post-newline insertion, anchorNode.getKey() will always have value of 2
        and anchor.offset will basically correspond to all of the combined lineBreakNodes and textNodes preceding this empty line that
        the cursor currently rests on. 
        - So I can get the children of the parent node, iterate through all of them and have a counter record up to (anchor.offset - 1)
        so I know when I reach the textNode that I want to inspect...
        - Inspect the text content of said node ^ ...
        */

        let prevTextNodePos = anchor.offset - 2;
        if(prevTextNodePos >= 0) {

          for(const paragraph of paraNodes) {
            if(paragraph.getChildren()) {
              const paraChildren = paragraph.getChildren();
              const paraChild = paraChildren[anchor.offset - 2];  // TAKEAWAY: the prior text node will always be anchor.offset - 2 away. (post newline).

              if($isTextNode(paraChild)) {

                /* paraChild.getTextContent() will contain the text content of the previous text node.
                I want to now inspect its content to see if it's a string that begins with "> ", "* ", "{any number} ", or "- [ ] "
                (and from there it will be seen if there's any additional string following this starting substring, from which
                further action will be taken). */
                const isNumeric = (str) => !isNaN(str) && str.trim() !== "";
                let extractStart1 = paraChild.getTextContent().substring(0, 2);
                let extractStart2Char = paraChild.getTextContent().charAt(0);
                let startsWNumber = isNumeric(extractStart2Char);
                let extractStart2 = paraChild.getTextContent().substring(1,3);
                let extractStart3 = paraChild.getTextContent().substring(0,6);

                if(extractStart1 === "> " || extractStart1 === "* ") {
                  // If the prefix is equivalent to the whole line content, then I'm nuking that line's text content:
                  if(paraChild.getTextContent().trim() === ">" || paraChild.getTextContent().trim() === "*") {
                    paraChild.setTextContent("");
                  } else {
                    // There's something here past the prefix, so I need to make sure the current line has "> " or "* " prepended to it:
                    if(extractStart1 === "> ") {
                      symbolToPrepend = "> ";
                    } else {
                      symbolToPrepend = "* ";
                    }
                  }
                } else if(startsWNumber && extractStart2 === ". " ) {
                  if(paraChild.getTextContent().trim().length === 2) {
                    // nuke that line's text content:
                    paraChild.setTextContent("");
                  } else {
                    // There's something here past the prefix, so I need to make sure the current line has "{this line's # + 1} " prepended to it: 
                    numberToPrepend = +extractStart2Char + 1;
                    symbolToPrepend = numberToPrepend + ". ";
                  }
                } else if(extractStart3 === "- [ ] ") {
                  if(paraChild.getTextContent().trim() === "- [ ]") {
                    // nuke that line's text content:
                    paraChild.setTextContent("");
                  } else {
                    symbolToPrepend = "- [ ] ";
                  }
                } else {
                  // do nothing:
                }
              }
            }
          }
          // No point of prepending "> ", "* " etc if the previous line didn't have anything related to that:
          if(symbolToPrepend) {
            // Over here, I want to prepend the symbol to the subsequent node...
            wrappedText = `${symbolToPrepend}${selectedText}`;
            selection.insertText(wrappedText);
          }
        }
      });
    }
  }

  return(
    <div className="editor-wrapper">

      <div className="editor-preview-overhead">
        <h1>HACKMD CLONE!!!</h1>
        <div className="editor-preview-toggle">
          <button onClick={()=> handleViewChange("editor-only")} disabled={viewMode==="editor-only"}>Text Editor</button>
          <button onClick={()=> handleViewChange("split")} disabled={viewMode==="split"}>Split-View</button>
          <button onClick={()=> handleViewChange("preview-only")} disabled={viewMode==="preview-only"}>Preview Panel</button>
        </div>
      </div>

      {/* Main Layout: It's going to be split view (lhs = editable text space; rhs = "preview panel"): */}
      <div className={`editor-layout ${viewMode === "split" ? "split-view" : "full-view"}`}>

        {/* "text-editor-space" will be the wrapping for the, well, text editor space: The "Text Editor" header, toolbar, and editor space
        where the user can type their markdown text. By default, this is the left-hand side of the webpage. I want it to be organized top to bottom.
        That is, the "Text Editor" header is at the top, followed by the toolbar, and then the editor space at the bottom... (style=relative )
        DEBUG: Don't forget to tweak the CSS so it's centered as I want it, and that the editor space spans the full height of the page. */}
        
        {(viewMode === "split" || viewMode === "editor-only") && (<div id="text-editor-space" className="text-editor-space-split" style={{ width: `${editorWidth}%`}}>

          <h3>Text Editor</h3>

          <Toolbar />

          {/* DEBUG: At this moment, the Toolbar is above the <h3>Text Editor</h3> -- I want it below it... which might be tricky given
          that Toolbar isn't inserted here -- but figure out how I can rearrange things later... */}
          
          {/* "main-text-editor" is basically the wrapping for the editable text editor space -- it exists mostly so that the line numbers 
          can align with the rows of the text editor (style=flex): */}
          <div className="main-text-editor">
            <div className="line-numbers">
              {Array.from({ length: lineCount}, (_,i) => (
                <div key={i+1}>{i + 1}</div>
              ))}
            </div>

            <div className="editor-container">
                <ContentEditable className="content-editable black-outline" onKeyDown={handleKeyInput} />
                <HistoryPlugin/> {/* <-- Needed for Undo/Redo functionality in the Toolbar... (enables tracking or smth) */}
                <PlainTextPlugin
                  placeholder={<div>Write here...</div>}
                  ErrorBoundary={LexicalErrorBoundary}
                />
            </div>
          </div>
        </div>)}

        {/* Adding a "resizable divider" between the Text Editor and the Preview Panel such that I can drag it left or right
        to increase the Text Editor width/decrease the Preview Panel width or vice versa (just like HackMD does it). */}
        {viewMode === "split" && <div className="resizeTEPP" onMouseDown={handleMouseDown}></div>}

        {(viewMode === "split" || viewMode === "preview-only") && (<div id="preview-panel-space" className="preview-panel-space-split" style={{ width: `${100 - editorWidth}%`}}>
          <h3>Preview</h3>
          <div className="markdown-preview">
            <div className="md-preview-panel black-outline" dangerouslySetInnerHTML={{ __html: parsedContent }} />
          </div>
        </div>)}
        
      </div>
    </div>
  );
}

function Editor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>

      {/* NOTE-TO-SELF:
      The structure below is a little weird but the way I'm understanding it is that "<ContentEditable/>" is the main
      text-entry area and the <PlainTextPlugin> beneath basically scaffolds this area (hence "contentEditable={<ContentEditable/>")
      where "placeholder=..." is the text that appears over the text-entry area prompting input and "ErrorBoundary=..." is just
      an error-catcher that makes sure any issues with the rendering or whatnot don't crash the text editor in its entirety. 
      EDIT: Nevermind -- don't need the "contentEditable={<ContentEditable/>" (that's wrong, just adds another text space). */}
      <EditorContent />
    </LexicalComposer>
  );
}

export default Editor;
