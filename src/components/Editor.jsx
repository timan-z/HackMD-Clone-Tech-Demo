import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer'; 
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useRef } from 'react';
import { $getRoot, $getSelection, $isRangeSelection, $isTextNode, $setSelection, $isParagraphNode, $createRangeSelection } from 'lexical';
import { parseMarkdown } from "./MDParser.jsx";
import { findCursorPos } from './UtilityFuncs.js';
import Toolbar from "./Toolbar.jsx";

// NOTE: Following lines are for Phase 3 (Introducing Real-Time Collaboration).
import { io } from "socket.io-client";
import { throttle } from "lodash"; // Throttling needed to limit rate of function calls (specifically emits to the server).
import DiffMatchPatch from "diff-match-patch";
import { RemoteCursorNode } from './nodes/RemoteCursorNode.jsx'; // <-- DEBUG: ngl i might not need this one anymore now that i'm relaying on an overlay instead...
import { RemoteCursorOverlay } from './RemoteCursorOverlay.jsx';
const socket = io("http://localhost:4000"); // NOTE: This is what I'm picking for server port location in Server.js (maybe change it, doesn't matter, who cares).
const dmp = new DiffMatchPatch();

/* NOTE-TO-SELF:
  - LexicalComposer initializes the editor with the [theme], [namespace], and [onError] configs. (Additional plug-ins go within its tags).
  - ContentEditable is the area where the user types.
  - PlainTextPlugin is a plugin for plain-text input (better suited here for a markdown editor as opposed to something like RichTextPlugin).
  - LexicalErrorBoundary, embedded within PlainTextPlugin, will be for catching errors and preventing LexicalComposer from exploding basically.
*/

// NOTE: This is just one of the sample themes offered in the Lexical documentation: https://lexical.dev/docs/getting-started/theming
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
  nodes: [RemoteCursorNode], // DEBUG: For foreign cursor rendering... (testing)
};

