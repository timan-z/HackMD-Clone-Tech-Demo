
// Reference point: https://www.youtube.com/watch?v=aXAQ_ZVFI5Q
// Actual reference point for the toolbar is just what HackMD uses...

import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $setSelection, COMMAND_PRIORITY_CRITICAL } from "lexical";

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
                const currentLineT = currentLine.getTextContent();
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
    
    // Sep Function for applying "Code" since it works differently depending on the context of the line:
    const applyMarkdownFormatCode = (editor) => {
        editor.update(() => {
            const selection = $getSelection();
            const selectedText = selection.getTextContent();
            let wrappedText = null;

            /* Markdown Logic:
            - If the currently selected line is an empty line, I want to append "```\n" and "\n```" to the left and right of the cursor position.
            - If the currently selected line has text (including padded whitespace), I'm just appending "`" and "`" to the right of the recent text (cursor inbetween them).
            - If the currently selected line had text highlighted, I'm just appending "`" and "`" to the left and right of the highlighted text.
            - DEBUG: For highlighted text spanning multiple lines, I'm basically just doing the first point (but come back to this).
            - DEBUG: Upon page load, I should also remember to make the editor be automatically selected (otherwise, if I just load the page
            and click the Code button nothing will happen, same with the others, but this is understandable for now).
            */
            if($isRangeSelection(selection)) {
                // Get the current line:
                const currentLine = selection.anchor.getNode();
                const currentLineF = selection.focus.getNode();
                const currentLineT = currentLine.getTextContent();

                // If the line is currently empty -> {```\n}cursor{\n```}:
                if(currentLine === "") {
                    wrappedText = `${"'```\n"}${selectedText}${"\n```"}`;
                    selection.insertText(wrappedText);
                } else {



                    // If the line is not empty and there is some text that is highlighted ->{`}highlighted_text{`}:
                    // NOTE: The cursor would be right after the last char of the highlighted text (prior to the {`})...  
                    if(currentLine.offset !== currentLineF.offset || currentLine.getNode() !== currentLineF.getNode()) {
                        // Ensuring the selection is within the same node...
                        // DEBUG: For now, I want to get single line functionality working (LEAVE MULTI-LINE FUNCTIONALITY FOR LATER!!!)
                        /*if(currentLine === currentLineF) {
                            const anchorOffset = selection.anchor.offset;
                            const focusOffset = selection.focus.offset;
                            // Determine beginning and end of the highlight selection:
                            const [start, end] = anchorOffset < focusOffset ? [anchorOffset, focusOffset] : [focusOffset, anchorOffset];

                            // Get the highlighted text:
                            const highlightedText = currentLine.getTextContent().slice(start, end);
                            // Breaking the node into three parts (1. pre-highlight part, 2. highlighted part, 3. post-highlight part):
                            const preHighlightT = currentLine.getTextContent().slice(0, start);
                            const postHighlightT = currentLine.getTextContent().slice(end);

                            // Updating the node's content:
                            selection.insertText(`${beforeText}[BEFORE]${selectedText}[AFTER]${afterText}`);
                        }*/

                        // DEBUG-SUNDAY MORNING: ^ this is probably all a load of rubbish -- I'm tired and none of this makes sense.


                    } else {
                        // If the line is non-empty and there was not any highlighted text -> line_text{``}:
                        // NOTE: The cursor would be inbetween the ` marks, so {`cursor`}...



                    }






                    /* DEBUG: Now I would need to discern how to tell the difference between an empty line
                    and a line where text is highlighted and then apply the different markdown formatting from there...
                    This should be pretty easy, but the tricky part is getting the cursor where I want it to be.

                    - ALSO don't forget Friday morning or Thursday night, I should dedicate time for learning how to 
                    properly log iteratively my work to GitHub... (This is something I *need* to get into the habit of doing). */

                    /* NOTE: I also need to take care of situations where the code button is clicked within a code block (or
                    any other type of formatting for that matter). */

                }


            }
        })
    };







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
