
// Reference point: https://www.youtube.com/watch?v=aXAQ_ZVFI5Q
// Actual reference point for the toolbar is just what HackMD uses...

import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createRangeSelection, $getSelection, $isRangeSelection, $setSelection, $createTextNode, COMMAND_PRIORITY_CRITICAL } from "lexical";

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
    


























    // Sep Function for applying "Code" since it works differently depending on the context of the line:
    /* Markdown Logic:
    - If the currently selected line is an empty line, I want to append "```\n" and "\n```" to the left and right of the cursor position.
    - If the currently selected line has text (including padded whitespace), I'm just appending "`" and "`" to the right of the recent text (cursor inbetween them).
    - If the currently selected line had text highlighted, I'm just appending "`" and "`" to the left and right of the highlighted text.
    - DEBUG: For highlighted text spanning multiple lines, I'm basically just doing the first point (but come back to this).
    - DEBUG: Upon page load, I should also remember to make the editor be automatically selected (otherwise, if I just load the page
    and click the Code button nothing will happen, same with the others, but this is understandable for now). */
    // DEBUG: ^ DON'T DELETE THIS COMMENT, IT'S VALUABLE AND GOOD FOR MY README DOC!!!

    // DEBUG: When I'm done writing this function. try to break it with multi-line stuff...
    const applyMarkdownFormatCode = (editor) => {
        editor.update(() => {
            const selection = $getSelection();
            const selectedText = selection.getTextContent();
            const {anchor, focus} = selection;
            let anchorNode = anchor.getNode();
            const focusNode = focus.getNode();
            let wrappedText = null;
            let newCursorPos = null;
            let newSelection = null;

            if($isRangeSelection(selection)) {

                console.log("DEBUG: The error occurs in the condition check on line 179...");

                /* When selectedText is "", that implies that no text was highlighted (in this case anchorNode and focusNode will be the same
                since selection is collapsed). Thus, I can ensure the line is empty, and I will be applying the appropriate markdown structuring,
                by checking if selectedText is "" but moreover doing an equivalence check between it and anchorNode's text content (focusNode would work too). */
                if((selectedText === "" && selectedText === anchorNode.getTextContent()) || selectedText.includes("\n")) {
                    // Scenario 1. If the line is currently empty -> {```\n}cursor{\n```} OR multi-line text highlighted -> {```\n}text{\n```}:
                    wrappedText = `${"```\n"}${selectedText}${"\n```"}`;
                    selection.insertText(wrappedText);

                    // Moving the cursor position to just before the second set of backticks (`):
                    if(selectedText == "") {
                        // Scenario 1a (line is empty):
                        newCursorPos = String(anchorNode.getTextContent()).length - 4;

                        console.log("debug: The value of newCursorPos is: ", newCursorPos);
                        console.log("debug: The value of anchorNode.getTextContent() is: ", anchorNode.getTextContent());
                        console.log("debug: The value of anchorNode.getTextContent().length is: ", anchorNode.getTextContent().length);

                        let newTextNode = $createTextNode("");
                        anchorNode.append(newTextNode);
                        anchorNode = newTextNode;
                        const newSelectionTest = $createRangeSelection();
                        newSelectionTest.anchor.set(anchorNode.getKey(), newCursorPos, "text");
                        newSelectionTest.focus.set(anchorNode.getKey(), newCursorPos, "text");
                        $setSelection(newSelectionTest);


                        /*newSelection = $createRangeSelection();

                        console.log("DEBUG: The problem is the line below for sure...");

                        newSelection.setTextNodeRange(anchorNode, newCursorPos, anchorNode, newCursorPos);
                        $setSelection(newSelection);*/


                        return;


                        console.log("The value of newCursorPos is: ", newCursorPos);
                        console.log("The value of anchorNode is: ", anchorNode);



                        
                        /* DEBUG: Get rid of this code block below later...
                        
                        console.log("debug: The value of anchorNode.getTextContent() is: [", anchorNode.getTextContent(), "]");
                        console.log("debug: The value of anchorNode.offset is: [", anchorNode.offset, "]");
                        console.log("debug: The value of anchorNode.getTextContent().length is: [", anchorNode.getTextContent().length.text, "]");

                        let textbuffer = anchorNode.getTextContent();
                        console.log("DEBUG: The value of textbuffer is [", textbuffer, "]");

                        // DEBUG: trying to debug the error where anchorNode.offset/getTextContent().length returns undefined (although text does exist)...
                        console.log("debug1: ", typeof anchorNode.getTextContent());
                        console.log("debug2: ", anchorNode.getTextContent());
                        console.log("debug3: ", String(anchorNode.getTextContent()).length);
                        console.log("debug4: ", String(anchorNode.getTextContent()).trim().length);
                        console.log("ahhhhhhhhhhhhhhhhhhhhhhhhhh");
                        let text = String(anchorNode.getTextContent());
                        console.log("debag1: ", [...text].map(c => c.charCodeAt(0)));
                        console.log("debag2: ", [...text].map(c => c.charCodeAt(1)));
                        console.log("debag3: ", [...text].map(c => c.charCodeAt(2)));
                        console.log("debag4: ", [...text].map(c => c.charCodeAt(3)));
                        console.log("debag5: ", [...text].map(c => c.charCodeAt(4)));
                        console.log("debag6: ", [...text].map(c => c.charCodeAt(5)));
                        console.log("debag7: ", [...text].map(c => c.charCodeAt(6)));
                        console.log("debag8: ", [...text].map(c => c.charCodeAt(7)));*/




                        // debug: test... (get rid of the block before after)
                        /*newSelection = $createRangeSelection();
                        newSelection.setTextNodeRange(anchorNode, newCursorPos, anchorNode, newCursorPos);
                        $setSelection(newSelection);*/
                        // debug: test...

                    } else {
                        // Scenario 1b (multi-line highlighted):
                        newCursorPos = anchor.offset - (anchor.offset - wrappedText.length);    
                        
                        // wrapped.length returns wrappedText length and everything before it. <-- idk if this is true...

                        console.log("DEBUG: The value of anchor.offset is: [", anchor.offset, "]");
                        console.log("DEBUG: The value of wrappedText.length is: [", wrappedText.length, "]");
                        // DEBUG: ^ friday morning use these commands to figure out what's going on and what i can do to fix the logic -- lazy and want to watch a movie tonight.

                    }
                } else {
                    // This "else" branch will catch all scenarios where the line is NOT empty.

                    if(selectedText !== "") {
                        // Scenario 2. There is highlighted text ->{`}highlighted_text{`} (also NOTE: cursor would be moved prior to the second {`}):
                        wrappedText = `${"`"}${selectedText}${"`"}`;

                    } else {
                        // Scenario 3: No highlighted text but the line is NOT empty -> existing_line{`cursor_pos`}:
                        wrappedText = `${selectedText}${"``"}`;
                    }
                    selection.insertText(wrappedText);
                    // After inserting the new text in place of the highlighted text, the cursor position will be right after the second {`}.
                    newCursorPos = selection.anchor.offset - 1;
                }


                // Applying new cursor position using value of newCursorPos (steps are the samae for all branch-condition outcomes):
                /*newSelection = $createRangeSelection();

                console.log("DEBUG: The problem is the line below for sure...");

                newSelection.setTextNodeRange(anchorNode, newCursorPos, anchorNode, newCursorPos);
                $setSelection(newSelection);*/
                // ^ DEBUG: This conflicts with when there's an empty line and I'm clicking it for the empty line...
            }
        })
    }


    
    /* DEBUG: ^ So applyMarkdownFormatCode is basically DONE -- the only minor bug I need to tweak and adjust for is
    when I highlight the WHOLE editor space and click the code button, the cursor position isn't moving where I want it to be
    (but this is an easy fix and I should just need to change the newCursorPos assignment equation for when the selected text
    is equivalent to the entire editor!!! -- should just be subtracting by four in that scenario I'm pretty sure).
    */
    // DEBUG: ALSO ^ There's some weird behavior when I'm selecting text that has ` within it <-- look into this (but also HackMD handles this weirdly too).
    // DEBUG: Okay wait no there's still some problems with getting the cursor position where I want it to be regardless of ` characters...
    // DEBUG: ^ fix this Thursday night -- shouldn't be super hard, it's just a mathematical logic thing...




    /* Before I stop programming for the day, I want to COMPLETE the applyMarkdownFormatCode function and 
    the applyMarkdownFormatHead function -- if I can do this, it's been a day well spent. I think I can.
    I need to adjust them to be able to work with multiple lines... (NOTE: The "applyMarkdownFormatBIS" function integrates perfectly).

    - Code Button + Multiple Lines: I'm just doing {```\n}[highlighted space]{\n```} in all scenarios.
    - Header Button + Multiple Lines: I'm just adding # to each individual line encompassed in the highlighted space.
    */
























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