// Most of the "content" of the LexicalComposer component (Text Editor) will be in this child element here:
function EditorContent() {
  const [editor] = useLexicalComposerContext();
  const [lineCount, setLineCount] = useState(1); // 1 line is the default.
  const [currentLine, setCurrentLine] = useState(1);

  // The following two const are (mainly) for the Markdown rendering effect:
  const [editorContent, setEditorContent] = useState(""); // Stores raw markdown.
  const [parsedContent, setParsedContent] = useState(""); // Stores parsed HTML.
  // The following const is for the "view mode" toggling of the webpage (regarding Text Editor and Preview Panel):
  const [viewMode, setViewMode] = useState("split"); // default state.
  // The following two const are for the "draggable" divider line I have between the Text Editor and Preview Panel in split view:
  const [editorWidth, setEditorWidth] = useState(50); // 50 is the initial width percentage...
  const isResizing = useRef(false);
  // The following consts are for Text Editor and Preview Panel customization (text zoom percentage, font and background colour):
  const [editorFont, setEditorFont] = useState("Arial"); // default font for text editor.
  const [previewFont, setPreviewFont] = useState("Arial"); // default font for preview panel.
  const [edFontSize, setEdFontSize] = useState(16); // default font size.
  const [prevFontSize, setPrevFontSize] = useState(16);
  const [editorBColour, setEditorBColour] = useState("#d3d3d3");
  const [previewBColour, setPreviewBColour] = useState("#b0c4de");
  const [editorTColour, setEditorTColour] = useState("#000000");
  const [previewTColour, setPreviewTColour] = useState("#000000");
  // The following const is for the "drag-and-drop .md files" feature for the Text Editor: 
  const [isDraggingMD, setIsDraggingMD] = useState(false);
  // The following const(s) is for rendering the cursors of the *other* clients in the Text Editor during real-time collaboration:
  const [otherCursors, setOtherCursors] = useState([]);
  const [socketID, setSocketID] = useState("");
  const cursorPos = useRef(0); // NOTE: This is needed for maintaining cursor position post-changes in collaborative editing.

  // Function for handling the webpage view toggle between the Text Editor and Preview Panel (Split, Editor, Preview):
  const handleViewChange = (mode) => {
    setViewMode(mode);
    let textEdSpace = document.getElementById("text-editor-space");
    let prevPanSpace = document.getElementById("preview-panel-space");

    if(mode === "split") {
      setEditorWidth(50); // Needed for resetting the Text Editor and Preview Panel dimensions after potential adjustments with the slider. 
      prevPanSpace.classList.remove("preview-panel-space-full"); // NOTE:+DEBUG: Maybe cast this in a JS try-block or whatever (i get console errors for doesnt exist)
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
  };

  // Function for handling the [1] "Upload File" and [2] "Download File" (both .md) functionality:
  // 1a. This function is for the actual .md file reading (opening it up, reading it, pasting to the Text Editor):
  const handleFileUploadMD = (file) => {
    // If invalid file:
    if(file.type !== "text/markdown" && !file.name.endsWith(".md")) {
      alert("Please upload a valid Markdown (.md) file."); // NOTE:+DEBUG: Just have an Alert for now..., but I want to change this to something more professional later on. (Pop-up -> click anywhere on screen to nullify).
      return;
    }
    
    // If there's existing text in the Text Editor, prompt asking if it should be replaced (Again, default "window.confirm" for now...)
    if(editorContent.trim() === "" || (editorContent.trim() !== "" && window.confirm("Replace existing content?"))) {
      /* Now I want to read the contents of file and replace the actual Text Editor content with the file contents
      (so I'm going to need to do an update() function or something like that here). */

      // Reading file contents:
      const reader = new FileReader();
      // Need to define the process here and then invoke it afterwards...
      reader.onload = () => {
        // This will get it.
        const text = reader.result;
        // Inserting it into the Lexical Text Editor:
        editor.update(() => {
          const root = $getRoot();
          root.clear(); // gets rid of current existing text.
          const selection = $getSelection();
          selection.insertText(text);
        });
      }
      // Invocation:
      reader.readAsText(file);
    }
  }
  // 1b. This function is for uploading the .md file via button:
  const handleFileUploadBtn = (event) => {
    if(!(event.target.files && event.target.files.length > 0)) {
      alert("NOTE: Something went wrong with the .md file upload.");
      return;
    }

    const fileInput = event.target;
    const file = fileInput.files[0];
    handleFileUploadMD(file);
    fileInput.value="";
  }
  // 1c. This function is for uploading the .md file via drag-and-drop into the Text Editor:
  const handleFileUploadDD = (event) => {
    event.preventDefault();
    setIsDraggingMD(false);
    const file = event.dataTransfer.files?.[0];
    if(file) handleFileUploadMD(file);
  }
  // 2. This function is for handling the download Text Editor content as .md file:
  const handleDownloadMD = () => {
    editor.update(() => {
      const root = $getRoot();
      const textEditorContent = root.getTextContent();
      if(!textEditorContent.trim()) {
        alert("The Text Editor is empty. Nothing to download at this moment!"); // NOTE:+DEBUG: I've a generic alert right now, but change this to something more formal later.
        return;
      }

      // Create a blob and use that to download:
      const blob = new Blob([textEditorContent]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my_markdown.md";  // DEBUG: Maybe give the option to name it? Or maybe I can add something later where you can *name* this session and that'll be the file name. (not high priority).
      document.body.appendChild(a);
      a.click();
      // Get rid of the stuff after:
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // PHASE-3: Const below is for wrapping an emit from useEffect Hook #2 with Throttling:
  const sendTextToServer = throttle((text) => {
    socket.emit("send-text", text);
  }, 150);  // only execute every 150ms (subsequent calls are ignored until each interval elapses).

  // PHASE-3: Const below is for wrapping an emit from useEffect Hook #2 with Throttling (once again):
  const sendCursorToServer = throttle((cursorPos) => {
    socket.emit("send-cursor-pos", cursorPos, socket.id);
  }, 100);







  // PHASE-3: Function below is for adjusting cursor position when foreign edits occur from behind that may warp/delay where it should be:
  const adjustCursorOffset = (originalOffset, diffs) => {
    // note: this function seems to work fine.
    let cursorIndex = 0;
    let adjustedOffset = originalOffset;

    console.log("DEBUG: FUNCTION \"adjustCursorOffset\" HAS BEEN ENTERED!!!");
    console.log("DEBUG: The value of diffs is => [", diffs, "]");

    for(let i = 0; i < diffs.length; i++) {
      const [op, text] = diffs[i];
      const len = text.length;
      
      if(op === 0) {
        // equality:
        cursorIndex += len;
      } else if(op === -1) {
        // deletion:
        if(cursorIndex < adjustedOffset) {
          adjustedOffset = Math.max(adjustedOffset - len, cursorIndex);
        } 
      } else if(op === 1) {
        // insertion before cursor:
        if(cursorIndex <= adjustedOffset) {
          adjustedOffset += len;
        }
        cursorIndex += len;
      }
    }
    return adjustedOffset;
  };







  // PHASE-3 UPDATE: Introducing two new "useEffect(()=>{...})" hooks for clarity as per how the Socket.IO Client-Server logic will work:
  // NOTE: Hook #1 is only supposed to run ONCE I'm pretty sure...
  // "useEffect(()=>{...})" Hook #1 - "start-up hook", for loading initial content from the server (after connecting to it for the first time).
  useEffect(() => {
    socket.on("load-document", (serverData) => {
      setEditorContent(serverData);
      setSocketID(socketID);
      // setting the text editor content to whatever was on the server (NOTE: Not exactly really relevant to me yet (?) but might be very soon):
      editor.update(() => {
        const root = $getRoot();
        root.clear(); // gets rid of current existing text.
        const selection = $getSelection();
        selection.insertText(serverData);
      });
    });

    return () => {
      socket.off("load-document");
    };
  }, [editor]);

  // "useEffect(()=>{...})" Hook #2 - "The original one", for client-instance text editor/state changes/emitting changes to server etc.
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
        //console.log("Current line count in text editor: ", lines);

        // Okay and now I'm going to write some code to detect the current line of the Text Editor!
        const paraNodes = $getRoot().getChildren();
        const selection = $getSelection();

        if(!selection) return;  // DEBUG: <-- see if this fixes my RemoteCursorNode.jsx-related problem. 

        let {anchor} = selection;
        let anchorNode = anchor.getNode();
        let anchorOffset = anchor.offset;
        let absoluteCursorPos = findCursorPos(paraNodes, anchorNode, anchorOffset); // let's see!
        //setCursorPos(absoluteCursorPos);  // <-- DEBUG: Probably fine to keep, but might not be needed *here* in relation to keeping cursor pos after foreign edits.
        cursorPos.current = absoluteCursorPos;
        //console.log("PHASE-3-DEBUG: The value of cursorPos.current is = ", cursorPos.current);

        //cursorPos.current = absoluteCursorPos;  // <-- DEBUG: ^ trying this instead now...
        
        //console.log("DEBUG-PHASE-3: The value of absoluteCursorPos is: [", absoluteCursorPos, "]");
        let textContentTrunc = textContent.slice(0, absoluteCursorPos);
        let currentLine = textContentTrunc.split("\n").length;
        //console.log("The current line is: ", currentLine);
        setCurrentLine(currentLine);

        // PHASE-3 ADDITIONS:
        sendTextToServer(textContent); // emit current Text Editor content to the server. (in external function due to throttle integration).
        sendCursorToServer(absoluteCursorPos); // emit current Text Editor cursor pos to the server. ^ again, same.
        
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

  // "useEffect(()=>{...})" Hook #3 - For listening for incoming Text Editor updates from other clients during real-time collaboration:
  useEffect(() => {
    // Receiving Text Editor updates from real-time clients:
    socket.on("receive-text", (serverData) => {
      // Before replacing the current Text Editor content, I need to save the current client's cursor position within the Editor:
      // NOTE:+PHASE-3-DEBUG: ^ Going to just try and rely on the setCursorPos state var stuff for now... if it's not reliable, COME BACK HERE!!!

      // So updates will come in the form of the Text Editor content in its entirety (replacing the existing one):
      setEditorContent((editorContent) => {
        if(editorContent === serverData) {
          return editorContent; // No update needed.
        }
        // Using diff-match-patch to check for differences:
        const diffs = dmp.diff_main(editorContent, serverData);
        const [patchedText] = dmp.patch_apply(dmp.patch_make(editorContent, diffs), editorContent);

        editor.update(() => {
          const root = $getRoot();
          root.clear(); // gets rid of current existing text.
          const selection = $getSelection();
          selection.insertText(patchedText);

          // Code below is for repositioning the cursor positions of foreign clients (post-re-render):
          const paragraph = root.getFirstChild();
          if(!$isParagraphNode(paragraph)) return;
          let {anchor} = selection;
          let anchorNode = anchor.getNode();
          
          const node = paragraph.getFirstChild();
          if(!$isTextNode(node)) return;
          const text = node.getTextContent();
          const textLength = text.length;
          console.log("debug: The value of cursorPos.current is: ", cursorPos.current);
          //console.log("debug: The value of text is: ", text);
          const newSelection = $createRangeSelection();

          if(!(cursorPos.current > textLength)) {
            newSelection.setTextNodeRange(anchorNode, cursorPos.current, anchorNode, cursorPos.current);
          } else {
            newSelection.setTextNodeRange(anchorNode, textLength, anchorNode, textLength);
          }
          $setSelection(newSelection);
        });

        // Return the new text editor content:
        return patchedText;
      });
    });

    return () => {
      socket.off("receive-text");
    };
  }, [editor]);

  // "useEffect(()=>{...})" Hook #4 - For clientCursors updates (letting us know how to update the rendering):
  useEffect(() => {
    // Receiving clientCursors (the cursor positions and IDs of all *other* clients editing the document):
    socket.on("update-cursors", (cursors) => {
      //console.log("DEBUG: Received clientCursors update! cursors = [", cursors, "]");
      //console.log("Debug: Also btw the value of socket.id is: ", socket.id);
      setOtherCursors(cursors.filter(cursor => cursor.id !== socket.id)); // The "=> cursor.id !== socket.id" part is for not including *this* client's ID.
      /* otherCursors won't automatically update to "cursors" immediately, will need to wait for the next time
      the Editor renders (which I can catch with another useEffect hook dedicated to detecting when otherCursors changes). */      
    });
    return () => {
      socket.off("update-cursors");
    };
  }, []);

  // NOTE: THIS BELOW IS MY DEBUG BUTTON <-- DEBUG: Should have it removed when I'm finished everything else in the site.
  const debugFunction = (editor, id, color, label, offset) => {
    editor.update(() => {
      console.log("test");

      /*console.log("DEBUG: The value of cursorPos.current is => [", cursorPos.current, "]");
      const text = $getRoot().getTextContent();
      console.log("DEBUG: The value of Text Editor content is => [", text, "]");
      const theChar = text.charAt(cursorPos.current);
      console.log("DEBUG: The value of theChar is => [", theChar, "]");
      if(theChar === "\n") {
        console.log("DEBUG: Damn it be a newline.");
      }*/

    });
  }



  // The three following const functions are for the "draggable" divider line between the Text Editor and Preview Panel:
  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const handleMouseMove = (event) => {
    if (isResizing.current) {
      const newWidth = (event.clientX / window.innerWidth) * 100; // debug: Convert px to %
      const clampedWidth = Math.max(30, Math.min(70, newWidth));
      setEditorWidth(clampedWidth); // debug: Clamp width between 30% - 70%
    }
  };
  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

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
    and Check List formatting (i.e., Making sure if I click enter after line "1. something", the next line begins with "2. "): */
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

        /* Logic here: I know that when the cursor is on an empty-line post-newline insertion, anchorNode.getKey() will always have value of 2
        and anchor.offset will basically correspond to all of the combined lineBreakNodes and textNodes preceding this empty line that
        the cursor currently rests on. 
        - So I can get the children of the parent node, iterate through all of them and have a counter record up to (anchor.offset - 1)
        so I know when I reach the textNode that I want to inspect (and determine if this current line should have #. prepended to it etc). */
        let prevTextNodePos = anchor.offset - 2;
        if(prevTextNodePos >= 0) {

          for(const paragraph of paraNodes) {
            if(paragraph.getChildren()) {
              const paraChildren = paragraph.getChildren();
              const paraChild = paraChildren[anchor.offset - 2];  // The prior text node will always be anchor.offset - 2 away. (post newline).

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

      {/* The horizontal bar at the top of the webpage (where the site title is, "Text Editor|Split|Preview Panel" toggles are, etc): */}
      <div className="editor-preview-overhead">
        <h1>HACKMD CLONE!!!</h1>  {/* DEBUG:+NOTE: Change this to something proper eventually... */}

        {/* The "Text Editor|Split|Preview Panel" toggles: */}
        <div className="editor-preview-toggle">
          <button onClick={()=> handleViewChange("editor-only")} disabled={viewMode==="editor-only"}>Text Editor</button>
          <button onClick={()=> handleViewChange("split")} disabled={viewMode==="split"}>Split-View</button>
          <button onClick={()=> handleViewChange("preview-only")} disabled={viewMode==="preview-only"}>Preview Panel</button>
        </div>
        {/* The "Upload File" (.md) and "Download File" (.md) buttons: */}
        <div className="editor-upload-download">
          {/* The Upload .md File Button: */}
          <input type="file" accept=".md" onChange={handleFileUploadBtn} style={{display:"none"}} id="fileInput"/>
          <label htmlFor="fileInput" className="upload-md-button">
            Upload Markdown File
          </label>

          {/* The Download Text Editor Content -> .md File Button: */}
          <button onClick={handleDownloadMD} className="download-md-button">Download as .md</button>
        </div>
      </div>

      {/* The <div> below will encase the "main body" of the webpage (the Text Editor and Preview Panel, or just one of them isolated).
      The default view will be "Split View" (both Text Editor and Preview Panel present): */}
      <div className={`editor-layout ${viewMode === "split" ? "split-view" : "full-view"}`}>

        {/* This is the wrapping for the Text Editor space: */}
        {(viewMode === "split" || viewMode === "editor-only") && (<div id="text-editor-space" className="text-editor-space-split" style={{ width: `${editorWidth}%`}}>

          <h3>Text Editor</h3>

          {/* "editor-overhead" <div> is for the horizontal bar above the Text Editor (and Toolbar) where customization options
          will be (mainly dropboxes for letting the user choose font, font-size, background-color etc): */}
          <div className="editor-overhead">
            {/* 1. Font: */}
            <label>Editor Font:
              <select onChange={(e) => setEditorFont(e.target.value)} value={editorFont}>
                <option value="Arial">Arial</option>
                <option value="Brush Script MT">Brush Script MT</option>
                <option value="Courier New">Courier New</option>
                <option value="Garamond">Garamond</option>
                <option value="Georgia">Georgia</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>

            {/* 2. Zoom Controls (for Text Editor) */}
            <button onClick={() => setEdFontSize((prev) => prev + 2)}>Zoom In</button>
            <button onClick={() => setEdFontSize((prev) => Math.max(prev - 2, 12))}>Zoom Out</button>

            {/* 3. Adding controls for changing Background Colour: */}
            <label>Background:
              <select onChange={(e) => setEditorBColour(e.target.value)} value={editorBColour}>
                <option value="#d3d3d3">Light Gray</option>
                <option value="#FFFFFF">White</option>
                <option value="#1E1E1E">Soft Black</option>
                <option value="#F5E1C0">Paper-like</option>
                <option value="#2E3B4E">Midnight Blue</option>
                <option value="#233D2C">Forest Green</option>
              </select>
            </label>

            {/* 4. Adding controls for changing Text Colour: */}
            <label>Text:
              <select onChange={(e) => setEditorTColour(e.target.value)} value={editorTColour}>
                <option value="#000000">Black</option>
                <option value="#D4D4D4">Light Gray</option>
                <option value="#5B4636">Deep Brown</option>
                <option value="#333333">Dark Gray</option>
                <option value="#E0E6F0">Ice Blue</option>
                <option value="#C8E6C9">Soft Green</option>
              </select>
            </label>

            {/* PHASE-3-DEBUG: Test button below for inserting DecoratorNode. */}
            <button onClick={() => debugFunction(editor)}>DEBUG BUTTON</button>

          </div>
          
          {/* "main-text-editor" is basically the wrapping for the actual editable text editor -- it exists mostly so that the line numbers 
          can align with the rows of the text editor (style=flex). 
          NOTE:+DEBUG: ^ Make note of this when determining if I keep or get rid of the horizontal line numbers (might be too difficult
          to incorporate the what happens when you type one continous line of text thing)... */}
          <div className="main-text-editor" style={{fontFamily: editorFont}}>

            {/* The block of code below was for the "Line Numbers" column to the left of the Text Editor: */}
            {/*<div className="line-numbers">
              {Array.from({length: lineCount}, (_,i) => (
                <div key={i+1}>{i + 1}</div>
              ))}
            </div>*/}

            {/* The actual Text Editor + configurations so I can drag and drop .md files... */}
            <div className={`editor-container ${isDraggingMD ? "dragging" : ""}`} 
            onDragOver={(e) => {e.preventDefault(); setIsDraggingMD(true);}} 
            onDragLeave={()=>setIsDraggingMD(false)}
            onDrop={handleFileUploadDD}>
                <Toolbar />

                {/* NOTE: This <div> below I have wrapping the <PlainTextPlugin/> etc is the overlay on which the foreign cursor markers
                will be dynamically rendered when multiple people are editing the same editor. I want it to be the same dimensions and
                everything as the contentEditable (which is why it has the same class), just want it to positioned relatively instead, which
                is why I have the "style={{position:"relative"}} tossed in (it overrides that one aspect). */}

                <div className={'content-editable'} style={{position:"relative"}}> 
                  {/* Need to wrap the ContentEditable inside the PlainTextPlugin (I didn't do this originally, that's why the Placeholder wasn't working). */}
                  <PlainTextPlugin
                    contentEditable={
                      <ContentEditable className={`content-editable black-outline ${isDraggingMD ? "dragging" : ""}`} onKeyDown={handleKeyInput} 
                      style={{
                        backgroundColor:editorBColour, 
                        color:editorTColour, 
                        fontSize:`${edFontSize}px`,
                      }} data-placeholder="Write your Markdown here..."/>
                    }
                    placeholder={<div className="placeholder">Write your Markdown here...</div>}
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                  <RemoteCursorOverlay editor={editor} otherCursors={otherCursors} fontSize={edFontSize}/> {/* <-- PHASE-3-DEBUG: Testing some stuff... */}
                  <HistoryPlugin/> {/* <-- Needed for Undo/Redo functionality in the Toolbar... (enables tracking or smth) */}
                </div>
                
                <div>Line Count: {lineCount} | Current Line: {currentLine}</div>
            </div>

          </div>
        </div>)}

        {/* This is the "resizable divider" between the Text Editor and the Preview Panel that can be dragged left and right
        to increase the Text Editor width/decrease the Preview Panel width and vice versa (pretty much exactly like how HackMD does it): */}
        {viewMode === "split" && <div className="resizeTEPP" onMouseDown={handleMouseDown}></div>}

        {(viewMode === "split" || viewMode === "preview-only") && (<div id="preview-panel-space" className="preview-panel-space-split" style={{ width: `${100 - editorWidth}%`}}>
          <h3>Preview</h3>
          {/* Customization bar for the Preview Panel (same as what's offered with the Text Editor): */}
          <div className="preview-overhead">
            {/* 1. For the user to toggle font selection for the Preview Panel: */}
            <label>Preview Font:
              <select onChange={(e) => setPreviewFont(e.target.value)} value={previewFont}>
                <option value="Arial">Arial</option>
                <option value="Brush Script MT">Brush Script MT</option>
                <option value="Courier New">Courier New</option>
                <option value="Garamond">Garamond</option>
                <option value="Georgia">Georgia</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>

            {/* 2. Zoom Controls (for Preview Panel) */}
            <button onClick={() => setPrevFontSize((prev) => prev + 2)}>Zoom In</button>
            <button onClick={() => setPrevFontSize((prev) => Math.max(prev - 2, 12))}>Zoom Out</button>
            {/* 3. Background Colour:*/}
            <label>Background:
              <select onChange={(e) => setPreviewBColour(e.target.value)} value={previewBColour}>
                <option value="#d3d3d3">Light Gray</option>
                <option value="#FFFFFF">White</option>
                <option value="#1E1E1E">Soft Black</option>
                <option value="#F5E1C0">Paper-like</option>
                <option value="#2E3B4E">Midnight Blue</option>
                <option value="#233D2C">Forest Green</option>
              </select>
            </label>
            {/* 4. Text Colour: */}
            <label>Text:
              <select onChange={(e) => setPreviewTColour(e.target.value)} value={previewTColour}>
                <option value="#000000">Black</option>
                <option value="#D4D4D4">Light Gray</option>
                <option value="#5B4636">Deep Brown</option>
                <option value="#333333">Dark Gray</option>
                <option value="#E0E6F0">Ice Blue</option>
                <option value="#C8E6C9">Soft Green</option>
              </select>
            </label>
          </div>

          {/* The actual Preview Panel itself: */}
          <div className="markdown-preview">
            <div className="md-preview-panel black-outline" dangerouslySetInnerHTML={{ __html: parsedContent }} style={{fontFamily: previewFont, fontSize:`${prevFontSize}px`, backgroundColor:previewBColour, color:previewTColour}}/>
          </div>
        </div>)}
        
      </div>
    </div>
  );
}

function Editor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      {/* Everything's pretty much just in EditorContent(...) */}
      <EditorContent />
    </LexicalComposer>
  );
}

export default Editor;
