
// Reference point: https://www.youtube.com/watch?v=aXAQ_ZVFI5Q
// Actual reference point for the toolbar is just what HackMD uses...

import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createRangeSelection, $getSelection, $isRangeSelection, $setSelection, $isTextNode, $createTextNode, $getRoot, COMMAND_PRIORITY_CRITICAL, $isParagraphNode } from "lexical";



/* ^ NOTE-TO-SELF:
- $getSelection is pretty self explanatory
- $isRangeSelection is a type-checking function verifying the current selection is a range selection. (Empty highlighted space counts). 
- COMMAND_PRIORITY_CRITICAL is a constant that defines priority level for commands sent to the editor, and it's wanted here
since it's important for ensuring these formatting operations take precedence. */

function Toolbar() {
    // The line below is useful for applying the styling changes in the toolbar:
    const[editor] = useLexicalComposerContext();

    /* With the toolbar I create for the text entry area, I don't want the "bold", "italic", and "strikethrough" 
    buttons to apply the styling directly over the text being typed, instead I want the Markdown formatting for those
    stylings to be applied over the space. This function does that: */ 
    const applyMarkdownFormatBIS = (wrapper1, wrapper2) => {
        editor.update(() => {
            const selection = $getSelection();

            if($isRangeSelection(selection)) {
                const selectedText = selection.getTextContent();
                const wrappedText = `${wrapper1}${selectedText}${wrapper2}`;
                selection.insertText(wrappedText);
            }
        });
    };

    // Sep Function for applying "Heading" since it works differently than the others (prepends a "# " string and "builds" on repeated clicks):
    const applyMarkdownFormatHead = (editor) => {
        editor.update(() => {
            const selection = $getSelection();

            if($isRangeSelection(selection)) {
                // Get the current line:
                const currentLine = selection.anchor.getNode();
                const currentLineT = currentLine.getTextContent();  // DEBUG: Think the past two lines might've been redundant (could've just done "selection.getTextContent()").
                let updatedLineT = null;
                
                /* So I want to count the number of "#" characters at the start of this line.
                And I only want to truly consider them if the substring of # characters is followed by a whitespace.
                If it's followed by anything else -- as per how it functions on HackMD -- they aren't counted as part of the heading config.
                Also HackMD only counts the first 6 # characters "stacked" together (so that's the deepest depth).
                - So if it's "###### text" on the line and the user selects "H" button, then it wipes those #s entirely.
                - If there is <6 #s, it "stacks" and if there are >6 #s, it prepends "# "
                - Something like #######text is treated as any arbitrary string (we prepend "# "). */
                const hashMatch = currentLineT.match(/^(#+)(\s?)/);
                const hashCount = hashMatch ? hashMatch[1].length: 0;
                const wSpaceSuffix = hashMatch ? hashMatch[2] === " " : false;
                console.log("Line \"" + currentLineT + "\" targeted with adding of Header symbol. There are " + hashCount + " #s and whitespace suffix status: " + wSpaceSuffix);

                if(!wSpaceSuffix) {
                    updatedLineT = "# " + currentLineT;         // "# " is prepended to the line.
                    console.log("Line targeted for adding Header symbol will have \"# \" prepended. (No discernable whitespace prefix following possible #s).");
                }else if(wSpaceSuffix && hashCount < 6) {
                    updatedLineT = "#" + currentLineT;          // "#" is prepended to the line.
                    console.log("Line targeted for adding Header symbol will have \"#\" prepended. (Existing #(s)whitespace detected).");
                } else if (wSpaceSuffix && hashCount === 6) {
                    updatedLineT = currentLineT.slice(7);       // trim out the "###### " line prefix.
                    console.log("Line targeted for adding Header symbol will trim its #+ prefix. (Maximum depth of #s is 6).");
                } else {
                    updatedLineT = "# " + currentLineT;         // >6 #s with whitespace will be treated as an irrelevant string.
                    console.log("Line targeted for adding Header symbol will have \"#\" prepended. (No pre-existing #+whitespace present).");
                }

                /* UPDATE: This was a major pain to figure out...
                So "updatedLineT" will have the correct string to replace the current text editor line of (the logic is sound)
                but I can't directly interact with currentLine to do this ("setTextContent" doesn't work with this type of node I guess).
                Instead, a workaround I found was to play around with variable "selection":
                1. I basically want to get rid of the text content of "selection" and then replace it with updateLineT.
                2. I can do this with deleteLine(false) followed by deleteLine(true) -- deleting forwards and then backwards 
                from the cursor position in the line -- which must be in this order strictly. After -> selection.insertText(updatedLineT).
                3. Now, there's an edge case regarding if text in the line was highlighted when the H button was clicked. My workaround 
                was just to delete that highlighted text first with deleteLine() before just repeating the previous step.
                4. There's also the edge case where the entire line was highlighted -- in that case I need to check for that and skip step 2. */
        
                const {anchor, focus} = selection;
                const anchorNode = anchor.getNode();
                const focusNode = focus.getNode();

                // Checking to see if text in a line was highlighted when the H button was pressed:
                if(anchor.offset !== focus.offset || anchor.getNode() !== focus.getNode()) {
                    selection.deleteLine();

                    // Checking to see if the highlighted text corresponded to the WHOLE line:
                    if(anchorNode === focusNode) {
                        const parentNode = anchorNode.getParent();
                        if(parentNode) {
                            // DEBUG: Honestly got ChatGPT to help me out with the next two lines -- come back and grasp this stuff later.
                            /* NOTE-TO-SELF: So the allTextNodes.every(...) line is basically comparing every node of the "Line" I'm
                            targeting and doing a SIMULTANEOUS comparison with the anchorNode's text content (which is just the line itself).
                            Basically, it's just a fancy looking equivalence check -- don't read into it like it's a iterative thing. */
                            const allTextNodes = parentNode.getChildren();
                            const isWholeLineSelected = allTextNodes.every(node => node.getTextContent() === anchorNode.getTextContent());
                            if(!isWholeLineSelected) {
                                // So if the whole line is selected, there is nothing more to do, but if not, then trimming is needed:
                                selection.deleteLine(false);
                                selection.deleteLine(true);
                            }
                        }
                    }
                } else {
                    // Updated the targeted line with the appropriate heading format:
                    selection.deleteLine(false);
                    selection.deleteLine(true);
                }
                selection.insertText(updatedLineT);

                /* REMINDER: Okay now the next edge case I want to target working on is when the user
                highlights multiple liens -- in HackDB, all those lines are given the # thing.
                But that doesn't work with mine at the moment (expectedly). 
                - I should also add the line counter thing on the left side of the screen. */

                // DEBUG: ^ Begin looking into adding both of these Thursday morning!!!
            }
        });
    };
    
    // Sep Function for applying "Code" since it also works differently (appends ```\n{text}\n``` or `{text}` depending on the situation):
    const applyMarkdownFormatCode = (editor) => {

        // Function for finding the (absolute) cursor index position within the text editor:
        function findCursorPos(paraNodes, anchorNode, anchorOffset) {
            console.log("~~~Code Button Clicked (CBC) console.log statements BEGIN (mainly of relevance if no text is highlighted)~~~");

            /* NOTE: anchorOffset is key to determining the absolute cursor position (ACP) in the text editor (its index position in the overall text display),
            but its use will depend on if anchorNode is a TextNode or not. If it does, anchorOffset gives the position of the cursor within the current
            text-editor line (a non-empty text line). Otherwise, the cursor position is on an empty line and anchorOffset's value is less immediately useful,
            but can still be used to determine ACP. */
            if($isTextNode(anchorNode)) {
                console.log("CBC: Anchor Node is a Text Node. The cursor is within a text line.");
            } else {
                console.log("CBC: Anchor Node is not a Text Node. The cursor is within an empty line.");
            }

            /* Lexical does not store its text-editor content as a single string, rather it partitions its content into various paragraph nodes 
            (see param "paraNodes"), which can be iterated through and inspected (for its child nodes, which are mostly TextNodes and LineBreakNodes). 
            It also does not provide explicit functions for returning specific line contents so some logic is required to extract the ACP with what is known. */

            // Variables for ACP calculation:
            let cursorPosition = 0;
            let absolutePosition = 0;
            let nodeCount = 0;
            let textNodeCount = 0;
            let lineBreakNodeC = 0;
            let keyMatch = false;

            // This if-condition is for when the cursor position is on an empty line that comprises the whole text editor (ACP is 0, no further calculations needed).
            if(!(!$isTextNode(anchorNode) && anchorOffset === 0)) {

                // NOTE: Lexical appears to always (?) store its text-editor content in *one* specific paragraph node.
                for(const paragraph of paraNodes) {
                    if(paragraph.getChildren()) {
                        const paraChildren = paragraph.getChildren();

                        /* Throughout the paragraph node iteration, as its children are inspected, a count is kept of nodes traversed.
                        This is important for ACP calculation and determining when traversal should stop based on the values passed as arguments
                        (this is how we determine at what point we "meet" the line in which the cursor position was positioned). */
                        for(let i = 0; i < paraChildren.length; i++) {
                            nodeCount += 1;
                            const paraChild = paraChildren[i];

                            if($isTextNode(paraChild)) {
                                textNodeCount += 1;

                                /* When anchorNode is a TextElement, then anchorNode.getKey() will have the same key value as the TextNode which 
                                refers to the text line in which the cursor position was positioned. */
                                if(anchorNode.getKey() === paraChild.getKey()) {
                                    // anchorOffset will be line index and lineBreakNodeC will be all the prior \n characters traversed. (These aren't stored in TextNodes).
                                    cursorPosition += (anchorOffset + lineBreakNodeC);
                                    keyMatch = true;
                                    break;  // stop traversal.
                                }
                                cursorPosition += paraChild.getTextContent().length;
                            } else {
                                lineBreakNodeC += 1;
                            }

                            /* When anchorNode is not a text node (cursor on empty line), the value of anchorOffset will refer not to
                            line index, but the newline depth of the cursor (this will correspond with nodeCount): */
                            if(!$isTextNode(anchorNode)) {
                                if(nodeCount === anchorOffset) {
                                    break;   // stop traversal.
                                }
                            }
                        }
                    }
                }
            }

            console.log("CBC: The cursor position is currently on line: ", (lineBreakNodeC + 1));
            
            // Calculating and returning the final absolute cursor position:
            if(keyMatch === true) {                
                absolutePosition = cursorPosition;
            } else {
                absolutePosition = cursorPosition + (anchorOffset - textNodeCount);
            }

            console.log("CBC: The absolute cursor position in the text editor is: ", absolutePosition);
            console.log("~~~Code Button Clicked (CBC) console.log statements END~~~");
            return absolutePosition;
        }

        // Function for finding substring (start and end) indices in a string given an "anchor" value:
        function subStrIndices(anchorVal, stringVal, subStrVal) {
            let startIndex = stringVal.indexOf(subStrVal);
            let endIndex = null;

            while(startIndex !== -1) {
                endIndex = startIndex + subStrVal.length;
                if(startIndex <= anchorVal && anchorVal <= endIndex) {
                    return { startIndexFinal: startIndex, endIndexFinal: endIndex }; 
                }
                // Finding the next occurrence (if there is any):
                startIndex = stringVal.indexOf(subStrVal, startIndex + 1);
            }
            return null;
        }

        editor.update(() => {
            /* NOTE-TO-SELF:
            - selection refers to the actual stretch of text IN the text editor "highlighted" when the button was clicked (including "" aka nothing).
            - selectedText refers to the actual string of text referred to above. */
            const selection = $getSelection();  
            const selectedText = selection.getTextContent();
            let {anchor, focus} = selection;
            let anchorNode = anchor.getNode();
            let editorTextFull = $getRoot().getTextContent();
            let editorTextLength = editorTextFull.length;
            let editorTextLastChar = editorTextFull.charAt(Math.max(editorTextLength-1, 0));
            let anchorOffset = anchor.offset;
            let wrappedText = null;
            let updatedSelection = null;
            let updatedSelectedText = null;

            /* NOTE: Calculating the current editor cursor position, at the time that this .update(...) function was invoked, is tricky.
            Despite what some sources online will say, anchor.offset *alone* won't cut it if multiple \n characters are present in your 
            text editor or if the cursor position is on an empty line. (This has to do with how Lexical partitions its text-editor text
            into seperate nodes, see more in function "findCursorPos"). */
            const paraNodes = $getRoot().getChildren(); 
            let absoluteCursorPos = findCursorPos(paraNodes, anchorNode, anchorOffset); // This var is mainly relevant if cursor selection is "" (empty).
            let cursorPosChar = editorTextFull.charAt(Math.max(absoluteCursorPos-1, 0)); 
            let newCursorPos = null;
            let newSelection = null;

            // $isRangeSelection(...) is a type-checking function, ensuring "selection" (cursor area) exists within the editor:
            if($isRangeSelection(selection)) {

                if(selectedText.includes("\n") || (selectedText === "" && (selectedText === editorTextFull || cursorPosChar === "\n" || absoluteCursorPos === 0))) {
                    // Scenario 1. If the current line is empty -> {```\n}cursor{\n```} OR multi-line text highlighted -> {```\n}text{\n```}: 
                    wrappedText = `${"```\n"}${selectedText}${"\n```"}`;
                    selection.insertText(wrappedText);

                    updatedSelection = $getSelection();
                    anchorNode = updatedSelection.anchor.getNode();
                    updatedSelectedText = String(anchorNode.getTextContent());
                    let newEditorTextFull = $getRoot().getTextContent();
                    let sStrIndices = null;

                    if(selectedText === "") {
                        /* NOTE: These subsequent two lines, while they may appear redundant, are necessary for the empty string scenario.
                        Otherwise, I will face the "Lexical Error: TypeError: anchorNode.selectionTransform is not a function" error. Despite
                        what I've read on the internet about not being able to "refresh" the editor content until the update function finishes,
                        the three steps below (mostly the first two) will infact "re-get" the selection content post-insertText(). */
                        
                        if(updatedSelectedText === "```\n\n```") {
                            newCursorPos = updatedSelectedText.length - 4;
                        } else {
                            /* Repositioning the cursor index when the insertText is invoked on a line that is *not* the latest empty line
                            in the text editor is tricky. My solution is verbose but works: The text editor content is broken up into nodes 
                            (the full text content is partitioned) and I need to reposition the cursor within the specific node that is being
                            dealt with. I can do this by finding the start and end indices of said node's string within the complete editor text,
                            figuring out if it's correct via absoluteCursorPosition, and then repositioning the cursor based on those values alone. */
                            // EDIT: ^ I re-use this a few times, so created an external function for it... [subStringIndices(...)]

                            sStrIndices = subStrIndices(absoluteCursorPos, newEditorTextFull, updatedSelectedText);
                            newCursorPos = (absoluteCursorPos + 4) - sStrIndices.startIndexFinal;
                        }
                    } else {
                        // Scenario 1b (multi-line highlighted):
                        let absCursorPosAdjust = absoluteCursorPos + 4;

                        sStrIndices = subStrIndices(absCursorPosAdjust, newEditorTextFull, updatedSelectedText);
                        newCursorPos = absCursorPosAdjust - sStrIndices.startIndexFinal + 1;
                    }
                } else {
                    // This "else" branch will catch all scenarios where the line is NOT empty.

                    if(selectedText !== "") {
                        // Scenario 2. There is highlighted text ->{`}highlighted_text{`} (also NOTE: cursor would be moved prior to the second {`}):
                        wrappedText = `${"`"}${selectedText}${"`"}`;  
                    } else {
                        // Scenario 3. No highlighted text but the line is NOT empty (and cursor is not at the start) -> existing_line{`cursor_pos`}:
                        wrappedText = `${selectedText}${"``"}`;
                    }
                    selection.insertText(wrappedText);

                    // Since the "else" branch deals with single-line scenarios, anchor.offset *will* refer to the cursor position (within the line).
                    newCursorPos = selection.anchor.offset - 1;
                }

                newSelection = $createRangeSelection();
                newSelection.setTextNodeRange(anchorNode, newCursorPos, anchorNode, newCursorPos);
                $setSelection(newSelection);
            }
        })
    }






















    return (<div>
        {/* Creating the button that responds to "bold" */}
        <button onClick={()=>{
            applyMarkdownFormatBIS("**","**")
        }}>B</button>
        {/* Creating the button that responds to "italic" */}
        <button onClick={()=>{
            applyMarkdownFormatBIS("*","*")
        }}>I</button>
        {/* Creating the button that responds to "strikethrough" */}
        <button onClick={()=>{
            applyMarkdownFormatBIS("~~","~~")
        }}>S</button>

        {/* Creating the button that responds to "header" (will require a separate function than those above) */}
        <button onClick={()=>{
            applyMarkdownFormatHead(editor)
        }}>H</button>

        {/* Creating the button that responds to "code" (adding the ```code``` etc block thing, which will require a seperate function) */}
        <button onClick={()=>{
            applyMarkdownFormatCode(editor)
        }}>&#60;/&#62;</button>













        {/* Some things I'm going to need to tweak for the other buttons I have to implement...
        - So for the Code [</>] button, I am going to need a new function because {```\n}text{\n```} is only supposed to
        be a thing for when the current line is an empty line. Otherwise, I'm looking to do {`}text{`}... 
        
        - For the Quote [""] button, I'm just adding a ">" symbol at the start of the line regardless of if current line is empty or not. (Easy).
        (Granted, when I press enter and go to new line, that line will start off with a ">" unless I press enter/newline again which will clear
        the > on the current line, and so on).
        
        - For the Generic List [idk] button, I'm doing the same as the Quote button but with the * symbol (same enter/newline situation).

        - For the Numbered List [123] button, I'm doing the same as the two above BUT with "123...(etc)" (same enter/newline situation 
        BUT the numbers escalate upwards of course. Now if I stop at like 3 or something and re-click the button, it just starts again at 1).

        - For the Check List button, I'm just doing the same as Quote and Generic List with "- [ ]" showing up at the start of the line.
        
        - For the Create Link button, I'm just adding "[](https://)" to the text (after current selection) unless I've highlighted some text,
        in which case that highlighted text goes within the [] enclosing (i.e., [highlighted-text]).

        - For the Insert Table button, I'm doing some wacky stuff (way too much to add here just look at HackMD for what I'm doing).
        - For the Insert Horizontal Line button, ^ basically same idea.
        - For the Leave Comment button, bit more complicated so just go see the HackMD stuff.

        - I can leave the Insert Image button last because there's extra work that needs to go into that...
        */}


    </div>);
}

export default Toolbar;
